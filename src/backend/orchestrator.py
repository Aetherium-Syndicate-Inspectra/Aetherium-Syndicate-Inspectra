"""Lifecycle orchestration utilities for cross-platform personalization."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class UserLifecycleContext:
    learning_topics: set[str]
    balance: float

    def is_learning(self, topic: str) -> bool:
        return topic in self.learning_topics

    def get_balance(self) -> float:
        return self.balance


class KVCacheProtocol:
    async def get_context(self, user_id: str) -> UserLifecycleContext:
        raise NotImplementedError


class LineClientProtocol:
    async def push_message(self, user_id: str, message: str) -> None:
        raise NotImplementedError


async def monitor_user_lifecycle(user_id: str, *, kv_cache: KVCacheProtocol, line_client: LineClientProtocol) -> dict[str, Any]:
    context = await kv_cache.get_context(user_id)

    if context.is_learning("gold_invest") and context.get_balance() > 10000:
        message = "เห็นคุณกำลังสนใจเรื่องทอง! ตอนนี้ใน Marketplace มีดีลพิเศษสำหรับทองแท่งนะคะ"
        await line_client.push_message(user_id, message)
        return {"status": "triggered", "message": message}

    return {"status": "no_action"}
