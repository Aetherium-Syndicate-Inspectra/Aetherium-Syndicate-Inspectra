"""Adaptive validation budget controller for contract enforcement."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from statistics import fmean
from time import monotonic


@dataclass(frozen=True)
class BudgetSnapshot:
    """Live budgeting state that can be attached to events/telemetry."""

    intensity: str
    governance_risk: float
    avg_latency_ms: float
    load_rps: float


class AdaptiveContractBudgeting:
    """Adjust validation intensity from live load while protecting governance risk."""

    def __init__(
        self,
        risk_threshold: float = 0.2,
        target_latency_ms: float = 2.5,
        metrics_window: int = 64,
    ):
        if not 0 < risk_threshold <= 1:
            raise ValueError("risk_threshold must be within (0, 1]")
        if target_latency_ms <= 0:
            raise ValueError("target_latency_ms must be > 0")

        self.risk_threshold = risk_threshold
        self.target_latency_ms = target_latency_ms
        self.metrics_window = max(8, metrics_window)

        self._latencies_ms: deque[float] = deque(maxlen=self.metrics_window)
        self._valid_flags: deque[float] = deque(maxlen=self.metrics_window)
        self._healing_flags: deque[float] = deque(maxlen=self.metrics_window)
        self._rps_measurements: deque[float] = deque(maxlen=self.metrics_window)
        self._last_observed_at: float | None = None

        self._intensity = "strict"

    @property
    def intensity(self) -> str:
        return self._intensity

    def record_observation(self, *, latency_ms: float, valid: bool, healing_applied: bool, observed_rps: float | None = None) -> BudgetSnapshot:
        self._latencies_ms.append(max(0.0, latency_ms))
        self._valid_flags.append(1.0 if valid else 0.0)
        self._healing_flags.append(1.0 if healing_applied else 0.0)

        now = monotonic()
        if observed_rps is not None:
            self._rps_measurements.append(max(0.0, observed_rps))
        elif self._last_observed_at is not None:
            elapsed = max(1e-9, now - self._last_observed_at)
            self._rps_measurements.append(1.0 / elapsed)
        self._last_observed_at = now

        self._intensity = self._decide_intensity()
        return self.snapshot()

    def snapshot(self) -> BudgetSnapshot:
        return BudgetSnapshot(
            intensity=self._intensity,
            governance_risk=round(self._governance_risk(), 4),
            avg_latency_ms=round(self._avg_latency_ms(), 4),
            load_rps=round(self._load_rps(), 4),
        )

    def _avg_latency_ms(self) -> float:
        if not self._latencies_ms:
            return 0.0
        return fmean(self._latencies_ms)

    def _load_rps(self) -> float:
        if not self._rps_measurements:
            return 0.0
        return fmean(self._rps_measurements)

    def _governance_risk(self) -> float:
        if not self._valid_flags:
            return 0.0
        invalid_rate = 1.0 - fmean(self._valid_flags)
        healing_rate = fmean(self._healing_flags) if self._healing_flags else 0.0
        # Invalid payloads are riskier than healable drift, so weight them higher.
        return min(1.0, (0.75 * invalid_rate) + (0.25 * healing_rate))

    def _decide_intensity(self) -> str:
        risk = self._governance_risk()
        latency = self._avg_latency_ms()
        load_rps = self._load_rps()

        if risk >= self.risk_threshold:
            return "strict"

        if latency > self.target_latency_ms * 1.2 and risk <= self.risk_threshold * 0.5:
            return "fast"

        # High sustained load biases to balanced unless governance risk spikes.
        if load_rps > 250 and risk < self.risk_threshold:
            return "balanced"

        return "balanced"
