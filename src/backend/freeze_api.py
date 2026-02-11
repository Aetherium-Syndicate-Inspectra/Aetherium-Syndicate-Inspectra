from __future__ import annotations

import base64
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from tools.contracts.canonical import build_canonical_key

FREEZE_STORAGE_DIR = Path("storage/frozen_lights")
FREEZE_INDEX_PATH = FREEZE_STORAGE_DIR / "index.json"

router = APIRouter(prefix="/api/freeze", tags=["freeze-light"])


class FreezeQuality(BaseModel):
    confidence: float = Field(default=1.0, ge=0, le=1)
    freshness: float = Field(default=1.0, ge=0, le=1)
    completeness: float = Field(default=1.0, ge=0, le=1)


class FreezeSaveRequest(BaseModel):
    structure: dict[str, Any]
    file_name: str = Field(default="frozen-light")
    file_format: Literal["png", "pdf"] = "png"
    image_data_base64: str = Field(description="raw base64 or data-url")
    quality: FreezeQuality = Field(default_factory=FreezeQuality)


class FreezeRecord(BaseModel):
    id: str
    file_name: str
    file_format: str
    created_at: str
    event_type: str
    canonical_key: str
    quality: FreezeQuality
    structure_stats: dict[str, int]


class FreezeStore:
    def __init__(self, storage_dir: Path = FREEZE_STORAGE_DIR, index_path: Path = FREEZE_INDEX_PATH):
        self.storage_dir = storage_dir
        self.index_path = index_path
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        if not self.index_path.exists():
            self.index_path.write_text("[]", encoding="utf-8")

    def _read_index(self) -> list[dict[str, Any]]:
        try:
            return json.loads(self.index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

    def _write_index(self, rows: list[dict[str, Any]]) -> None:
        self.index_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    @staticmethod
    def _decode_base64(image_data_base64: str) -> bytes:
        payload = image_data_base64.split(",", 1)[1] if image_data_base64.startswith("data:") else image_data_base64
        try:
            return base64.b64decode(payload)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail="Invalid base64 payload") from exc

    @staticmethod
    def _stats(structure: dict[str, Any]) -> dict[str, int]:
        return {
            "positions": len(structure.get("positions", [])),
            "colors": len(structure.get("colors", [])),
            "intensities": len(structure.get("intensities", [])),
        }

    def save(self, payload: FreezeSaveRequest) -> FreezeRecord:
        freeze_id = str(uuid.uuid4())
        now = datetime.now(tz=timezone.utc)
        event_time_ms = int(now.timestamp() * 1000)
        canonical_key = build_canonical_key(
            event_type="freeze.saved",
            event_time=float(event_time_ms),
            source="api/freeze/save",
            entity_id=freeze_id,
            schema_version="v1",
        )

        item_dir = self.storage_dir / freeze_id
        item_dir.mkdir(parents=True, exist_ok=True)

        ext = payload.file_format
        binary_path = item_dir / f"preview.{ext}"
        binary_path.write_bytes(self._decode_base64(payload.image_data_base64))

        structure_path = item_dir / "structure.json"
        structure_path.write_text(json.dumps(payload.structure, ensure_ascii=False, indent=2), encoding="utf-8")

        record = FreezeRecord(
            id=freeze_id,
            file_name=payload.file_name,
            file_format=payload.file_format,
            created_at=now.isoformat(),
            event_type="freeze.saved",
            canonical_key=canonical_key,
            quality=payload.quality,
            structure_stats=self._stats(payload.structure),
        )

        index = self._read_index()
        index.insert(0, record.model_dump())
        self._write_index(index)

        return record

    def list(self) -> list[FreezeRecord]:
        return [FreezeRecord.model_validate(item) for item in self._read_index()]

    def delete(self, freeze_id: str) -> bool:
        index = self._read_index()
        filtered = [item for item in index if item.get("id") != freeze_id]
        if len(filtered) == len(index):
            return False

        self._write_index(filtered)
        item_dir = self.storage_dir / freeze_id
        if item_dir.exists():
            for child in item_dir.iterdir():
                child.unlink(missing_ok=True)
            item_dir.rmdir()
        return True


store = FreezeStore()


@router.post("/save")
def save_frozen_structure(payload: FreezeSaveRequest) -> dict[str, Any]:
    record = store.save(payload)
    return {"status": "success", "freeze": record.model_dump()}


@router.get("/list")
def list_frozen_structures() -> dict[str, Any]:
    return {"items": [row.model_dump() for row in store.list()]}


@router.delete("/{freeze_id}")
def delete_frozen_structure(freeze_id: str) -> dict[str, Any]:
    deleted = store.delete(freeze_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Frozen structure not found")
    return {"status": "deleted", "id": freeze_id}
