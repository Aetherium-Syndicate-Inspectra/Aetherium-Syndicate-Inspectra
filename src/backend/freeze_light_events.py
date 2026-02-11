from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tools.contracts.canonical import build_canonical_key

FREEZE_EVENT_LOG_PATH = Path("storage/frozen_lights/events.jsonl")


class FreezeLightEventStore:
    """Append-only Freeze Light event sink for audit-grade traces."""

    def __init__(self, event_log_path: Path = FREEZE_EVENT_LOG_PATH):
        self.event_log_path = event_log_path
        self.event_log_path.parent.mkdir(parents=True, exist_ok=True)
        self.event_log_path.touch(exist_ok=True)

    @staticmethod
    def anonymize_user_id(user_id: str) -> str:
        return hashlib.sha256(user_id.encode("utf-8")).hexdigest()[:24]

    def write(self, *, event_type: str, source: str, payload: dict[str, Any], schema_version: str = "v1") -> dict[str, Any]:
        now = datetime.now(tz=timezone.utc)
        event_time_ms = int(now.timestamp() * 1000)
        entity_id = payload.get("user_id") or payload.get("tournament_id") or "system"
        canonical_key = build_canonical_key(
            event_type=event_type,
            event_time=float(event_time_ms),
            source=source,
            entity_id=entity_id,
            schema_version=schema_version,
        )
        record = {
            "event_type": event_type,
            "version": "1.0.0",
            "timestamp": now.isoformat(),
            "canonical_key": canonical_key,
            "payload": payload,
        }
        with self.event_log_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
        return record

    def read_all(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for line in self.event_log_path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                rows.append(json.loads(line))
        return rows
