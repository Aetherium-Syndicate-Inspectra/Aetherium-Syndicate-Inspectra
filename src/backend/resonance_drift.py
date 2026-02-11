from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from src.backend.freeze_light_events import FreezeLightEventStore


def now() -> datetime:
    return datetime.now(tz=timezone.utc)


@dataclass
class ResonanceProfile:
    user_id: str
    preferred_verbosity: float = 0.7
    preferred_tone: str = "strategic"
    preferred_format: str = "mixed"
    preferred_evidence: str = "number"
    resonance_history: list[dict[str, Any]] = field(default_factory=list)
    current_resonance_score: float = 0.0
    drift_threshold: float = 0.15
    detection_window: int = 5
    switch_count: int = 0
    switch_success_rate: float = 0.0
    last_switch_time: datetime | None = None
    last_switch_format: str | None = None
    last_switch_tone: str | None = None
    baseline_format: str = "mixed"
    baseline_tone: str = "strategic"
    baseline_evidence: str = "number"

    def __post_init__(self) -> None:
        self.baseline_format = self.preferred_format
        self.baseline_tone = self.preferred_tone
        self.baseline_evidence = self.preferred_evidence


class DriftDetector:
    def __init__(self, event_store: FreezeLightEventStore | None = None):
        self.event_store = event_store or FreezeLightEventStore()
        self.active_profiles: dict[str, ResonanceProfile] = {}

    def _get_profile(self, user_id: str) -> ResonanceProfile:
        if user_id not in self.active_profiles:
            self.active_profiles[user_id] = ResonanceProfile(user_id=user_id)
        return self.active_profiles[user_id]

    @staticmethod
    def _moving_average(history: list[dict[str, Any]]) -> float:
        if not history:
            return 0.0
        weighted = 0.0
        total_w = 0.0
        for idx, item in enumerate(history, start=1):
            weighted += item["score"] * idx
            total_w += idx
        return weighted / total_w

    @staticmethod
    def _score_from_feedback(feedback: float) -> float:
        return min(1.0, max(0.0, feedback))

    def _calculate_resonance_score(
        self,
        *,
        intent: str,
        response: str,
        feedback: float,
        profile: ResonanceProfile,
    ) -> float:
        del intent, response, profile
        return self._score_from_feedback(feedback)

    def record_interaction(self, user_id: str, intent: str, response: str, feedback_score: float) -> ResonanceProfile:
        profile = self._get_profile(user_id)
        resonance_score = self._calculate_resonance_score(
            intent=intent,
            response=response,
            feedback=feedback_score,
            profile=profile,
        )
        profile.resonance_history.append(
            {
                "timestamp": now(),
                "score": resonance_score,
                "format": profile.preferred_format,
                "tone": profile.preferred_tone,
                "evidence": profile.preferred_evidence,
            }
        )
        if len(profile.resonance_history) > profile.detection_window:
            profile.resonance_history.pop(0)
        profile.current_resonance_score = self._moving_average(profile.resonance_history)
        self._check_drift(profile)
        return profile

    def _check_drift(self, profile: ResonanceProfile) -> None:
        if len(profile.resonance_history) < 3:
            return
        recent = profile.resonance_history[-3:]
        older = profile.resonance_history[:-3] if len(profile.resonance_history) > 3 else profile.resonance_history
        recent_avg = sum(item["score"] for item in recent) / len(recent)
        older_avg = sum(item["score"] for item in older) / len(older) if older else recent_avg
        drift_ratio = (older_avg - recent_avg) / older_avg if older_avg > 0 else 0.0
        if drift_ratio > profile.drift_threshold:
            self._trigger_intervention(profile, drift_ratio=drift_ratio, older_avg=older_avg)

    @staticmethod
    def _select_opposite_format(current: str) -> str:
        mapping = {
            "bullet": "story",
            "story": "bullet",
            "summary": "deep",
            "deep": "summary",
            "mixed": "bullet",
        }
        return mapping.get(current, "summary")

    @staticmethod
    def _select_opposite_tone(current: str) -> str:
        mapping = {"strategic": "operational", "operational": "strategic"}
        return mapping.get(current, "strategic")

    @staticmethod
    def _select_opposite_evidence(current: str) -> str:
        mapping = {"number": "analogy", "analogy": "number", "case_study": "number"}
        return mapping.get(current, "number")

    def _trigger_intervention(self, profile: ResonanceProfile, *, drift_ratio: float, older_avg: float) -> None:
        before = {
            "format": profile.preferred_format,
            "tone": profile.preferred_tone,
            "evidence": profile.preferred_evidence,
            "avg_score": round(older_avg, 4),
        }
        profile.last_switch_time = now()
        profile.last_switch_format = profile.preferred_format
        profile.last_switch_tone = profile.preferred_tone
        profile.preferred_format = self._select_opposite_format(profile.preferred_format)
        profile.preferred_tone = self._select_opposite_tone(profile.preferred_tone)
        profile.preferred_evidence = self._select_opposite_evidence(profile.preferred_evidence)
        profile.switch_count += 1

        self._freeze_intervention(profile=profile, drift_ratio=drift_ratio, before=before)

    def _freeze_intervention(self, *, profile: ResonanceProfile, drift_ratio: float, before: dict[str, Any]) -> None:
        payload = {
            "user_id": self.event_store.anonymize_user_id(profile.user_id),
            "drift_ratio": round(drift_ratio, 4),
            "detected_at": now().isoformat(),
            "before": before,
            "after": {
                "format": profile.preferred_format,
                "tone": profile.preferred_tone,
                "evidence": profile.preferred_evidence,
                "avg_score": None,
            },
            "hypothesis": "user_overloaded_with_data",
            "effectiveness_score": None,
        }
        self.event_store.write(
            event_type="resonance.drift.intervention",
            source="resonance_drift.detector",
            payload=payload,
        )


