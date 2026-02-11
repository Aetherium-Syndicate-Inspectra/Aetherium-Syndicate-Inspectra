from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.backend.resonance_feedback_loop import ResonanceFeedbackLoopOrchestrator, utc_now_iso

router = APIRouter(prefix="/api/resonance-drift", tags=["resonance-drift"])


class FeedbackIngestRequest(BaseModel):
    user_id: str = Field(min_length=1)
    intent: str = Field(min_length=1)
    response: str = Field(min_length=1)
    feedback_score: float = Field(ge=0.0, le=1.0)


class ActionOutcomeRequest(BaseModel):
    accepted: bool
    followup_feedback_score: float | None = Field(default=None, ge=0.0, le=1.0)


class ProfileConfigRequest(BaseModel):
    preferred_format: str | None = None
    preferred_tone: str | None = None
    preferred_evidence: str | None = None
    drift_threshold: float | None = Field(default=None, gt=0.0, lt=1.0)
    detection_window: int | None = Field(default=None, ge=3, le=20)


service = ResonanceFeedbackLoopOrchestrator()


@router.post("/feedback")
def ingest_feedback(payload: FeedbackIngestRequest) -> dict[str, Any]:
    snapshot = service.ingest_feedback(
        user_id=payload.user_id,
        intent=payload.intent,
        response=payload.response,
        feedback_score=payload.feedback_score,
    )
    return {
        "status": "captured",
        "captured_at": utc_now_iso(),
        "snapshot": {
            "user_id": snapshot.user_id,
            "resonance_score": snapshot.resonance_score,
            "switch_count": snapshot.switch_count,
            "switch_success_rate": snapshot.switch_success_rate,
            "current_preferences": snapshot.current_preferences,
            "pending_actions": [action.__dict__ for action in snapshot.pending_actions],
        },
    }


@router.get("/profiles/{user_id}")
def get_profile(user_id: str) -> dict[str, Any]:
    profile = service.get_profile(user_id)
    return {
        "user_id": profile.user_id,
        "current_resonance_score": round(profile.current_resonance_score, 4),
        "drift_threshold": profile.drift_threshold,
        "detection_window": profile.detection_window,
        "switch_count": profile.switch_count,
        "switch_success_rate": round(profile.switch_success_rate, 4),
        "preferences": {
            "format": profile.preferred_format,
            "tone": profile.preferred_tone,
            "evidence": profile.preferred_evidence,
        },
    }


@router.patch("/profiles/{user_id}")
def update_profile_config(user_id: str, payload: ProfileConfigRequest) -> dict[str, Any]:
    profile = service.get_profile(user_id)
    if payload.preferred_format is not None:
        profile.preferred_format = payload.preferred_format
        profile.baseline_format = payload.preferred_format
    if payload.preferred_tone is not None:
        profile.preferred_tone = payload.preferred_tone
        profile.baseline_tone = payload.preferred_tone
    if payload.preferred_evidence is not None:
        profile.preferred_evidence = payload.preferred_evidence
        profile.baseline_evidence = payload.preferred_evidence
    if payload.drift_threshold is not None:
        profile.drift_threshold = payload.drift_threshold
    if payload.detection_window is not None:
        profile.detection_window = payload.detection_window

    return {"status": "updated", "user_id": user_id}


@router.post("/profiles/{user_id}/actions/{action_id}/outcome")
def submit_action_outcome(user_id: str, action_id: str, payload: ActionOutcomeRequest) -> dict[str, Any]:
    snapshot = service.submit_action_outcome(
        user_id=user_id,
        action_id=action_id,
        accepted=payload.accepted,
        followup_feedback_score=payload.followup_feedback_score,
    )
    return {
        "status": "recorded",
        "action_id": action_id,
        "snapshot": {
            "user_id": snapshot.user_id,
            "resonance_score": snapshot.resonance_score,
            "switch_count": snapshot.switch_count,
            "switch_success_rate": snapshot.switch_success_rate,
            "current_preferences": snapshot.current_preferences,
        },
    }


@router.post("/profiles/{user_id}/actions/pull")
def pull_pending_actions(user_id: str, limit: int = 5) -> dict[str, Any]:
    actions = service.pull_pending_actions(user_id, limit=limit)
    return {
        "user_id": user_id,
        "pulled_at": utc_now_iso(),
        "actions": [action.__dict__ for action in actions],
    }
