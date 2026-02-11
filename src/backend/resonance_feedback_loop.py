from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from src.backend.resonance_drift import DriftDetector, InterventionEvaluator, ResonanceProfile


def utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


@dataclass
class PendingIntervention:
    """Stub contract for next-step actions sent back to client feedback loop."""

    action_id: str
    user_id: str
    triggered_at: str
    previous_format: str | None
    previous_tone: str | None
    proposed_format: str
    proposed_tone: str
    proposed_evidence: str
    drift_ratio_hint: float | None = None
    cohort: str | None = None
    explanation: str | None = None


@dataclass
class FeedbackLoopSnapshot:
    """Latest compact state returned after each real-user feedback ingestion."""

    user_id: str
    resonance_score: float
    switch_count: int
    switch_success_rate: float
    current_preferences: dict[str, str]
    pending_actions: list[PendingIntervention] = field(default_factory=list)


class ResonanceFeedbackLoopOrchestrator:
    """Class stub for rapidly wiring detector output back into product feedback surfaces.

    Notes:
    - Designed as an in-memory orchestration seam. Replace store/queue with Redis or DB later.
    - Keeps implementation intentionally slim to allow fast integration with live UX events.
    """

    def __init__(self, detector: DriftDetector | None = None, evaluator: InterventionEvaluator | None = None):
        self.detector = detector or DriftDetector()
        self.evaluator = evaluator or InterventionEvaluator(event_store=self.detector.event_store, detector=self.detector)
        self._pending_actions: dict[str, list[PendingIntervention]] = {}

    def ingest_feedback(self, *, user_id: str, intent: str, response: str, feedback_score: float) -> FeedbackLoopSnapshot:
        profile = self.detector._get_profile(user_id)
        previous_switch_count = profile.switch_count
        previous_format = profile.last_switch_format or profile.preferred_format
        previous_tone = profile.last_switch_tone or profile.preferred_tone

        updated = self.detector.record_interaction(
            user_id=user_id,
            intent=intent,
            response=response,
            feedback_score=feedback_score,
        )
        self.evaluator.evaluate_switch_effectiveness(updated)

        if updated.switch_count > previous_switch_count:
            action = PendingIntervention(
                action_id=f"{user_id}:{updated.switch_count}:{int(datetime.now(tz=timezone.utc).timestamp())}",
                user_id=user_id,
                triggered_at=utc_now_iso(),
                previous_format=previous_format,
                previous_tone=previous_tone,
                proposed_format=updated.preferred_format,
                proposed_tone=updated.preferred_tone,
                proposed_evidence=updated.preferred_evidence,
                drift_ratio_hint=round(updated.last_drift_ratio, 4),
                cohort=updated.current_cohort,
                explanation=updated.last_intervention_explanation,
            )
            self._pending_actions.setdefault(user_id, []).append(action)

        return self._to_snapshot(updated)

    def get_profile(self, user_id: str) -> ResonanceProfile:
        return self.detector._get_profile(user_id)

    def pull_pending_actions(self, user_id: str, limit: int = 5) -> list[PendingIntervention]:
        actions = self._pending_actions.get(user_id, [])
        selected = actions[:limit]
        self._pending_actions[user_id] = actions[limit:]
        return selected

    def submit_action_outcome(
        self,
        *,
        user_id: str,
        action_id: str,
        accepted: bool,
        followup_feedback_score: float | None,
    ) -> FeedbackLoopSnapshot:
        profile = self.detector._get_profile(user_id)
        if accepted and followup_feedback_score is not None:
            self.detector.record_interaction(
                user_id=user_id,
                intent="feedback-loop-outcome",
                response=f"action:{action_id}:accepted",
                feedback_score=followup_feedback_score,
            )
        elif not accepted and profile.switch_count > 0:
            profile.preferred_format = profile.baseline_format
            profile.preferred_tone = profile.baseline_tone
            profile.preferred_evidence = profile.baseline_evidence

        self.evaluator.evaluate_switch_effectiveness(profile)
        return self._to_snapshot(profile)

    def _to_snapshot(self, profile: ResonanceProfile) -> FeedbackLoopSnapshot:
        return FeedbackLoopSnapshot(
            user_id=profile.user_id,
            resonance_score=round(profile.current_resonance_score, 4),
            switch_count=profile.switch_count,
            switch_success_rate=round(profile.switch_success_rate, 4),
            current_preferences={
                "format": profile.preferred_format,
                "tone": profile.preferred_tone,
                "evidence": profile.preferred_evidence,
            },
            pending_actions=list(self._pending_actions.get(profile.user_id, [])),
        )
