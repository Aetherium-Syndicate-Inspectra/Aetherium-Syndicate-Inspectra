"""Entitlement middleware/dependencies for FastAPI endpoints."""

from __future__ import annotations

import json
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from fastapi import Depends, Header, HTTPException

from src.backend.db import get_current_agent_count, get_user_subscription_by_api_key
from src.backend.economy.tiers import get_tier_config

RATE_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
AUDIT_LOG_PATH = Path("auditorium/logs/economy_audit.jsonl")


def write_audit_log(event_type: str, user_id: str, detail: dict) -> None:
    AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "event_type": event_type,
        "user_id": user_id,
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "detail": detail,
    }
    with AUDIT_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False) + "\n")


def _rate_limit_check(api_key_hash: str, requests_per_minute: int | None) -> None:
    if requests_per_minute is None:
        return
    now_ts = datetime.now(tz=timezone.utc).timestamp()
    q = RATE_BUCKETS[api_key_hash]
    while q and now_ts - q[0] > 60:
        q.popleft()
    if len(q) >= requests_per_minute:
        raise HTTPException(status_code=429, detail="Rate limit exceeded for current tier")
    q.append(now_ts)


async def verify_entitlement(
    x_api_key: str = Header(..., alias="X-API-Key"),
    required_feature: str | None = None,
):
    user_sub = get_user_subscription_by_api_key(x_api_key)
    if not user_sub or user_sub.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Inactive subscription")

    config = get_tier_config(user_sub.tier_level)
    _rate_limit_check(user_sub.api_key_hash, config.requests_per_minute)

    if required_feature == "MINT_AGENT":
        current_count = get_current_agent_count(user_sub.user_id)
        if current_count >= config.max_agents:
            raise HTTPException(
                status_code=402,
                detail=f"Agent limit reached for {user_sub.tier_level} tier. Please upgrade.",
            )

    if required_feature == "GHOST_WORKER" and not config.allow_ghost_workers:
        raise HTTPException(
            status_code=403,
            detail="Ghost Worker simulation is reserved for SYNDICATE tier and above.",
        )

    return user_sub


def require_feature(feature_name: str | None = None) -> Callable:
    async def _checker(x_api_key: str = Header(..., alias="X-API-Key")):
        return await verify_entitlement(x_api_key=x_api_key, required_feature=feature_name)

    return Depends(_checker)