class InterventionEvaluator:
    def __init__(self, event_store: FreezeLightEventStore | None = None):
        self.event_store = event_store or FreezeLightEventStore()

    def evaluate_switch_effectiveness(self, profile: ResonanceProfile, window_after_switch: int = 3) -> None:
        if not profile.last_switch_time:
            return
        interactions_after = [
            row for row in profile.resonance_history if row["timestamp"] > profile.last_switch_time
        ][:window_after_switch]
        if len(interactions_after) < 2:
            return
        scores_after = [row["score"] for row in interactions_after]
        is_improving = scores_after[-1] > scores_after[0]
        if profile.switch_count <= 0:
            return
        prev_total = profile.switch_success_rate * (profile.switch_count - 1)
        profile.switch_success_rate = (prev_total + (1 if is_improving else 0)) / profile.switch_count
        if not is_improving and profile.switch_count > 2:
            self._revert_to_baseline(profile)
        self._freeze_evaluation(profile=profile, scores_after=scores_after)

    @staticmethod
    def _revert_to_baseline(profile: ResonanceProfile) -> None:
        profile.preferred_format = profile.baseline_format
        profile.preferred_tone = profile.baseline_tone
        profile.preferred_evidence = profile.baseline_evidence

    def _freeze_evaluation(self, *, profile: ResonanceProfile, scores_after: list[float]) -> None:
        effectiveness = round(scores_after[-1] - scores_after[0], 4)
        recommendation = "maintain_new_format" if effectiveness > 0 else "revert_to_baseline"
        payload = {
            "user_id": self.event_store.anonymize_user_id(profile.user_id),
            "intervention_time": profile.last_switch_time.isoformat() if profile.last_switch_time else None,
            "effectiveness": effectiveness,
            "recommendation": recommendation,
        }
        self.event_store.write(
            event_type="resonance.intervention.evaluated",
            source="resonance_drift.evaluator",
            payload=payload,
        )
