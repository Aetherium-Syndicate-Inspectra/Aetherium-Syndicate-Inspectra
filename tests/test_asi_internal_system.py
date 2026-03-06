from src.backend.asi_internal_system import ASIInternalSystem, GovernanceContext, ThroughputProfile


def test_default_profile_supports_100m_events() -> None:
    profile = ThroughputProfile()

    assert profile.supports_target(100_000_000)
    assert profile.theoretical_events_per_sec() >= 100_000_000


def test_event_pipeline_generates_routing_lineage_and_stream() -> None:
    system = ASIInternalSystem()
    governance = GovernanceContext(actor_id="finance-agent-01", policy_scope="finance", trust_score=0.95)

    result = system.ingest_event(
        topic="finance.approval",
        payload={"amount": 145000, "currency": "THB"},
        governance=governance,
    )

    assert result.route_key == "finance.approval:finance"
    assert 0 <= result.shard < system.profile.partitions
    assert result.stream in {"nats", "kafka"}
    assert len(result.lineage_hash) == 64


def test_drift_monitor_updates_alert_and_shutdown_metrics() -> None:
    system = ASIInternalSystem()
    records = [
        ("ops.event", {"k": 1}, GovernanceContext(actor_id="a", trust_score=0.9)),
        ("ops.event", {"k": 2}, GovernanceContext(actor_id="b", trust_score=0.6)),
        ("ops.event", {"k": 3}, GovernanceContext(actor_id="c", trust_score=0.2)),
    ]

    processed = system.ingest_batch(records)

    assert len(processed) == 3
    report = system.architecture_report()
    assert report["operational_metrics"]["received_events"] == 3
    assert report["operational_metrics"]["alerts"] == 1
    assert report["operational_metrics"]["shutdowns"] == 1
