import pytest

pytest.importorskip("fastapi")

from fastapi.testclient import TestClient

from src.backend.api_server import app
from src.backend.cogitator_x import SynergyResolver
from src.backend.db import create_or_get_user, get_conn
from src.backend.integration_layer import build_promptpay_qr_payload, build_tiktok_script


def test_synergy_resolver_routes_promptpay_and_edtech() -> None:
    resolver = SynergyResolver()

    result = resolver.resolve(
        channel="promptpay",
        trigger="payment_received",
        payload={"category": "high-tech"},
    )

    assert "finops" in result.agents
    assert "edtech" in result.agents
    assert "record_income" in result.actions


def test_promptpay_payload_is_deterministic() -> None:
    payload1 = build_promptpay_qr_payload(
        merchant_id="006600123456789",
        amount_thb=149.50,
        reference_1="ORDER1001",
        reference_2="AETHERIUM",
    )
    payload2 = build_promptpay_qr_payload(
        merchant_id="006600123456789",
        amount_thb=149.50,
        reference_1="ORDER1001",
        reference_2="AETHERIUM",
    )

    assert payload1 == payload2
    assert len(payload1) > 20
    assert all(char in "0123456789ABCDEF" for char in payload1[-4:])


def test_line_webhook_and_liff_sync_roundtrip() -> None:
    user, _ = create_or_get_user(
        email="integration-test@example.com",
        name="Integration",
        picture=None,
        google_sub="google-sub-integration-1",
    )

    client = TestClient(app)
    line_response = client.post(
        "/api/integrations/line/webhook",
        json={
            "destination": "line_oa",
            "events": [
                {
                    "type": "message",
                    "source": {"userId": "line-user-001"},
                    "message": {"type": "text", "text": "อยากซื้อคอร์ส AI"},
                }
            ],
        },
    )

    assert line_response.status_code == 200
    event = line_response.json()["events"][0]
    assert event["trigger"] == "purchase_intent"

    liff_response = client.post(
        "/api/integrations/liff/sync",
        json={"line_user_id": "line-user-001", "google_sub": "google-sub-integration-1"},
    )

    assert liff_response.status_code == 200
    assert liff_response.json()["user_id"] == user["user_id"]

    with get_conn() as conn:
        row = conn.execute(
            "SELECT provider_user_id FROM identity_links WHERE user_id = ? AND provider = 'LINE'",
            (user["user_id"],),
        ).fetchone()
    assert row is not None
    assert row["provider_user_id"] == "line-user-001"


def test_tiktok_script_builder_contains_hook_body_and_cta() -> None:
    payload = build_tiktok_script(
        trend_name="ทองคำ 2026",
        key_points=["สรุปราคา", "ความเสี่ยง", "วิธีเริ่มต้น"],
        line_oa_link="https://line.me/R/ti/p/@aetherium",
    )

    assert payload["topic"] == "TikTok_Automation"
    assert payload["script"]["hook"].startswith("ทองคำ 2026")
    assert len(payload["script"]["body"]) == 3
    assert "LINE OA" in payload["script"]["cta"]
