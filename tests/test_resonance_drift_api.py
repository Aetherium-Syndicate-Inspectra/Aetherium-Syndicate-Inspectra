from src.backend.freeze_light_events import FreezeLightEventStore
from src.backend.resonance_drift import DriftDetector, InterventionEvaluator
from src.backend.resonance_feedback_loop import ResonanceFeedbackLoopOrchestrator


def test_orchestrator_builds_pending_actions_from_drift(tmp_path):
    detector = DriftDetector(event_store=FreezeLightEventStore(event_log_path=tmp_path / "events.jsonl"))
    evaluator = InterventionEvaluator(event_store=detector.event_store)
    orchestrator = ResonanceFeedbackLoopOrchestrator(detector=detector, evaluator=evaluator)

    for score in [0.95, 0.9, 0.88, 0.52, 0.41]:
        snapshot = orchestrator.ingest_feedback(
            user_id="u1",
            intent="portfolio_risk",
            response="draft",
            feedback_score=score,
        )

    assert snapshot.switch_count >= 1

    actions = orchestrator.pull_pending_actions("u1", limit=3)
    assert len(actions) >= 1
    assert actions[0].user_id == "u1"
    assert actions[0].cohort
    assert actions[0].explanation


def test_orchestrator_outcome_reverts_to_baseline_when_rejected(tmp_path):
    detector = DriftDetector(event_store=FreezeLightEventStore(event_log_path=tmp_path / "events.jsonl"))
    evaluator = InterventionEvaluator(event_store=detector.event_store)
    orchestrator = ResonanceFeedbackLoopOrchestrator(detector=detector, evaluator=evaluator)

    profile = orchestrator.get_profile("u2")
    profile.baseline_format = "summary"
    profile.baseline_tone = "strategic"
    profile.baseline_evidence = "number"
    profile.preferred_format = "deep"
    profile.preferred_tone = "operational"
    profile.preferred_evidence = "analogy"
    profile.switch_count = 1

    snapshot = orchestrator.submit_action_outcome(
        user_id="u2",
        action_id="u2:1:123",
        accepted=False,
        followup_feedback_score=None,
    )

    assert snapshot.current_preferences["format"] == "summary"
    assert snapshot.current_preferences["tone"] == "strategic"
