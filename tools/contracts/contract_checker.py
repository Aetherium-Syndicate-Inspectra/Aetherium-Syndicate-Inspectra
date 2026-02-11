import time
from typing import Any

from tools.contracts.canonical import build_canonical_key, parse_schema_version, quality_total
from tools.contracts.schema_healer import heal_payload


class ContractChecker:
    """
    The Immune System.
    ตรวจสอบความถูกต้องของข้อมูล (Data Integrity) ก่อนเข้าสู่ระบบหลัก.
    """

    def __init__(self, schema_path: str = "docs/schemas/"):
        self.schemas: dict[str, dict[str, Any]] = {}
        self.schema_path = schema_path
        self._load_schemas()

    def _load_schemas(self):
        """โหลดพิมพ์เขียว (DNA) ของข้อมูลที่ถูกต้อง"""
        self.schemas["ipw_v1"] = {
            "type": "object",
            "required": ["intent", "vector", "timestamp"],
            "properties": {
                "intent": {"type": "string"},
                "vector": {"type": "array", "items": {"type": "number"}},
                "timestamp": {"type": "number"},
            },
            "aliases": {
                "intent_vector": "vector",
                "intent_ts": "timestamp",
                "intent_name": "intent",
            },
        }

    def _check_types(self, payload: dict[str, Any], schema: dict[str, Any]) -> tuple[bool, str | None]:
        properties = schema.get("properties", {})
        for field, field_schema in properties.items():
            if field not in payload:
                continue
            expected_type = field_schema.get("type")
            value = payload[field]
            if expected_type == "string" and not isinstance(value, str):
                return False, f"Field '{field}' must be string"
            if expected_type == "number" and not isinstance(value, (int, float)):
                return False, f"Field '{field}' must be number"
            if expected_type == "array" and not isinstance(value, list):
                return False, f"Field '{field}' must be array"
        return True, None

    def _compute_quality(self, payload: dict[str, Any], schema: dict[str, Any]) -> dict[str, float]:
        required = schema.get("required", [])
        present_required = sum(1 for key in required if key in payload)
        completeness = present_required / len(required) if required else 1.0

        timestamp = payload.get("timestamp")
        now = time.time()
        if isinstance(timestamp, (int, float)):
            age = max(0.0, now - float(timestamp))
            freshness = max(0.0, min(1.0, 1.0 - (age / 3600)))
        else:
            freshness = 0.0

        confidence = 1.0 if completeness == 1.0 else 0.6 * completeness
        return {
            "confidence": round(confidence, 3),
            "freshness": round(freshness, 3),
            "completeness": round(completeness, 3),
        }

    def canonicalize_event(
        self,
        payload: dict[str, Any],
        event_type: str,
        source: str,
        schema_version: str = "v1",
    ) -> dict[str, Any]:
        event_time = payload.get("timestamp", time.time())
        quality = payload.get("quality") if isinstance(payload.get("quality"), dict) else {
            "confidence": 0.7,
            "freshness": 0.7,
            "completeness": 0.7,
        }
        canonical_key = build_canonical_key(
            event_type=event_type,
            event_time=float(event_time),
            source=source,
            entity_id=str(payload.get("entity_id") or payload.get("bid_id") or "global"),
            schema_version=schema_version,
        )
        return {
            "schema_version": schema_version,
            "event_type": event_type,
            "event_time": event_time,
            "source": source,
            "canonical_key": canonical_key,
            "quality": quality,
            "payload": payload,
        }

    def deduplicate_events(self, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        dedup_map: dict[str, dict[str, Any]] = {}
        for event in events:
            key = event.get("canonical_key")
            if not key:
                continue
            quality = event.get("quality", {})
            current_score = quality_total(quality)
            previous = dedup_map.get(key)
            if previous is None:
                dedup_map[key] = event
                continue
            previous_quality = previous.get("quality", {})
            previous_score = quality_total(previous_quality)
            if current_score > previous_score:
                dedup_map[key] = event
                continue

            if current_score == previous_score and parse_schema_version(event.get("schema_version")) >= parse_schema_version(
                previous.get("schema_version")
            ):
                dedup_map[key] = event
        return list(dedup_map.values())

    def validate(self, payload: dict[str, Any], contract_type: str) -> tuple[bool, dict[str, Any]]:
        """
        ตรวจจับเชื้อโรค (Invalid Data)
        True = ข้อมูลบริสุทธิ์ (Pass)
        False = ข้อมูลปนเปื้อน (Reject)
        """
        schema = self.schemas.get(contract_type)
        if not schema:
            return False, {"error": f"Unknown Contract Type: {contract_type}"}

        healing = heal_payload(payload, aliases=schema.get("aliases", {}))
        healed_payload = healing.payload

        for field in schema.get("required", []):
            if field not in healed_payload:
                return False, {"error": f"Missing field '{field}'", "contract_type": contract_type}

        type_ok, type_error = self._check_types(healed_payload, schema)
        if not type_ok:
            return False, {"error": type_error, "contract_type": contract_type}

        quality = self._compute_quality(healed_payload, schema)
        return True, {
            "contract_type": contract_type,
            "quality": quality,
            "payload": healed_payload,
            "schema_healing": {
                "applied": bool(healing.remapped_fields),
                "remapped_fields": healing.remapped_fields,
            },
        }
