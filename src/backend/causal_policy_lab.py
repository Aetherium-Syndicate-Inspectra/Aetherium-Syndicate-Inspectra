from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:  # Optional dependency (recommended path)
    import pandas as pd
    from dowhy import CausalModel
except Exception:  # pragma: no cover - optional branch
    pd = None
    CausalModel = None


DEFAULT_EVENTS_PATH = Path("storage/frozen_lights/events.jsonl")
DEFAULT_RELEVANT_EVENTS = {
    "resonance.drift.intervention",
    "resonance.intervention.evaluated",
    "crisis.tournament.completed",
}


@dataclass
class EstimateResult:
    causal_effect: float | None
    method: str
    interpretation: str
    sample_size: int
    refute_results: dict[str, Any] | None = None
    error: str | None = None


class CausalPolicyLab:
    def __init__(self, events_file: str | Path = DEFAULT_EVENTS_PATH):
        self.events_file = Path(events_file)
        self.rows = self.load_events()

    def load_events(self) -> list[dict[str, Any]]:
        if not self.events_file.exists():
            return []
        rows: list[dict[str, Any]] = []
        for line in self.events_file.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            payload = json.loads(line)
            if payload.get("event_type") not in DEFAULT_RELEVANT_EVENTS:
                continue
            row: dict[str, Any] = {
                "event_type": payload.get("event_type"),
                "timestamp": payload.get("timestamp"),
            }
            embedded = payload.get("payload", {})
            if isinstance(embedded, dict):
                row.update(embedded)
            if "confounders" in row and isinstance(row["confounders"], dict):
                row.update(row.pop("confounders"))
            rows.append(row)
        return rows

    def estimate_causal_effect(
        self,
        treatment: str,
        outcome: str,
        common_causes: list[str] | None = None,
        method: str = "propensity_score_matching",
    ) -> dict[str, Any]:
        common_causes = common_causes or ["load_level", "industry", "scenario"]
        if not self.rows:
            return EstimateResult(
                causal_effect=None,
                method=method,
                interpretation="No rows available in events store.",
                sample_size=0,
                error="No data loaded",
            ).__dict__

        if CausalModel and pd is not None:
            try:
                return self._estimate_with_dowhy(treatment, outcome, common_causes, method)
            except Exception:
                pass

        return self._estimate_with_adjustment(treatment, outcome, common_causes)

    def _estimate_with_dowhy(self, treatment: str, outcome: str, common_causes: list[str], method: str) -> dict[str, Any]:
        frame_rows = self._prepare_rows(treatment=treatment, outcome=outcome, common_causes=common_causes)
        if len(frame_rows) < 5:
            return EstimateResult(
                causal_effect=None,
                method=f"dowhy.{method}",
                interpretation="Insufficient rows for causal estimation.",
                sample_size=len(frame_rows),
                error="Insufficient data",
            ).__dict__

        frame = pd.DataFrame(frame_rows)
        graph = "digraph {__treatment__ -> __outcome__;" + " ".join(
            [f"{cause} -> __treatment__; {cause} -> __outcome__;" for cause in common_causes if cause in frame.columns]
        ) + "}"
        model = CausalModel(
            data=frame,
            treatment="__treatment__",
            outcome="__outcome__",
            graph=graph,
            common_causes=[c for c in common_causes if c in frame.columns],
            proceed_when_unidentifiable=True,
        )
        identified = model.identify_effect()
        estimate = model.estimate_effect(
            identified,
            method_name=f"backdoor.{method}",
            confidence_intervals=False,
        )
        refute = model.refute_estimate(identified, estimate, "random_common_cause")
        effect_value = float(estimate.value)
        return EstimateResult(
            causal_effect=effect_value,
            method=f"dowhy.{method}",
            interpretation=f"Positive value means `{treatment}` improves `{outcome}` by {effect_value:.4f} units.",
            sample_size=len(frame_rows),
            refute_results={"method": "random_common_cause", "result": str(refute)},
        ).__dict__

    def _estimate_with_adjustment(self, treatment: str, outcome: str, common_causes: list[str]) -> dict[str, Any]:
        prepared = self._prepare_rows(treatment=treatment, outcome=outcome, common_causes=common_causes)
        if len(prepared) < 5:
            return EstimateResult(
                causal_effect=None,
                method="adjusted_ols",
                interpretation="Insufficient rows for causal estimation.",
                sample_size=len(prepared),
                error="Insufficient data",
            ).__dict__

        effect = _ols_treatment_effect(prepared, "__treatment__", "__outcome__", common_causes)
        refute = self._random_refute(prepared, common_causes)
        return EstimateResult(
            causal_effect=effect,
            method="adjusted_ols",
            interpretation=f"Approximate adjusted effect for `{treatment}` on `{outcome}` is {effect:.4f}.",
            sample_size=len(prepared),
            refute_results=refute,
        ).__dict__

    def _prepare_rows(self, *, treatment: str, outcome: str, common_causes: list[str]) -> list[dict[str, Any]]:
        prepared: list[dict[str, Any]] = []
        for row in self.rows:
            treatment_value = _coerce_treatment(row, treatment)
            outcome_value = _coerce_numeric(row.get(outcome))
            if treatment_value is None or outcome_value is None:
                continue
            out_row = {"__treatment__": treatment_value, "__outcome__": outcome_value}
            for cause in common_causes:
                if cause in row:
                    out_row[cause] = row[cause]
            prepared.append(out_row)
        return prepared

    def _random_refute(self, prepared: list[dict[str, Any]], common_causes: list[str], rounds: int = 32) -> dict[str, Any]:
        baseline = _ols_treatment_effect(prepared, "__treatment__", "__outcome__", common_causes)
        null_effects: list[float] = []
        treatment_values = [row["__treatment__"] for row in prepared]
        for _ in range(rounds):
            placebo = [dict(row) for row in prepared]
            random.shuffle(treatment_values)
            for idx, value in enumerate(treatment_values):
                placebo[idx]["__treatment__"] = value
            null_effects.append(abs(_ols_treatment_effect(placebo, "__treatment__", "__outcome__", common_causes)))
        stronger = sum(1 for val in null_effects if val >= abs(baseline))
        return {
            "method": "randomized_placebo",
            "baseline_effect": baseline,
            "p_value": stronger / max(1, len(null_effects)),
            "null_rounds": rounds,
        }

    def recommend_policies(self, top_n: int = 3) -> list[dict[str, Any]]:
        candidates = [
            ("auto_switch_deep", "stakeholder_trust"),
            ("summary_to_story", "adaptability"),
            ("strategic_to_operational", "resource_efficiency"),
        ]
        results: list[dict[str, Any]] = []
        for treatment, outcome in candidates:
            effect = self.estimate_causal_effect(treatment=treatment, outcome=outcome)
            if effect.get("causal_effect") is None or effect.get("causal_effect") <= 0:
                continue
            results.append(
                {
                    "policy": f"Apply {treatment} to boost {outcome}",
                    "treatment": treatment,
                    "outcome": outcome,
                    "effect_size": effect["causal_effect"],
                    "method": effect["method"],
                }
            )
        return sorted(results, key=lambda item: item["effect_size"], reverse=True)[:top_n]


