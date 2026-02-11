import json
from pathlib import Path

from src.backend.causal_policy_lab import CausalPolicyLab
from src.backend.policy_genome import PolicyGenomeEngine


def _write_events(path: Path):
    rows = []
    for idx in range(60):
        treated = 1 if idx % 2 == 0 else 0
        row = {
            "event_type": "resonance.intervention.evaluated",
            "timestamp": f"2026-02-11T00:00:{idx:02d}Z",
            "payload": {
                "treatment": "auto_switch_deep" if treated else "manual",
                "stakeholder_trust": 0.55 + treated * 0.2 + (idx % 5) * 0.01,
                "adaptability": 0.5 + treated * 0.1,
                "resource_efficiency": 0.45 + treated * 0.08,
                "confounders": {
                    "load_level": idx % 3,
                    "industry": "TechSaaS" if idx % 3 else "Healthcare",
                    "scenario": "stress_test",
                },
            },
        }
        rows.append(row)
    path.write_text("\n".join(json.dumps(item) for item in rows) + "\n", encoding="utf-8")


def test_causal_policy_lab_estimate_and_recommend(tmp_path: Path):
    events_file = tmp_path / "events.jsonl"
    _write_events(events_file)
    lab = CausalPolicyLab(events_file=events_file)

    estimate = lab.estimate_causal_effect("auto_switch_deep", "stakeholder_trust")

    assert estimate["causal_effect"] is not None
    assert estimate["causal_effect"] > 0
    assert estimate["sample_size"] > 10

    recommendations = lab.recommend_policies(top_n=2)
    assert len(recommendations) <= 2
    assert all(item["effect_size"] > 0 for item in recommendations)


def test_policy_genome_engine_build_graph():
    engine = PolicyGenomeEngine(embed_dim=16)
    graph = engine.build_graph(
        [
            {"policy": "Apply auto_switch_deep to boost stakeholder_trust", "outcome": "stakeholder_trust", "effect_size": 0.22},
            {"policy": "Apply strategic_to_operational to boost resource_efficiency", "outcome": "resource_efficiency", "effect_size": 0.18},
        ]
    )

    assert graph["meta"]["node_count"] == 2
    assert graph["meta"]["embed_dim"] == 16
    assert len(graph["nodes"]) == 2
