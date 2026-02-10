"""Shared canonicalization helpers for event identity and quality scoring."""

from __future__ import annotations


def build_canonical_key(*, event_type: str, event_time: float, source: str) -> str:
    """Generate a canonical key using a single system-wide schema."""
    return f"{event_type}:{event_time}:{source}"


def quality_total(quality: dict[str, float] | None) -> float:
    """Compute comparable quality score from the unified rubric."""
    if not quality:
        return 0.0
    return sum(float(quality.get(metric, 0.0)) for metric in ("confidence", "freshness", "completeness"))
