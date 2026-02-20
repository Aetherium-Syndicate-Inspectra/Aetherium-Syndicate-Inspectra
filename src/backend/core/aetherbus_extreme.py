from __future__ import annotations

import asyncio
import json
import logging
import time
from itertools import count
from typing import Any, Awaitable, Callable

from tools.contracts.canonical import build_canonical_key

logger = logging.getLogger("AetherBus")


class AetherBusExtreme:
    """High-speed async message bus shared by API gateway + backend services."""

    def __init__(self, history_limit: int = 1000, queue_size: int = 4096):
        self._subscribers: dict[str, list[Callable[[dict[str, Any]], Awaitable[None]]]] = {}
        self._history: list[dict[str, Any]] = []
        self._history_limit = history_limit
        self._next_event_id = count(1)
        self._is_active = True
        self._lock = asyncio.Lock()
        self._queue: asyncio.Queue[tuple[str, dict[str, Any]]] = asyncio.Queue(maxsize=queue_size)
        self._worker_task: asyncio.Task[None] | None = None
        logger.info("⚡ AetherBus Extreme online")

    async def subscribe(self, topic: str, handler: Callable[[dict[str, Any]], Awaitable[None]]) -> None:
        async with self._lock:
            handlers = self._subscribers.setdefault(topic, [])
            if handler not in handlers:
                handlers.append(handler)

    async def unsubscribe(self, topic: str, handler: Callable[[dict[str, Any]], Awaitable[None]]) -> None:
        async with self._lock:
            handlers = self._subscribers.get(topic, [])
            if handler in handlers:
                handlers.remove(handler)
            if not handlers and topic in self._subscribers:
                self._subscribers.pop(topic)

    async def emit(self, topic: str, payload: Any) -> dict[str, Any]:
        if not self._is_active:
            return {}

        if not isinstance(payload, dict):
            raise TypeError(f"Payload must be a dictionary, but got {type(payload).__name__}")

        event = self._canonical_event(topic=topic, payload=payload)
        self._history.append(event)
        if len(self._history) > self._history_limit:
            self._history = self._history[-self._history_limit :]

        await self._queue.put((topic, event))
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._drain_once())
        await self.flush()

        logger.info("⚡ [SIGNAL] %s", json.dumps({"topic": topic, "event_id": event["event_id"]}))
        return event

    async def flush(self) -> None:
        await self._queue.join()

    async def _drain_once(self) -> None:
        while not self._queue.empty() and self._is_active:
            topic, event = await self._queue.get()
            try:
                handlers = list(self._subscribers.get(topic, []))
                if handlers:
                    tasks = [asyncio.create_task(handler(event)) for handler in handlers]
                    await asyncio.gather(*tasks, return_exceptions=True)
            finally:
                self._queue.task_done()

    def _canonical_event(self, topic: str, payload: Any) -> dict[str, Any]:
        event_time = time.time()
        event = {
            "event_id": next(self._next_event_id),
            "event_type": topic,
            "event_time": event_time,
            "source": "backend_core",
            "payload": payload,
        }
        event["canonical_key"] = build_canonical_key(
            event_type=event["event_type"],
            event_time=event_time,
            source=event["source"],
        )
        return event

    def recent_events(self, limit: int = 100) -> list[dict[str, Any]]:
        if limit <= 0:
            return []
        return self._history[-limit:]

    async def shutdown(self) -> None:
        self._is_active = False
        if self._worker_task is not None:
            await self.flush()
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
