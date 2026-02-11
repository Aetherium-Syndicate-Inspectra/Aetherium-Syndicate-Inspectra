"""FastAPI bridge between Tachyon Rust core and Aetherium frontend."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
import re
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.backend.auth.google_auth import router as google_auth_router
from src.backend.freeze_api import router as freeze_router
from src.backend.resonance_drift_api import router as resonance_drift_router
from src.backend.db import (
    add_payment_method,
    create_transaction,
    get_default_payment_method,
    init_db,
    list_payment_methods,
    log_usage,
    register_agent,
    update_subscription_tier,
    update_transaction_status,
)
from src.backend.economy.gatekeeper import require_feature, write_audit_log
from src.backend.economy.tiers import TierLevel, get_tier_config
from tools.contracts.canonical import build_canonical_key

try:
    import tachyon_core
except ImportError as exc:  # pragma: no cover - runtime integration check
    raise RuntimeError(
        "tachyon_core module not found. Build/install the Python extension before running API server."
    ) from exc

app = FastAPI(title="Aetherium Tachyon API", version="1.1.0")
engine = tachyon_core.TachyonEngine()
init_db()
app.include_router(google_auth_router)
app.include_router(freeze_router)
app.include_router(resonance_drift_router)

PAYMENT_WEBHOOK_SECRET = os.getenv("PAYMENT_WEBHOOK_SECRET", "asi-webhook-dev-secret")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENTS: list[dict[str, Any]] = [
    {
        "id": "alpha-1",
        "name": "Alpha-1",
        "role": "Chief Strategy Officer",
        "status": "active",
        "cpu": 75,
        "memory": 60,
        "task": "Processing M&A Data",
    },
    {
        "id": "beta-x",
        "name": "Beta-X",
        "role": "Chief Financial Officer",
        "status": "busy",
        "cpu": 92,
        "memory": 85,
        "task": "Auditing Q2",
    },
    {
        "id": "gamma-7",
        "name": "Gamma-7",
        "role": "Chief Operations Officer",
        "status": "active",
        "cpu": 45,
        "memory": 50,
        "task": "Rebalancing Server Load",
    },
]

DIRECTIVES: list[dict[str, Any]] = [
    {
        "id": "DIR-012",
        "title": "Market Pulse Q4",
        "status": "pending",
        "department": "Marketing",
        "time": "2h ago",
        "author": "A",
    },
    {
        "id": "DIR-019",
        "title": "Budget Forecasting",
        "status": "meeting",
        "department": "Finance",
        "time": "4h ago",
        "author": "B",
    },
    {
        "id": "DIR-007",
        "title": "Hiring Strategy",
        "status": "completed",
        "department": "HR",
        "time": "1d ago",
        "author": "HR",
    },
]

MEETINGS: list[dict[str, Any]] = [
    {"id": "m1", "title": "Strategic Market Capture", "duration": "28m", "participants": ["M", "F", "L"]},
    {"id": "m2", "title": "Compute Cost Rebalancing", "duration": "17m", "participants": ["L", "S"]},
    {"id": "m3", "title": "Legal Compliance Delta", "duration": "24m", "participants": ["O", "H", "R"]},
]


BID_EVENT_TYPES = ("bid_created", "bid_countered", "conflict_resolved")


def _bid_stream_event(tick: int, source: str) -> dict[str, Any]:
    event_type = BID_EVENT_TYPES[tick % len(BID_EVENT_TYPES)]
    bid_id = f"BID-{1000 + (tick % 250)}"
    event_time = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    quality = {
        "confidence": round(0.88 + ((tick % 7) * 0.01), 3),
        "freshness": 1.0,
        "completeness": 1.0,
    }
    payload = {
        "bid_id": bid_id,
        "symbol": "AETH" if tick % 2 == 0 else "NOVA",
        "bidder": AGENTS[tick % len(AGENTS)]["name"],
        "amount": 250000 + ((tick % 33) * 4500),
        "state": "proposing" if event_type == "bid_created" else "countering" if event_type == "bid_countered" else "settled",
    }
    return {
        "schema_version": "v1",
        "event_id": f"{event_type}-{bid_id}-{event_time}",
        "event_type": event_type,
        "event_time": event_time,
        "source": source,
        "canonical_key": build_canonical_key(
            event_type=event_type,
            event_time=float(event_time),
            source=source,
            entity_id=bid_id,
            schema_version="v1",
        ),
        "quality": quality,
        "payload": payload,
    }


def _status_or_bid_event(tick: int, source: str) -> dict[str, Any]:
    if tick % 2 == 0:
        return {
            "type": "metrics.updated",
            "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
            "data": {"latency": 0.7, "throughput": 10900, "load": 45},
        }
    return _bid_stream_event(tick=tick, source=source)


class DirectiveCreate(BaseModel):
    title: str
    department: str = "General"
    status: str = "pending"
    author: str = "U"


class UpgradeRequest(BaseModel):
    user_id: str
    target_tier: TierLevel
    charge_amount_thb: float | None = Field(default=None, gt=0)


class CreditTopupRequest(BaseModel):
    user_id: str
    credits: int = Field(gt=0)
    charge_amount_thb: float | None = Field(default=None, gt=0)


class PaymentMethodCreateRequest(BaseModel):
    provider: str = Field(default="OMISE")
    token: str
    last_digits: str | None = Field(default=None, pattern=r"^\d{4}$")
    bank_name: str | None = None
    is_default: bool = False


class BillingWebhookPayload(BaseModel):
    transaction_id: str
    status: str
    gateway_ref_id: str | None = None


def _validate_gateway_token(provider: str, token: str) -> bool:
    if len(token) < 8:
        return False
    pattern_map = {
        "OMISE": r"^tokn?_[A-Za-z0-9_\-]+$",
        "STRIPE": r"^tok_[A-Za-z0-9]+$",
        "K_BANK": r"^[A-Za-z0-9_\-]{10,}$",
    }
    pattern = pattern_map.get(provider, r"^[A-Za-z0-9_\-]{8,}$")
    return re.match(pattern, token) is not None


def _mock_gateway_charge(token_id: str, amount_thb: float) -> tuple[bool, str]:
    # Mock success path for tokenized methods. Replace with Omise/Stripe SDK in production.
    if not token_id or amount_thb <= 0:
        return False, "invalid_input"
    return True, f"gw_{hashlib.sha1(f'{token_id}:{amount_thb}'.encode('utf-8')).hexdigest()[:18]}"


def charge_user(user_id: str, amount: float, tx_type: str) -> tuple[bool, str, str]:
    method = get_default_payment_method(user_id)
    if method is None:
        return False, "", "No default payment method linked"

    tx_id = create_transaction(user_id=user_id, amount=amount, tx_type=tx_type, status="PENDING")
    success, gateway_ref = _mock_gateway_charge(method.token_id, amount)
    if success:
        update_transaction_status(tx_id, "SUCCESS", gateway_ref)
        return True, tx_id, gateway_ref

    update_transaction_status(tx_id, "FAILED", gateway_ref)
    return False, tx_id, "Gateway charge failed"


def _verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    expected = hmac.new(PAYMENT_WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@app.get("/api/agents")
def get_agents() -> list[dict[str, Any]]:
    return AGENTS


@app.get("/api/directives")
def get_directives() -> list[dict[str, Any]]:
    return DIRECTIVES


@app.get("/api/meetings")
def get_meetings() -> list[dict[str, Any]]:
    return MEETINGS


@app.post("/api/directives")
def create_directive(payload: DirectiveCreate) -> dict[str, Any]:
    next_num = max(
        (int(d["id"].split("-")[1]) for d in DIRECTIVES if d.get("id", "").startswith("DIR-")),
        default=0,
    ) + 1
    directive = {
        "id": f"DIR-{next_num:03d}",
        "title": payload.title,
        "department": payload.department,
        "status": payload.status,
        "time": "Just now",
        "author": payload.author,
    }
    DIRECTIVES.insert(0, directive)
    return directive


@app.get("/api/mint-starter-deck")
def mint_starter_deck(seed: int = 1000, user_sub=Depends(require_feature("MINT_AGENT"))) -> dict[str, Any]:
    try:
        sentinel, catalyst, harmonizer = engine.mint_starter_deck(seed)
        register_agent(user_sub.user_id)
        register_agent(user_sub.user_id)
        register_agent(user_sub.user_id)
        write_audit_log(
            "MINT_AGENT",
            user_sub.user_id,
            {"seed": seed, "bundle": ["sentinel", "catalyst", "harmonizer"]},
        )
    except Exception as exc:  # pragma: no cover - rust runtime integration
        raise HTTPException(status_code=500, detail=f"Tachyon mint failed: {exc}") from exc

    return {
        "sentinel": json.loads(engine.inspect_identity_json(sentinel)),
        "catalyst": json.loads(engine.inspect_identity_json(catalyst)),
        "harmonizer": json.loads(engine.inspect_identity_json(harmonizer)),
    }


@app.get("/api/billing/status")
def billing_status(user_sub=Depends(require_feature(None))) -> dict[str, Any]:
    config = get_tier_config(user_sub.tier_level)
    return {
        "user_id": user_sub.user_id,
        "tier": user_sub.tier_level,
        "status": user_sub.status,
        "next_billing_date": user_sub.next_billing_date,
        "quotas": {
            "max_agents": config.max_agents,
            "ghost_worker_daily": config.daily_ghost_quota,
            "tachyon_priority": config.tachyon_priority,
            "requests_per_minute": config.requests_per_minute,
        },
    }


@app.post("/api/billing/payment-methods", status_code=201)
def link_payment_method(payload: PaymentMethodCreateRequest, user_sub=Depends(require_feature(None))) -> dict[str, Any]:
    provider = payload.provider.upper()
    if provider not in {"OMISE", "STRIPE", "K_BANK"}:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    if not _validate_gateway_token(provider, payload.token):
        raise HTTPException(status_code=400, detail="Invalid token format")

    method = add_payment_method(
        user_id=user_sub.user_id,
        provider=provider,
        token_id=payload.token,
        last_digits=payload.last_digits,
        bank_name=payload.bank_name,
        is_default=payload.is_default,
    )

    write_audit_log("PAYMENT_METHOD_LINKED", user_sub.user_id, {"provider": provider, "method_id": method.id})
    return {
        "id": method.id,
        "provider": method.provider,
        "last_digits": method.last_digits,
        "bank_name": method.bank_name,
        "is_default": bool(method.is_default),
    }


@app.get("/api/billing/payment-methods")
def get_payment_methods(user_sub=Depends(require_feature(None))) -> dict[str, Any]:
    methods = list_payment_methods(user_sub.user_id)
    return {
        "payment_methods": [
            {
                "id": method.id,
                "provider": method.provider,
                "last_digits": method.last_digits,
                "bank_name": method.bank_name,
                "is_default": bool(method.is_default),
                "created_at": method.created_at,
            }
            for method in methods
        ]
    }


@app.post("/api/billing/upgrade")
def billing_upgrade(payload: UpgradeRequest, user_sub=Depends(require_feature(None))) -> dict[str, Any]:
    if user_sub.user_id != payload.user_id:
        raise HTTPException(status_code=403, detail="Cannot upgrade another user")

    if payload.charge_amount_thb is not None:
        ok, tx_id, gateway_ref = charge_user(user_sub.user_id, payload.charge_amount_thb, "SUBSCRIPTION")
        if not ok:
            raise HTTPException(status_code=402, detail=f"Subscription charge failed: {gateway_ref}")

    config = get_tier_config(payload.target_tier.value)
    update_subscription_tier(
        user_id=payload.user_id,
        tier_level=payload.target_tier.value,
        max_agents=config.max_agents,
        ghost_worker_quota=config.daily_ghost_quota,
        tachyon_priority=config.tachyon_priority,
    )
    write_audit_log(
        "PLAN_UPGRADE",
        user_sub.user_id,
        {"from": user_sub.tier_level, "to": payload.target_tier.value},
    )
    return {
        "status": "success",
        "tier": payload.target_tier.value,
        "charged": payload.charge_amount_thb is not None,
        "transaction_id": tx_id if payload.charge_amount_thb is not None else None,
    }


@app.post("/api/billing/webhook")
async def billing_webhook(
    payload: BillingWebhookPayload,
    response: Response,
    x_gateway_signature: str | None = Header(default=None, alias="X-Gateway-Signature"),
) -> dict[str, Any]:
    raw = payload.model_dump_json().encode("utf-8")
    if not _verify_webhook_signature(raw, x_gateway_signature):
        response.status_code = 401
        return {"status": "invalid_signature"}

    if payload.status not in {"PENDING", "SUCCESS", "FAILED"}:
        raise HTTPException(status_code=400, detail="Invalid transaction status")

    update_transaction_status(payload.transaction_id, payload.status, payload.gateway_ref_id)
    write_audit_log("PAYMENT_WEBHOOK", "system", payload.model_dump())
    return {"status": "ok"}


@app.get("/api/marketplace/agents")
def marketplace_agents(user_sub=Depends(require_feature(None))) -> dict[str, Any]:
    return {
        "tier": user_sub.tier_level,
        "catalog": [
            {"sku": "sentinel-pro", "credits": 150, "premium_only": False},
            {"sku": "catalyst-hft", "credits": 300, "premium_only": True},
            {"sku": "harmonizer-gov", "credits": 500, "premium_only": True},
        ],
    }


@app.post("/api/credits/topup")
def credits_topup(payload: CreditTopupRequest, user_sub=Depends(require_feature("GHOST_WORKER"))) -> dict[str, Any]:
    if user_sub.user_id != payload.user_id:
        raise HTTPException(status_code=403, detail="Cannot top up another user")

    tx_id = None
    if payload.charge_amount_thb is not None:
        ok, tx_id, gateway_ref = charge_user(user_sub.user_id, payload.charge_amount_thb, "TOPUP")
        if not ok:
            raise HTTPException(status_code=402, detail=f"Top-up charge failed: {gateway_ref}")

    log_usage(user_sub.user_id, "CREDIT_TOPUP", -payload.credits)
    write_audit_log("CREDIT_TOPUP", user_sub.user_id, {"credits": payload.credits, "charged": payload.charge_amount_thb})
    return {"status": "success", "credits_added": payload.credits, "transaction_id": tx_id}


@app.websocket("/ws/aetherbus")
async def websocket_aetherbus(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(
                {
                    "type": "HEARTBEAT",
                    "status": "TACHYON_ACTIVE",
                    "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
                }
            )
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        return


@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket) -> None:
    await websocket.accept()
    tick = 0
    try:
        while True:
            await websocket.send_json(_status_or_bid_event(tick=tick, source="ws/status"))
            tick += 1
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return


@app.get("/api/events")
async def sse_events() -> StreamingResponse:
    async def event_generator():
        tick = 0
        while True:
            payload = _status_or_bid_event(tick=tick, source="sse/events")
            yield f"data: {json.dumps(payload)}\n\n"
            tick += 1
            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
