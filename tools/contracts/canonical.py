"""Shared canonicalization helpers for event identity and quality scoring."""

from __future__ import annotations


def build_canonical_key(
    *,
    event_type: str,
    event_time: float,
    source: str,
    entity_id: str | None = None,
    schema_version: str = "v1",
) -> str:
    """Generate a canonical key using a single system-wide schema."""
    normalized_entity = entity_id or "global"
    return f"{schema_version}:{normalized_entity}:{event_type}:{event_time}:{source}"


def quality_total(quality: dict[str, float] | None) -> float:
    """Compute comparable quality score from the unified rubric."""
    if not quality:
        return 0.0
    return sum(float(quality.get(metric, 0.0)) for metric in ("confidence", "freshness", "completeness"))


def parse_schema_version(version: str | None) -> int:
    """Extract a comparable numeric schema version from `vN` strings."""
    if not version:
        return 0
    if version.startswith("v") and version[1:].isdigit():
        return int(version[1:])
    return 0
