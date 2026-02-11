from pathlib import Path

from src.backend.freeze_light_events import FreezeLightEventStore
from src.backend.resonance_drift import DriftDetector, InterventionEvaluator, ResonanceProfile


def test_drift_detector_triggers_intervention_and_logs_event(tmp_path: Path):
    store = FreezeLightEventStore(event_log_path=tmp_path / "events.jsonl")
    detector = DriftDetector(event_store=store)
    profile = detector._get_profile("somchai")
    profile.preferred_format = "bullet"
    profile.preferred_tone = "operational"
    profile.preferred_evidence = "number"

    for score in [0.95, 0.9, 0.88, 0.5, 0.45]:
        detector.record_interaction("somchai", "budget plan", "response", score)

    assert profile.switch_count >= 1
    assert profile.preferred_format in {"story", "bullet", "summary"}
    events = store.read_all()
    assert any(evt["event_type"] == "resonance.drift.intervention" for evt in events)


def test_intervention_evaluator_reverts_after_failures_and_logs(tmp_path: Path):
    store = FreezeLightEventStore(event_log_path=tmp_path / "events.jsonl")
    evaluator = InterventionEvaluator(event_store=store)

    profile = ResonanceProfile(user_id="somying", preferred_format="story", preferred_tone="strategic", preferred_evidence="analogy")
    profile.switch_count = 3
    profile.preferred_format = "bullet"
    profile.preferred_tone = "operational"
    profile.preferred_evidence = "number"

    # post-switch degraded trend
    from datetime import datetime, timedelta, timezone

    t0 = datetime.now(tz=timezone.utc) - timedelta(seconds=4)
    profile.last_switch_time = t0
    profile.resonance_history = [
        {"timestamp": t0 + timedelta(seconds=1), "score": 0.6},
        {"timestamp": t0 + timedelta(seconds=2), "score": 0.42},
        {"timestamp": t0 + timedelta(seconds=3), "score": 0.4},
    ]

    evaluator.evaluate_switch_effectiveness(profile)

    assert profile.preferred_format == profile.baseline_format
    events = store.read_all()
    assert any(evt["event_type"] == "resonance.intervention.evaluated" for evt in events)
