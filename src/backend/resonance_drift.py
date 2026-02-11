from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from math import sqrt
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
    current_cohort: str = "generic"
    last_drift_ratio: float = 0.0
    last_intervention_context: str | None = None
    last_intervention_arm: str | None = None
    last_intervention_explanation: str | None = None

    def __post_init__(self) -> None:
        self.baseline_format = self.preferred_format
        self.baseline_tone = self.preferred_tone
        self.baseline_evidence = self.preferred_evidence


class DriftDetector:
    def __init__(self, event_store: FreezeLightEventStore | None = None):
        self.event_store = event_store or FreezeLightEventStore()
        self.active_profiles: dict[str, ResonanceProfile] = {}
        self.threshold_learner = CohortAdaptiveThresholdLearner()
        self.bandit_policy = ContextualBanditPolicy()

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
        cohort_id = self._cohort_id(profile)
        adaptive_threshold = self.threshold_learner.get_threshold(cohort_id=cohort_id, fallback=profile.drift_threshold)
        profile.current_cohort = cohort_id
        profile.last_drift_ratio = drift_ratio
        if drift_ratio > adaptive_threshold:
            self._trigger_intervention(profile, drift_ratio=drift_ratio, older_avg=older_avg)
        self.threshold_learner.observe_drift(cohort_id=cohort_id, drift_ratio=drift_ratio)

    @staticmethod
    def _cohort_id(profile: ResonanceProfile) -> str:
        return f"fmt:{profile.preferred_format}|tone:{profile.preferred_tone}|evi:{profile.preferred_evidence}"

    def _trigger_intervention(self, profile: ResonanceProfile, *, drift_ratio: float, older_avg: float) -> None:
        before = {
            "format": profile.preferred_format,
            "tone": profile.preferred_tone,
            "evidence": profile.preferred_evidence,
            "avg_score": round(older_avg, 4),
        }
        context_key = f"cohort:{profile.current_cohort}|drift:{round(drift_ratio, 2)}"
        arm = self.bandit_policy.select_arm(
            context_key=context_key,
            baseline=(profile.baseline_format, profile.baseline_tone, profile.baseline_evidence),
        )
        profile.last_switch_time = now()
        profile.last_switch_format = profile.preferred_format
        profile.last_switch_tone = profile.preferred_tone
        profile.preferred_format = arm["format"]
        profile.preferred_tone = arm["tone"]
        profile.preferred_evidence = arm["evidence"]
        profile.last_intervention_context = context_key
        profile.last_intervention_arm = arm["arm_id"]
        profile.last_intervention_explanation = (
            "Intervention triggered because cohort drift ratio "
            f"({drift_ratio:.3f}) exceeded adaptive threshold "
            f"({self.threshold_learner.get_threshold(profile.current_cohort, profile.drift_threshold):.3f}); "
            f"bandit selected {arm['arm_id']} with avg reward {arm['avg_reward']:.3f}."
        )
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
            "cohort": profile.current_cohort,
            "contextual_bandit_arm": profile.last_intervention_arm,
            "explanation": profile.last_intervention_explanation,
            "hypothesis": "cohort-drift-triggered format adaptation",
            "effectiveness_score": None,
        }
        self.event_store.write(
            event_type="resonance.drift.intervention",
            source="resonance_drift.detector",
            payload=payload,
        )

    def record_intervention_reward(self, profile: ResonanceProfile, reward: float) -> None:
        if not profile.last_intervention_context or not profile.last_intervention_arm:
            return
        bounded_reward = max(-1.0, min(1.0, reward))
        self.bandit_policy.update_reward(
            context_key=profile.last_intervention_context,
            arm_id=profile.last_intervention_arm,
            reward=bounded_reward,
        )


@dataclass
class CohortStats:
    count: int = 0
    mean: float = 0.0
    m2: float = 0.0

    def update_stats(self, value: float) -> None:
        self.count += 1
        delta = value - self.mean
        self.mean += delta / self.count
        self.m2 += delta * (value - self.mean)

    @property
    def std(self) -> float:
        if self.count < 2:
            return 0.0
        return sqrt(max(self.m2 / (self.count - 1), 0.0))


class CohortAdaptiveThresholdLearner:
    def __init__(self, min_threshold: float = 0.05, max_threshold: float = 0.4, sigma_factor: float = 0.75):
        self.min_threshold = min_threshold
        self.max_threshold = max_threshold
        self.sigma_factor = sigma_factor
        self._stats: dict[str, CohortStats] = {}

    def observe_drift(self, *, cohort_id: str, drift_ratio: float) -> None:
        stats = self._stats.setdefault(cohort_id, CohortStats())
        stats.update_stats(drift_ratio)

    def get_threshold(self, cohort_id: str, fallback: float) -> float:
        stats = self._stats.get(cohort_id)
        if not stats or stats.count < 5:
            return fallback
        learned = stats.mean + (stats.std * self.sigma_factor)
        return min(self.max_threshold, max(self.min_threshold, learned))


class ContextualBanditPolicy:
    def __init__(self, exploration: float = 0.7):
        self.exploration = exploration
        self.arms = [
            {"arm_id": "summary-strategic-number", "format": "summary", "tone": "strategic", "evidence": "number"},
            {"arm_id": "deep-operational-case", "format": "deep", "tone": "operational", "evidence": "case_study"},
            {"arm_id": "story-strategic-analogy", "format": "story", "tone": "strategic", "evidence": "analogy"},
            {"arm_id": "bullet-operational-number", "format": "bullet", "tone": "operational", "evidence": "number"},
        ]
        self._arm_stats: dict[str, dict[str, dict[str, float]]] = {}
        self._step = 0

    def _context_stats(self, context_key: str) -> dict[str, dict[str, float]]:
        if context_key not in self._arm_stats:
            self._arm_stats[context_key] = {
                arm["arm_id"]: {"count": 0.0, "reward_sum": 0.0} for arm in self.arms
            }
        return self._arm_stats[context_key]

    def select_arm(self, *, context_key: str, baseline: tuple[str, str, str]) -> dict[str, Any]:
        context_stats = self._context_stats(context_key)
        self._step += 1

        best_arm: dict[str, Any] | None = None
        best_score = float("-inf")
        for arm in self.arms:
            stats = context_stats[arm["arm_id"]]
            count = stats["count"]
            avg_reward = stats["reward_sum"] / count if count > 0 else 0.0
            bonus = self.exploration * sqrt((2 * max(1.0, self._step)) / max(1.0, count))
            score = avg_reward + bonus
            if (arm["format"], arm["tone"], arm["evidence"]) == baseline:
                score -= 0.15
            if score > best_score:
                best_score = score
                best_arm = {**arm, "avg_reward": avg_reward, "score": score}

        return best_arm or {**self.arms[0], "avg_reward": 0.0, "score": 0.0}

    def update_reward(self, *, context_key: str, arm_id: str, reward: float) -> None:
        context_stats = self._context_stats(context_key)
        if arm_id not in context_stats:
            return
        context_stats[arm_id]["count"] += 1
        context_stats[arm_id]["reward_sum"] += reward


class InterventionEvaluator:
    def __init__(self, event_store: FreezeLightEventStore | None = None, detector: DriftDetector | None = None):
        self.event_store = event_store or FreezeLightEventStore()
        self.detector = detector

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
        if self.detector is not None:
            self.detector.record_intervention_reward(profile, scores_after[-1] - scores_after[0])
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
