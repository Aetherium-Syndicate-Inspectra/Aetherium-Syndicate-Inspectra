import pytest

pytest.importorskip("fastapi")

import json
from pathlib import Path

from fastapi.testclient import TestClient

from api_gateway import main
from src.backend.causal_policy_lab import CausalPolicyLab


def _seed_events(path: Path):
    items = []
    for idx in range(40):
        treated = idx % 2 == 0
        items.append(
            {
                "event_type": "resonance.intervention.evaluated",
                "timestamp": f"2026-02-11T01:00:{idx:02d}Z",
                "payload": {
                    "treatment": "auto_switch_deep" if treated else "manual",
                    "stakeholder_trust": 0.4 + (0.25 if treated else 0.05),
                    "adaptability": 0.3 + (0.15 if treated else 0.02),
                    "resource_efficiency": 0.35 + (0.2 if treated else 0.01),
                    "confounders": {
                        "load_level": idx % 4,
                        "industry": "Energy" if idx % 3 else "TechSaaS",
                        "scenario": "api_test",
                    },
                },
            }
        )
    path.write_text("\n".join(json.dumps(row) for row in items) + "\n", encoding="utf-8")


def test_causal_and_policy_genome_endpoints(tmp_path: Path):
    events_file = tmp_path / "events.jsonl"
    _seed_events(events_file)

    original_lab = main.causal_lab
    try:
        main.causal_lab = CausalPolicyLab(events_file=events_file)
        client = TestClient(main.app)

        estimate = client.post("/causal/estimate", json={"treatment": "auto_switch_deep", "outcome": "stakeholder_trust"})
        assert estimate.status_code == 200
        assert estimate.json()["causal_effect"] is not None

        recommend = client.get("/causal/recommend?top_n=2")
        assert recommend.status_code == 200
        assert len(recommend.json()["recommendations"]) <= 2

        genome = client.post("/policy-genome/build", json={"top_n": 2})
        assert genome.status_code == 200
        payload = genome.json()
        assert payload["meta"]["node_count"] >= 1
    finally:
        main.causal_lab = original_lab
