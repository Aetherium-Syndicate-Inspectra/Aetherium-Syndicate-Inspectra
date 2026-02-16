"""Unified integration hub for LINE, PromptPay, LIFF, and TikTok event orchestration."""

from __future__ import annotations

import binascii
import hashlib
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from src.backend.aetherbus_extreme import AetherBus
from src.backend.cogitator_x import SynergyResolver
from src.backend.db import get_user_by_google_sub, link_line_identity

router = APIRouter(prefix="/api/integrations", tags=["integrations"])
resolver = SynergyResolver()


class LineMessage(BaseModel):
    type: str
    text: str | None = None


class LineSource(BaseModel):
    user_id: str = Field(alias="userId")


class LineEvent(BaseModel):
    type: str
    source: LineSource
    message: LineMessage | None = None


class LineWebhookPayload(BaseModel):
    destination: str
    events: list[LineEvent]


class PromptPayQRRequest(BaseModel):
    merchant_id: str = Field(min_length=10, max_length=15)
    amount_thb: float = Field(gt=0)
    reference_1: str = Field(min_length=1, max_length=25)
    reference_2: str = Field(default="AETHERIUM", min_length=1, max_length=25)


class LiffIdentitySyncRequest(BaseModel):
    line_user_id: str = Field(min_length=3, max_length=128)
    google_sub: str = Field(min_length=3, max_length=128)


class TikTokCommentEvent(BaseModel):
    comment_id: str
    user_id: str
    text: str


class TikTokTrendRequest(BaseModel):
    trend_name: str
    key_points: list[str] = Field(default_factory=list)
    line_oa_link: str


def _tlv(tag: str, value: str) -> str:
    return f"{tag}{len(value):02d}{value}"


def _crc16_ccitt_false(payload: str) -> str:
    crc = binascii.crc_hqx(payload.encode("ascii"), 0xFFFF)
    return f"{crc:04X}"


def build_promptpay_qr_payload(*, merchant_id: str, amount_thb: float, reference_1: str, reference_2: str) -> str:
    amount = f"{amount_thb:.2f}"
    merchant_account_info = (
        _tlv("00", "A000000677010111")
        + _tlv("01", merchant_id)
        + _tlv("02", reference_1[:25])
        + _tlv("03", reference_2[:25])
    )
    body = "".join(
        [
            _tlv("00", "01"),
            _tlv("01", "12"),
            _tlv("29", merchant_account_info),
            _tlv("53", "764"),
            _tlv("54", amount),
            _tlv("58", "TH"),
            _tlv("63", ""),
        ]
    )
    return body + _crc16_ccitt_false(body)


async def process_agent_logic(event_data: dict[str, Any], user_id: str) -> None:
    bus = AetherBus()
    await bus.emit(
        "LINE_EVENT_TRIGGER",
        {
            "user_id": user_id,
            "content": event_data.get("message", {}),
            "context_id": f"ctx_{user_id}",
            "channel": "LINE",
        },
    )


def _detect_line_trigger(text: str) -> str:
    lowered = text.lower()
    if "ซื้อ" in text or "buy" in lowered:
        return "purchase_intent"
    return "message_received"


def build_tiktok_script(*, trend_name: str, key_points: list[str], line_oa_link: str) -> dict[str, Any]:
    ordered_points = [point.strip() for point in key_points if point.strip()]
    if not ordered_points:
        ordered_points = [f"Highlight why {trend_name} matters for Thai audiences."]

    script = {
        "hook": f"{trend_name} กำลังมาแรงในไทย — ห้ามพลาด!",
        "body": ordered_points,
        "cta": f"ทัก LINE OA เพื่อรับข้อเสนอพิเศษ: {line_oa_link}",
    }
    return {
        "topic": "TikTok_Automation",
        "script": script,
        "metadata": {
            "loop": "content_to_commerce",
            "locale": "th-TH",
        },
    }


@router.post("/line/webhook")
async def line_webhook(payload: LineWebhookPayload, background_tasks: BackgroundTasks) -> dict[str, Any]:
    processed: list[dict[str, Any]] = []
    for event in payload.events:
        text = event.message.text if event.message else ""
        trigger = _detect_line_trigger(text)
        resolution = resolver.resolve(channel="LINE", trigger=trigger, payload={"text": text})
        background_tasks.add_task(process_agent_logic, event_data=event.model_dump(by_alias=True), user_id=event.source.user_id)
        processed.append(
            {
                "line_user_id": event.source.user_id,
                "event_type": event.type,
                "trigger": resolution.trigger,
                "agents": list(resolution.agents),
                "actions": list(resolution.actions),
            }
        )
    return {"status": "accepted", "events": processed}


@router.post("/promptpay/qr")
def generate_promptpay_qr(payload: PromptPayQRRequest) -> dict[str, str]:
    qr_payload = build_promptpay_qr_payload(
        merchant_id=payload.merchant_id,
        amount_thb=payload.amount_thb,
        reference_1=payload.reference_1,
        reference_2=payload.reference_2,
    )
    resolution = resolver.resolve(channel="PROMPTPAY", trigger="payment_received")
    trace_id = hashlib.sha256(qr_payload.encode("ascii")).hexdigest()[:16]
    return {
        "status": "ready",
        "qr_payload": qr_payload,
        "trace_id": trace_id,
        "agents": ",".join(resolution.agents),
    }


@router.post("/liff/sync")
def liff_identity_sync(payload: LiffIdentitySyncRequest) -> dict[str, Any]:
    user = get_user_by_google_sub(payload.google_sub)
    if user is None:
        raise HTTPException(status_code=404, detail="Google identity not found")

    link = link_line_identity(user_id=user["user_id"], line_user_id=payload.line_user_id)
    resolution = resolver.resolve(channel="LIFF", trigger="identity_synced")
    return {
        "status": "linked",
        "user_id": user["user_id"],
        "line_user_id": link.provider_user_id,
        "agents": list(resolution.agents),
        "actions": list(resolution.actions),
    }


@router.post("/tiktok/comment")
def tiktok_comment_ingest(payload: TikTokCommentEvent) -> dict[str, Any]:
    resolution = resolver.resolve(channel="TIKTOK", trigger="comment_detected", payload={"text": payload.text})
    return {
        "status": "queued",
        "comment_id": payload.comment_id,
        "routing": {
            "agents": list(resolution.agents),
            "actions": list(resolution.actions),
        },
    }


@router.post("/tiktok/script")
async def tiktok_script_dispatch(payload: TikTokTrendRequest) -> dict[str, Any]:
    bus_payload = build_tiktok_script(
        trend_name=payload.trend_name,
        key_points=payload.key_points,
        line_oa_link=payload.line_oa_link,
    )
    bus = AetherBus()
    await bus.emit(bus_payload["topic"], bus_payload)
    return {
        "status": "queued",
        "topic": bus_payload["topic"],
        "script": bus_payload["script"],
    }
