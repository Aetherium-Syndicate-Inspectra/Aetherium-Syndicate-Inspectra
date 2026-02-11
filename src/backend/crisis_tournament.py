from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol

from src.backend.freeze_light_events import FreezeLightEventStore


class SupportsStrategy(Protocol):
    industry: str
    ceo_id: str

    def formulate_strategy(self, *, scenario: "CrisisScenario", round: int, previous_outcome: dict[str, Any] | None) -> dict[str, Any]: ...


@dataclass
class CrisisScenario:
    scenario_id: str
    name: str = "Global Supply Shock 2026"
    description: str = "Semiconductor shortage + Logistics halt"
    industry_agnostic_params: dict[str, Any] = field(
        default_factory=lambda: {
            "severity": 0.8,
            "time_horizon": "6_months",
            "uncertainty_level": 0.6,
            "stakeholder_pressure": 0.7,
        }
    )
    industry_specific_effects: dict[str, dict[str, Any]] = field(
        default_factory=lambda: {
            "film": {
                "impact": "post_processing_delay",
                "kpi_weight": {"resilience": 0.35, "adaptability": 0.25, "resource_efficiency": 0.2, "stakeholder_trust": 0.1, "long_term_viability": 0.1},
            },
            "aerospace": {
                "impact": "titanium_shortage",
                "kpi_weight": {"resilience": 0.4, "adaptability": 0.2, "resource_efficiency": 0.1, "stakeholder_trust": 0.2, "long_term_viability": 0.1},
            },
            "medical": {
                "impact": "sterile_packaging_shortage",
                "kpi_weight": {"resilience": 0.2, "adaptability": 0.2, "resource_efficiency": 0.1, "stakeholder_trust": 0.25, "long_term_viability": 0.25},
            },
        }
    )


