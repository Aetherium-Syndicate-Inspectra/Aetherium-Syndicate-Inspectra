from dataclasses import dataclass
from pathlib import Path

from src.backend.crisis_tournament import CrisisScenario, CrisisTournament, formulate_strategy
from src.backend.freeze_light_events import FreezeLightEventStore


@dataclass
class StubCEO:
    industry: str
    ceo_id: str

    def __post_init__(self):
        self.formulate_strategy = formulate_strategy.__get__(self, StubCEO)


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
