import asyncio
import json
import logging
import time
from itertools import count
from typing import Any, Awaitable, Callable

from tools.contracts.canonical import build_canonical_key

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | AETHERBUS | %(levelname)s | %(message)s",
)
logger = logging.getLogger("AetherBus")


class AetherBusExtreme:
    """
    The High-Speed Nervous System of Aetherium.
    รองรับการสื่อสารระดับ Microsecond สำหรับ Agent Swarm.
    """

    def __init__(self, history_limit: int = 1000):
        self._subscribers: dict[str, list[Callable[[Any], Awaitable[None]]]] = {}
        self._history: list[dict[str, Any]] = []
        self._history_limit = history_limit
        self._next_event_id = count(1)
        self._is_active = True
        self._lock = asyncio.Lock()
        logger.info("⚡ AetherBus Extreme: Nervous System Online")

    async def subscribe(self, topic: str, handler: Callable[[Any], Awaitable[None]]):
        """เชื่อมต่ออวัยวะ (Agent) เข้ากับระบบประสาท"""
        async with self._lock:
            handlers = self._subscribers.setdefault(topic, [])
            if handler not in handlers:
                handlers.append(handler)
        logger.debug("🔌 Synapse connected to topic: %s", topic)

    async def unsubscribe(self, topic: str, handler: Callable[[Any], Awaitable[None]]):
        async with self._lock:
            handlers = self._subscribers.get(topic, [])
            if handler in handlers:
                handlers.remove(handler)
            if not handlers and topic in self._subscribers:
                self._subscribers.pop(topic)
        logger.debug("🔌 Synapse disconnected from topic: %s", topic)

    def _canonical_event(self, topic: str, payload: Any) -> dict[str, Any]:
        event = {
            "event_id": next(self._next_event_id),
            "event_type": topic,
            "event_time": time.time(),
            "source": "api_gateway",
            "payload": payload,
        }
        event["canonical_key"] = build_canonical_key(
            event_type=event["event_type"],
            event_time=event["event_time"],
            source=event["source"],
        )
        return event

    async def emit(self, topic: str, payload: Any):
        """ส่งกระแสประสาท (Signal) ไปยังทุกอวัยวะที่เกี่ยวข้อง"""
        if not self._is_active:
            return

        event = self._canonical_event(topic=topic, payload=payload)
        self._history.append(event)
        if len(self._history) > self._history_limit:
            self._history = self._history[-self._history_limit :]

        handlers = list(self._subscribers.get(topic, []))
        if handlers:
            tasks = [asyncio.create_task(handler(event)) for handler in handlers]
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.info("⚡ [SIGNAL] %s", json.dumps({"topic": topic, "event_id": event["event_id"]}))

    def recent_events(self, limit: int = 100) -> list[dict[str, Any]]:
        if limit <= 0:
            return []
        return self._history[-limit:]

    async def shutdown(self):
        self._is_active = False
        logger.info("💤 AetherBus Extreme: System Shutdown")