class CrisisTournament:
    def __init__(self, scenario: CrisisScenario, participants: list[SupportsStrategy], event_store: FreezeLightEventStore | None = None):
        self.scenario = scenario
        self.participants = participants
        self.results: dict[str, dict[str, Any]] = {}
        self.transferable_policies: list[dict[str, Any]] = []
        self.rankings: list[tuple[str, dict[str, Any]]] = []
        self.event_store = event_store or FreezeLightEventStore()

    def run(self) -> None:
        for ceo in self.participants:
            decisions: list[dict[str, Any]] = []
            for idx in range(3):
                decision = ceo.formulate_strategy(
                    scenario=self.scenario,
                    round=idx,
                    previous_outcome=decisions[-1] if decisions else None,
                )
                decisions.append(decision)
            self.results[ceo.industry] = self.evaluate_ceo_performance(ceo=ceo, decisions=decisions, scenario=self.scenario)
        self.rankings = sorted(self.results.items(), key=lambda row: row[1]["universal_score"], reverse=True)
        self.transferable_policies = PolicyTransferEngine().extract_transferable_policies(self)
        self.freeze_tournament_results()

    def evaluate_ceo_performance(self, *, ceo: SupportsStrategy, decisions: list[dict[str, Any]], scenario: CrisisScenario) -> dict[str, Any]:
        kpi = {
            "resilience": self._score_resilience(decisions),
            "adaptability": self._score_adaptability(decisions),
            "resource_efficiency": self._score_efficiency(decisions),
            "stakeholder_trust": self._score_trust(decisions),
            "long_term_viability": self._score_viability(decisions),
        }
        weights = scenario.industry_specific_effects.get(ceo.industry, {}).get("kpi_weight", {})
        industry_score = sum(kpi[name] * weights.get(name, 0.0) for name in kpi)
        universal_score = (
            kpi["resilience"] * 0.3
            + kpi["adaptability"] * 0.25
            + kpi["resource_efficiency"] * 0.2
            + kpi["stakeholder_trust"] * 0.15
            + kpi["long_term_viability"] * 0.1
        )
        return {
            "ceo_id": ceo.ceo_id,
            "kpi": kpi,
            "industry_score": round(industry_score, 4),
            "universal_score": round(universal_score, 4),
            "decisions": decisions,
        }

    @staticmethod
    def _score_resilience(decisions: list[dict[str, Any]]) -> float:
        hits = sum(1 for d in decisions if d.get("inventory_buffer") or d.get("contingency_plan"))
        return round(min(1.0, 0.5 + 0.15 * hits), 4)

    @staticmethod
    def _score_adaptability(decisions: list[dict[str, Any]]) -> float:
        hits = sum(1 for d in decisions if d.get("supplier_diversification") or d.get("workflow_reconfiguration"))
        return round(min(1.0, 0.45 + 0.18 * hits), 4)

    @staticmethod
    def _score_efficiency(decisions: list[dict[str, Any]]) -> float:
        spend_penalty = sum(float(d.get("cost_impact", 0.0)) for d in decisions) / max(len(decisions), 1)
        return round(max(0.0, min(1.0, 0.8 - spend_penalty * 0.4)), 4)

    @staticmethod
    def _score_trust(decisions: list[dict[str, Any]]) -> float:
        hits = sum(1 for d in decisions if d.get("stakeholder_communication") or d.get("regulatory_alignment"))
        return round(min(1.0, 0.5 + 0.15 * hits), 4)

    @staticmethod
    def _score_viability(decisions: list[dict[str, Any]]) -> float:
        hits = sum(1 for d in decisions if d.get("long_term_investment") or d.get("vertical_integration"))
        return round(min(1.0, 0.45 + 0.2 * hits), 4)

    def freeze_tournament_results(self) -> None:
        ranking_payload = []
        for industry, detail in self.rankings:
            ranking_payload.append(
                {
                    "industry": industry,
                    "ceo_id": detail["ceo_id"],
                    "universal_score": detail["universal_score"],
                    "key_strategy": " + ".join(sorted(self._extract_key_strategy(detail["decisions"]))),
                }
            )
        payload = {
            "tournament_id": self.scenario.scenario_id,
            "scenario": self.scenario.name,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "rankings": ranking_payload,
            "transferable_policies": [p["principle"] for p in self.transferable_policies],
        }
        self.event_store.write(
            event_type="crisis.tournament.completed",
            source="crisis_tournament.engine",
            payload=payload,
        )

    @staticmethod
    def _extract_key_strategy(decisions: list[dict[str, Any]]) -> set[str]:
        keys = {"inventory_buffer", "supplier_diversification", "vertical_integration", "demand_forecasting_under_uncertainty"}
        detected: set[str] = set()
        for decision in decisions:
            for key in keys:
                if decision.get(key):
                    detected.add(key)
        return detected


class PolicyTransferEngine:
    def __init__(self):
        self.policy_library: list[dict[str, Any]] = []

    def extract_transferable_policies(self, tournament: CrisisTournament) -> list[dict[str, Any]]:
        if not tournament.rankings:
            return []
        top_industry = tournament.rankings[0][0]
        top_decisions = tournament.results[top_industry]["decisions"]
        policies: list[dict[str, Any]] = []
        for decision in top_decisions:
            if decision.get("inventory_buffer"):
                policies.append(
                    {
                        "principle": "build_strategic_buffer",
                        "domain": "supply_chain",
                        "applicable_industries": ["film", "aerospace", "medical", "auto"],
                        "adaptation_rule": "scale_buffer_size_by_industry_volatility",
                    }
                )
            if decision.get("supplier_diversification"):
                policies.append(
                    {
                        "principle": "avoid_single_point_of_failure",
                        "domain": "procurement",
                        "applicable_industries": "all",
                        "adaptation_rule": "map_to_industry_supplier_landscape",
                    }
                )
            if decision.get("demand_forecasting_under_uncertainty"):
                policies.append(
                    {
                        "principle": "demand_forecasting_under_uncertainty",
                        "domain": "planning",
                        "applicable_industries": "all",
                        "adaptation_rule": "blend_scenario_simulation_with_bayesian_updates",
                    }
                )
        deduped: list[dict[str, Any]] = []
        seen: set[str] = set()
        for policy in policies:
            if policy["principle"] in seen:
                continue
            deduped.append(policy)
            seen.add(policy["principle"])
        self.policy_library.extend(deduped)
        return deduped
