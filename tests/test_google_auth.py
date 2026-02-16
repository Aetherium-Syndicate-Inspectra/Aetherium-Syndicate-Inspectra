import base64
import json

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.backend.auth import google_auth


class _FakeReq:
    pass


def _decode_payload(jwt_token: str) -> dict:
    payload_b64 = jwt_token.split(".")[1]
    payload_b64 += "=" * (-len(payload_b64) % 4)
    return json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))


def test_create_access_token_contains_expected_claims(monkeypatch):
    monkeypatch.setattr(google_auth, "JWT_SECRET", "test-secret")
    token = google_auth.create_access_token("user-123", "SOLO", "dev@example.com", expires_in=120)

    parts = token.split(".")
    assert len(parts) == 3
    payload = _decode_payload(token)
    assert payload["sub"] == "user-123"
    assert payload["tier"] == "SOLO"
    assert payload["email"] == "dev@example.com"
    assert payload["exp"] > payload["iat"]


def test_verify_google_token_rejects_wrong_issuer(monkeypatch):
    monkeypatch.setattr(google_auth, "GOOGLE_CLIENT_ID", "cid.apps.googleusercontent.com")
    monkeypatch.setattr(google_auth, "grequests", type("ReqMod", (), {"Request": _FakeReq}))

    def _bad_verify(token, req, client_id):  # noqa: ARG001
        return {
            "iss": "bad-issuer",
            "aud": client_id,
            "email": "user@example.com",
            "email_verified": True,
            "sub": "google-sub",
        }

    monkeypatch.setattr(google_auth, "id_token", type("TokMod", (), {"verify_oauth2_token": staticmethod(_bad_verify)}))

    response = None
    try:
        google_auth.verify_google_token("fake")
    except Exception as exc:  # fastapi HTTPException
        response = exc

    assert response is not None
    assert getattr(response, "status_code", None) == 401
    assert "Wrong issuer" in getattr(response, "detail", "")


def test_google_login_accepts_credential_field(monkeypatch):
    app = FastAPI()
    app.include_router(google_auth.router)
    client = TestClient(app)

    monkeypatch.setattr(
        google_auth,
        "verify_google_token",
        lambda token: google_auth.UserIdentity(
            email="user@example.com",
            name="ASI User",
            picture="https://example.com/u.png",
            uid="google-sub-1",
        ),
    )
    monkeypatch.setattr(
        google_auth,
        "create_or_get_user",
        lambda **kwargs: (
            {"user_id": "u-1", "name": kwargs["name"], "picture": kwargs["picture"]},
            "asi_api_key_123",
        ),
    )
    monkeypatch.setattr(google_auth, "get_subscription_by_user_id", lambda user_id: None)  # noqa: ARG005

    response = client.post("/api/auth/google", json={"credential": "google-token"})
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "success"
    assert payload["user"]["email"] == "user@example.com"
    assert payload["user"]["tier"] == "SOLO"
    assert payload["message"] == "Authenticated via Google"
