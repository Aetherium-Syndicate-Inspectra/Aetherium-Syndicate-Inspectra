"""Google OAuth token verification endpoints for ASI."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional runtime dependency
    def load_dotenv() -> bool:
        return False

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.backend.db import create_or_get_user, get_subscription_by_user_id

try:
    from google.auth.transport import requests as grequests
    from google.oauth2 import id_token
except ImportError:  # pragma: no cover - optional runtime dependency
    id_token = None
    grequests = None

router = APIRouter()
# Load environment values from project root `.env` when present.
load_dotenv()
GOOGLE_CLIENT_ID = os.getenv("766326105036-dfjhu5840ig9dshnr6p7hj32ugjcsun5.apps.googleusercontent.com")
JWT_SECRET = os.getenv("ASI_JWT_SECRET", "asi-dev-secret")


class GoogleLoginRequest(BaseModel):
    """Incoming Google Identity payload.

    Supports both `credential` (Google Identity Services naming)
    and `token` (legacy clients).
    """

    credential: str | None = Field(default=None, description="Google ID token from GIS credential response")
    token: str | None = Field(default=None, description="Legacy token field")

    def resolve_token(self) -> str:
        value = self.credential or self.token
        if not value:
            raise HTTPException(status_code=422, detail="Missing Google token: expected `credential` or `token`")
        return value


class UserIdentity(BaseModel):
    email: str
    name: str | None = None
    picture: str | None = None
    uid: str


def _b64url(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def create_access_token(user_id: str, tier: str, email: str, expires_in: int = 3600) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "tier": tier,
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in,
    }
    header_b = _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = header_b + b"." + payload_b
    sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return b".".join([header_b, payload_b, _b64url(sig)]).decode("utf-8")


def verify_google_token(token: str) -> UserIdentity:
    """Validate Google ID token and convert it to ASI identity model."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not configured in .env")
    if id_token is None or grequests is None:
        raise HTTPException(status_code=503, detail="google-auth dependencies are not installed")

    try:
        idinfo = id_token.verify_oauth2_token(token, grequests.Request(), GOOGLE_CLIENT_ID)

        if idinfo.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
            raise ValueError("Wrong issuer")
        if idinfo.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Wrong audience")
        if not idinfo.get("email"):
            raise ValueError("Email not present in token")
        if idinfo.get("email_verified") is False:
            raise ValueError("Email is not verified")

        return UserIdentity(
            email=idinfo["email"],
            name=idinfo.get("name"),
            picture=idinfo.get("picture"),
            uid=idinfo.get("sub", ""),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Google Token: {exc}") from exc


@router.get("/api/auth/google/config")
async def google_auth_config() -> dict[str, Any]:
    return {
        "client_id": GOOGLE_CLIENT_ID,
        "configured": bool(GOOGLE_CLIENT_ID),
        "dependencies_ready": bool(id_token is not None and grequests is not None),
    }


@router.post("/api/auth/google")
async def google_login(request: GoogleLoginRequest) -> dict[str, Any]:
    identity = verify_google_token(request.resolve_token())

    user, api_key = create_or_get_user(
        email=identity.email,
        name=identity.name,
        picture=identity.picture,
        google_sub=identity.uid,
    )
    sub = get_subscription_by_user_id(user["user_id"])
    tier = sub.tier_level if sub else "SOLO"

    return {
        "status": "success",
        "access_token": create_access_token(user["user_id"], tier, identity.email),
        "user": {
            "id": user["user_id"],
            "email": identity.email,
            "name": user["name"],
            "picture": user["picture"],
            "tier": tier,
            "api_key": api_key,
        },
        "message": "Authenticated via Google",
    }
