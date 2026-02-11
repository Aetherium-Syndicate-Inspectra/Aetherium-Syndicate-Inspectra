"""Self-healing helpers for contract payload schema drift."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SchemaHealingResult:
    """Result of a healing pass over payload keys."""

    payload: dict[str, Any]
    remapped_fields: dict[str, str]


def heal_payload(payload: dict[str, Any], aliases: dict[str, str] | None = None) -> SchemaHealingResult:
    """Map legacy keys to canonical keys while preserving canonical values.

    If both legacy and canonical fields are present, canonical value wins.
    """
    alias_map = aliases or {}
    healed = dict(payload)
    remapped: dict[str, str] = {}

    for legacy_key, canonical_key in alias_map.items():
        if legacy_key not in healed:
            continue
        if canonical_key not in healed:
            healed[canonical_key] = healed[legacy_key]
        remapped[legacy_key] = canonical_key
        del healed[legacy_key]

    return SchemaHealingResult(payload=healed, remapped_fields=remapped)

