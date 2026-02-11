from dataclasses import dataclass
from pathlib import Path

from src.backend.crisis_tournament import CrisisScenario, CrisisTournament
from src.backend.freeze_light_events import FreezeLightEventStore


@dataclass
class StubCEO:
    industry: str
    ceo_id: str

    def formulate_strategy(self, *, scenario, round: int, previous_outcome=None):
        del scenario, previous_outcome
        if self.industry == "aerospace":
            return {
                "inventory_buffer": True,
                "supplier_diversification": True,
                "vertical_integration": round == 2,
                "stakeholder_communication": True,
                "cost_impact": 0.2,
            }
        if self.industry == "medical":
            return {
                "regulatory_alignment": True,
                "supplier_diversification": round > 0,
                "demand_forecasting_under_uncertainty": True,
                "cost_impact": 0.3,
            }
        return {
            "workflow_reconfiguration": True,
            "stakeholder_communication": True,
            "cost_impact": 0.35,
        }


def test_crisis_tournament_ranking_transfer_and_freeze_event(tmp_path: Path):
    store = FreezeLightEventStore(event_log_path=tmp_path / "events.jsonl")
    scenario = CrisisScenario(scenario_id="tsunami_2026_01")
    participants = [
        StubCEO(industry="film", ceo_id="agent_ceo_fl9"),
        StubCEO(industry="aerospace", ceo_id="agent_ceo_ax7"),
        StubCEO(industry="medical", ceo_id="agent_ceo_md3"),
    ]
    tournament = CrisisTournament(scenario=scenario, participants=participants, event_store=store)

    tournament.run()

    assert len(tournament.rankings) == 3
    assert tournament.rankings[0][0] in {"aerospace", "medical", "film"}
    principles = {policy["principle"] for policy in tournament.transferable_policies}
    assert "avoid_single_point_of_failure" in principles

    events = store.read_all()
    assert any(evt["event_type"] == "crisis.tournament.completed" for evt in events)