def _coerce_numeric(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)) and not math.isnan(float(value)):
        return float(value)
    try:
        converted = float(value)
    except (TypeError, ValueError):
        return None
    return converted if not math.isnan(converted) else None


def _coerce_treatment(row: dict[str, Any], treatment_name: str) -> float | None:
    direct = _coerce_numeric(row.get(treatment_name))
    if direct is not None:
        return direct
    generic = row.get("treatment")
    if generic is None:
        return None
    if isinstance(generic, bool):
        return float(int(generic))
    if isinstance(generic, (int, float)):
        return float(generic)
    return 1.0 if str(generic) == treatment_name else 0.0


def _ols_treatment_effect(rows: list[dict[str, Any]], treatment_col: str, outcome_col: str, common_causes: list[str]) -> float:
    features = ["__intercept__", treatment_col]
    feature_values: dict[str, list[float]] = {"__intercept__": [1.0] * len(rows), treatment_col: [float(row[treatment_col]) for row in rows]}

    for cause in common_causes:
        values = [row.get(cause) for row in rows if cause in row]
        if len(values) != len(rows):
            continue
        if all(isinstance(v, (int, float, bool)) for v in values):
            key = cause
            features.append(key)
            feature_values[key] = [float(v) for v in values]
        else:
            categories = sorted({str(v) for v in values})
            for category in categories[1:]:
                key = f"{cause}::{category}"
                features.append(key)
                feature_values[key] = [1.0 if str(v) == category else 0.0 for v in values]

    xtx = [[0.0 for _ in features] for _ in features]
    xty = [0.0 for _ in features]
    y = [float(row[outcome_col]) for row in rows]

    for row_idx in range(len(rows)):
        x = [feature_values[name][row_idx] for name in features]
        for i, xi in enumerate(x):
            xty[i] += xi * y[row_idx]
            for j, xj in enumerate(x):
                xtx[i][j] += xi * xj

    coeffs = _solve_linear_system(xtx, xty)
    return float(coeffs[1]) if len(coeffs) > 1 else 0.0


def _solve_linear_system(a: list[list[float]], b: list[float]) -> list[float]:
    n = len(b)
    aug = [row[:] + [b[idx]] for idx, row in enumerate(a)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(aug[r][col]))
        if abs(aug[pivot][col]) < 1e-9:
            continue
        aug[col], aug[pivot] = aug[pivot], aug[col]
        div = aug[col][col]
        aug[col] = [value / div for value in aug[col]]
        for row in range(n):
            if row == col:
                continue
            factor = aug[row][col]
            aug[row] = [cur - factor * lead for cur, lead in zip(aug[row], aug[col])]
    return [aug[idx][-1] for idx in range(n)]
