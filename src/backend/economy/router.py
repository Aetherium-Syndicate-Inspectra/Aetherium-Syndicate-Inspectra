from __future__ import annotations

import hashlib
import hmac
import os
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Response
from pydantic import BaseModel, Field

from src.backend.db import (
    add_payment_method,
    create_transaction,
    get_default_payment_method,
    list_payment_methods,
    log_usage,
    update_subscription_tier,
    update_transaction_status,
)
from src.backend.economy.gatekeeper import require_feature, write_audit_log
from src.backend.economy.tiers import TierLevel, get_tier_config

router = APIRouter(prefix="/api/billing", tags=["billing"])
credits_router = APIRouter(prefix="/api/credits", tags=["credits"])
marketplace_router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

PAYMENT_WEBHOOK_SECRET = os.getenv("PAYMENT_WEBHOOK_SECRET", "asi-webhook-dev-secret")

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
    import re
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


@router.get("/status")
def billing_status(user_sub=require_feature(None)) -> dict[str, Any]:
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


@router.post("/payment-methods", status_code=201)
def link_payment_method(payload: PaymentMethodCreateRequest, user_sub=require_feature(None)) -> dict[str, Any]:
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


@router.get("/payment-methods")
def get_payment_methods(user_sub=require_feature(None)) -> dict[str, Any]:
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


@router.post("/upgrade")
def billing_upgrade(payload: UpgradeRequest, user_sub=require_feature(None)) -> dict[str, Any]:
    if user_sub.user_id != payload.user_id:
        raise HTTPException(status_code=403, detail="Cannot upgrade another user")

    tx_id = None
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
        "transaction_id": tx_id,
    }


@router.post("/webhook")
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


@marketplace_router.get("/agents")
def marketplace_agents(user_sub=require_feature(None)) -> dict[str, Any]:
    return {
        "tier": user_sub.tier_level,
        "catalog": [
            {"sku": "sentinel-pro", "credits": 150, "premium_only": False},
            {"sku": "catalyst-hft", "credits": 300, "premium_only": True},
            {"sku": "harmonizer-gov", "credits": 500, "premium_only": True},
        ],
    }


@credits_router.post("/topup")
def credits_topup(payload: CreditTopupRequest, user_sub=require_feature("GHOST_WORKER")) -> dict[str, Any]:
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
