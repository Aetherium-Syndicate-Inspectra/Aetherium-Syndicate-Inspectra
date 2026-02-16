from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Awaitable, Callable
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class SoulBreakError(Exception):
    """Critical domain error translated to RFC 9457 responses."""

    def __init__(self, title: str, detail: str, problem_type: str = "urn:aetherium:soulbreak") -> None:
        super().__init__(detail)
        self.title = title
        self.detail = detail
        self.problem_type = problem_type


class IntentVector(BaseModel):
    timestamp_ns: int = Field(default_factory=time.time_ns)
    vector_id: str = Field(default_factory=lambda: uuid4().hex)
    intent: str = Field(min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)
    source: str = Field(default="intent_gateway")


class IntentIngressRequest(BaseModel):
    intent: str = Field(min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)
    source: str = Field(default="intent_gateway")
    trust_score: float = Field(default=1.0, ge=0.0, le=1.0)

    @field_validator("intent")
    @classmethod
    def _normalize_intent(cls, value: str) -> str:
        return value.strip().lower().replace(" ", "_")


class AkashicEnvelope(BaseModel, frozen=True):
    protocol_stage: str = Field(default="akashic_envelope")
    created_at: str
    canonical_hash: str
    intent_vector: IntentVector


class SATILayer:
    """Inline safety inspection for malicious or unstable intent payloads."""

    _blocked_tokens = ("ignore previous", "rm -rf", "system override", "drop table")

    def inspect(self, ingress: IntentIngressRequest) -> None:
        serialized = json.dumps({"intent": ingress.intent, "payload": ingress.payload}, ensure_ascii=False).lower()
        if any(token in serialized for token in self._blocked_tokens):
            raise SoulBreakError(
                title="SATI policy violation",
                detail="Request blocked by SATI layer due to malicious prompt injection pattern.",
                problem_type="urn:aetherium:sati:prompt-injection",
            )


class InviolableGovernance:
    """Policy-as-code guardrail driven by inspirafirma_ruleset.json."""

    def __init__(self, ruleset_path: str = "src/backend/inspirafirma_ruleset.json") -> None:
        self.ruleset_path = Path(ruleset_path)
        if self.ruleset_path.exists():
            self.ruleset = json.loads(self.ruleset_path.read_text(encoding="utf-8"))
        else:
            self.ruleset = {"blocked_intents": [], "high_risk_intents": []}

    def audit(self, ingress: IntentIngressRequest) -> None:
        blocked_intents = {item.lower() for item in self.ruleset.get("blocked_intents", [])}
        if ingress.intent in blocked_intents:
            raise SoulBreakError(
                title="Inviolable governance rejected intent",
                detail=f"Intent '{ingress.intent}' violates inspirafirma ruleset.",
                problem_type="urn:aetherium:governance:blocked-intent",
            )


class TerminologyHarmonizer:
    """Maps neo vocabulary to currently deployed canonical terms."""

    def __init__(self) -> None:
        self._mapping = {
            "genesis_core": "aetherium_gateway_core",
            "aetherbus": "aetherbus_extreme",
            "intent_gateway": "api_gateway",
            "akashic_envelope": "canonical_event_envelope",
            "sati_layer": "contract_checker_guard",
            "soulbreak_error": "problem_details_error",
            "pangenes_agent": "policy_genome_engine",
        }

    def canonicalize(self, term: str) -> str:
        key = term.strip().lower().replace(" ", "_")
        return self._mapping.get(key, key)

    def snapshot(self) -> dict[str, str]:
        return dict(self._mapping)


Subscriber = Callable[[dict[str, Any]], Awaitable[None]]


@dataclass
class Environment:
    subscribers: dict[str, list[Subscriber]] = field(default_factory=dict)
    wildcard_subscribers: list[Subscriber] = field(default_factory=list)
    history: list[dict[str, Any]] = field(default_factory=list)
    history_limit: int = 500

    async def publish(self, topic: str, payload: dict[str, Any]) -> None:
        event = {
            "topic": topic,
            "timestamp_ns": time.time_ns(),
            "payload": payload,
        }
        self.history.append(event)
        if len(self.history) > self.history_limit:
            self.history = self.history[-self.history_limit :]

        handlers = [*self.wildcard_subscribers, *self.subscribers.get(topic, [])]
        if not handlers:
            return
        await asyncio.gather(*(handler(event) for handler in handlers), return_exceptions=True)

    async def subscribe(self, topic: str, handler: Subscriber) -> None:
        handlers = self.subscribers.setdefault(topic, [])
        if handler not in handlers:
            handlers.append(handler)

    async def subscribe_all(self, handler: Subscriber) -> None:
        if handler not in self.wildcard_subscribers:
            self.wildcard_subscribers.append(handler)


class LifecycleManager:
    def __init__(self) -> None:
        self._tasks: list[asyncio.Task[Any]] = []

    async def start(self, *coroutines: Awaitable[Any]) -> None:
        for coroutine in coroutines:
            self._tasks.append(asyncio.create_task(coroutine))

    async def shutdown(self) -> None:
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()


class GenesisCoreService:
    def __init__(self) -> None:
        self.environment = Environment()
        self.sati = SATILayer()
        self.governance = InviolableGovernance()
        self.terminology = TerminologyHarmonizer()

    def _identity_annihilation(self, payload: dict[str, Any]) -> dict[str, Any]:
        scrubbed = dict(payload)
        for key in ("email", "phone", "national_id", "full_name"):
            scrubbed.pop(key, None)
        return scrubbed

    def _envelope(self, vector: IntentVector) -> AkashicEnvelope:
        canonical = json.dumps(vector.model_dump(), ensure_ascii=False, sort_keys=True).encode("utf-8")
        return AkashicEnvelope(
            created_at=datetime.now(tz=UTC).isoformat(),
            canonical_hash=hashlib.sha256(canonical).hexdigest(),
            intent_vector=vector,
        )

    async def ingest_intent(self, ingress: IntentIngressRequest) -> AkashicEnvelope:
        self.sati.inspect(ingress)
        self.governance.audit(ingress)

        vector = IntentVector(
            intent=ingress.intent,
            payload=self._identity_annihilation(ingress.payload),
            context=ingress.context,
            source=ingress.source,
        )
        envelope = self._envelope(vector)
        await self.environment.publish(
            topic=ingress.intent,
            payload={
                "stage": "sopan.resonance",
                "trust_score": ingress.trust_score,
                "envelope": envelope.model_dump(),
            },
        )
        return envelope


class WebSocketBridge:
    """Bridge in-memory AetherBus environment events to connected websocket clients."""

    def __init__(self, environment: Environment) -> None:
        self.environment = environment
        self.clients: set[Any] = set()
        self._subscribed = False

    async def attach(self, websocket: Any) -> None:
        self.clients.add(websocket)
        if not self._subscribed:
            await self.environment.subscribe_all(self._broadcast)
            self._subscribed = True

    async def detach(self, websocket: Any) -> None:
        self.clients.discard(websocket)

    async def _broadcast(self, event: dict[str, Any]) -> None:
        disconnected = []
        for client in list(self.clients):
            try:
                await client.send_json(event)
            except Exception:
                disconnected.append(client)
        for client in disconnected:
            self.clients.discard(client)


def verify_hmac_sha256(raw_body: bytes, signature: str | None, secret: str) -> bool:
    if not signature:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def problem_details_from_error(error: SoulBreakError, status_code: int = 400) -> tuple[int, dict[str, Any]]:
    return (
        status_code,
        {
            "type": error.problem_type,
            "title": error.title,
            "detail": error.detail,
        },
    )
