"""Tier definitions for ASI entitlement checks."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class TierLevel(StrEnum):
    SOLO = "SOLO"
    SYNDICATE = "SYNDICATE"
    SINGULARITY = "SINGULARITY"


@dataclass(frozen=True)
class TierConfig:
    max_agents: int
    allow_ghost_workers: bool
    daily_ghost_quota: int
    tachyon_priority: int
    custom_minting: bool
    requests_per_minute: int | None


TIER_CONFIGS: dict[TierLevel, TierConfig] = {
    TierLevel.SOLO: TierConfig(
        max_agents=3,
        allow_ghost_workers=False,
        daily_ghost_quota=0,
        tachyon_priority=1,
        custom_minting=False,
        requests_per_minute=60,
    ),
    TierLevel.SYNDICATE: TierConfig(
        max_agents=10,
        allow_ghost_workers=True,
        daily_ghost_quota=1000,
        tachyon_priority=2,
        custom_minting=True,
        requests_per_minute=300,
    ),
    TierLevel.SINGULARITY: TierConfig(
        max_agents=999_999,
        allow_ghost_workers=True,
        daily_ghost_quota=999_999,
        tachyon_priority=3,
        custom_minting=True,
        requests_per_minute=None,
    ),
}


def get_tier_config(tier_name: str) -> TierConfig:
    """Return the resolved tier config, defaulting safely to SOLO."""
    try:
        return TIER_CONFIGS[TierLevel(tier_name)]
    except ValueError:
        return TIER_CONFIGS[TierLevel.SOLO]
