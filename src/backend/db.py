"""SQLite helpers for subscriptions, usage, auth state, and fiat payment integration."""

from __future__ import annotations

import hashlib
import os
import sqlite3
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

DB_PATH = Path(os.getenv("ASI_DB_PATH", "data/asi.db"))


@dataclass
class SubscriptionRecord:
    user_id: str
    api_key_hash: str
    tier_level: str
    status: str
    start_date: str | None
    next_billing_date: str | None
    max_agents: int
    ghost_worker_quota: int
    tachyon_priority: int
    ghost_used_today: int


@dataclass
class PaymentMethodRecord:
    id: int
    user_id: str
    provider: str
    token_id: str
    last_digits: str | None
    bank_name: str | None
    is_default: int
    created_at: str


@dataclass
class IdentityLinkRecord:
    id: int
    user_id: str
    provider: str
    provider_user_id: str
    created_at: str
    updated_at: str


@contextmanager
def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # NOTE: SQLite foreign key checks are connection-scoped and disabled by default.
    # Enforce it for every new connection so relational integrity is preserved
    # beyond init_db() lifecycle.
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()


def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


def now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                picture TEXT,
                google_sub TEXT UNIQUE,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                user_id TEXT PRIMARY KEY,
                api_key_hash TEXT UNIQUE NOT NULL,
                tier_level TEXT NOT NULL DEFAULT 'SOLO' CHECK(tier_level IN ('SOLO', 'SYNDICATE', 'SINGULARITY')),
                status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED')),
                start_date TEXT,
                next_billing_date TEXT,
                max_agents INTEGER NOT NULL DEFAULT 3,
                ghost_worker_quota INTEGER NOT NULL DEFAULT 0,
                tachyon_priority INTEGER NOT NULL DEFAULT 1,
                ghost_used_today INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS usage_logs (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                feature_type TEXT NOT NULL,
                cost_credits INTEGER NOT NULL,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS agents_registry (
                agent_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                provider TEXT NOT NULL DEFAULT 'OMISE' CHECK(provider IN ('OMISE', 'STRIPE', 'K_BANK')),
                token_id TEXT NOT NULL,
                last_digits TEXT,
                bank_name TEXT,
                is_default INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('SUBSCRIPTION', 'TOPUP')),
                status TEXT NOT NULL CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED')),
                gateway_ref_id TEXT,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS identity_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                provider TEXT NOT NULL CHECK(provider IN ('LINE')),
                provider_user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(provider, provider_user_id),
                UNIQUE(user_id, provider),
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );


            CREATE TABLE IF NOT EXISTS user_contexts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                line_user_id TEXT,
                google_sub TEXT,
                tiktok_user_id TEXT,
                context_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(user_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );
            """
        )

        conn.commit()


def create_default_user(email: str, name: str | None, picture: str | None, google_sub: str | None = None) -> tuple[str, str]:
    user_id = str(uuid.uuid4())
    api_key = f"asi_{uuid.uuid4().hex}{uuid.uuid4().hex[:8]}"
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO users (user_id, email, name, picture, google_sub, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, name, picture, google_sub, now_iso()),
        )
        conn.execute(
            """
            INSERT INTO subscriptions
            (user_id, api_key_hash, tier_level, status, start_date, next_billing_date, max_agents, ghost_worker_quota, tachyon_priority, ghost_used_today)
            VALUES (?, ?, 'SOLO', 'ACTIVE', ?, ?, 3, 0, 1, 0)
            """,
            (user_id, hash_api_key(api_key), now_iso(), (datetime.now(tz=timezone.utc) + timedelta(days=30)).isoformat()),
        )
        conn.commit()
    return user_id, api_key


def get_user_by_email(email: str) -> sqlite3.Row | None:
    with get_conn() as conn:
        return conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()


def get_user_by_google_sub(google_sub: str) -> sqlite3.Row | None:
    with get_conn() as conn:
        return conn.execute("SELECT * FROM users WHERE google_sub = ?", (google_sub,)).fetchone()


def get_user_subscription_by_api_key(api_key: str) -> SubscriptionRecord | None:
    api_key_hash = hash_api_key(api_key)
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM subscriptions WHERE api_key_hash = ?", (api_key_hash,)).fetchone()
        return SubscriptionRecord(**dict(row)) if row else None


def get_subscription_by_user_id(user_id: str) -> SubscriptionRecord | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM subscriptions WHERE user_id = ?", (user_id,)).fetchone()
        return SubscriptionRecord(**dict(row)) if row else None


def get_current_agent_count(user_id: str) -> int:
    with get_conn() as conn:
        row = conn.execute("SELECT COUNT(*) AS c FROM agents_registry WHERE user_id = ?", (user_id,)).fetchone()
        return int(row["c"])


def register_agent(user_id: str) -> str:
    agent_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute("INSERT INTO agents_registry (agent_id, user_id, created_at) VALUES (?, ?, ?)", (agent_id, user_id, now_iso()))
        conn.commit()
    return agent_id


def log_usage(user_id: str, feature_type: str, cost_credits: int) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO usage_logs (user_id, feature_type, cost_credits, timestamp) VALUES (?, ?, ?, ?)",
            (user_id, feature_type, cost_credits, now_iso()),
        )
        conn.commit()


def update_subscription_tier(user_id: str, tier_level: str, max_agents: int, ghost_worker_quota: int, tachyon_priority: int) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE subscriptions
            SET tier_level = ?,
                max_agents = ?,
                ghost_worker_quota = ?,
                tachyon_priority = ?,
                next_billing_date = ?
            WHERE user_id = ?
            """,
            (
                tier_level,
                max_agents,
                ghost_worker_quota,
                tachyon_priority,
                (datetime.now(tz=timezone.utc) + timedelta(days=30)).isoformat(),
                user_id,
            ),
        )
        conn.commit()


def create_or_get_user(email: str, name: str | None, picture: str | None, google_sub: str | None = None) -> tuple[sqlite3.Row, str | None]:
    if google_sub:
        linked = get_user_by_google_sub(google_sub)
        if linked:
            return linked, None

    existing = get_user_by_email(email)
    if existing:
        with get_conn() as conn:
            conn.execute(
                """
                UPDATE users
                SET name = COALESCE(?, name),
                    picture = COALESCE(?, picture),
                    google_sub = COALESCE(google_sub, ?)
                WHERE user_id = ?
                """,
                (name, picture, google_sub, existing["user_id"]),
            )
            updated = conn.execute("SELECT * FROM users WHERE user_id = ?", (existing["user_id"],)).fetchone()
            conn.commit()
        return updated, None

    user_id, api_key = create_default_user(email=email, name=name, picture=picture, google_sub=google_sub)
    with get_conn() as conn:
        created = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    return created, api_key


def add_payment_method(
    user_id: str,
    provider: str,
    token_id: str,
    last_digits: str | None,
    bank_name: str | None,
    is_default: bool,
) -> PaymentMethodRecord:
    with get_conn() as conn:
        if is_default:
            conn.execute("UPDATE payment_methods SET is_default = 0 WHERE user_id = ?", (user_id,))

        conn.execute(
            """
            INSERT INTO payment_methods (user_id, provider, token_id, last_digits, bank_name, is_default, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, provider, token_id, last_digits, bank_name, int(is_default), now_iso()),
        )
        payment_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]

        # First payment method becomes default automatically.
        if payment_id and conn.execute("SELECT COUNT(*) AS c FROM payment_methods WHERE user_id = ?", (user_id,)).fetchone()["c"] == 1:
            conn.execute("UPDATE payment_methods SET is_default = 1 WHERE id = ?", (payment_id,))

        row = conn.execute("SELECT * FROM payment_methods WHERE id = ?", (payment_id,)).fetchone()
        conn.commit()

    return PaymentMethodRecord(**dict(row))


def list_payment_methods(user_id: str) -> list[PaymentMethodRecord]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
            (user_id,),
        ).fetchall()
    return [PaymentMethodRecord(**dict(row)) for row in rows]


def get_default_payment_method(user_id: str) -> PaymentMethodRecord | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM payment_methods WHERE user_id = ? AND is_default = 1 ORDER BY created_at DESC LIMIT 1",
            (user_id,),
        ).fetchone()
    return PaymentMethodRecord(**dict(row)) if row else None


def create_transaction(user_id: str, amount: float, tx_type: str, status: str = "PENDING", gateway_ref_id: str | None = None) -> str:
    tx_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO transactions (id, user_id, amount, type, status, gateway_ref_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (tx_id, user_id, amount, tx_type, status, gateway_ref_id, now_iso()),
        )
        conn.commit()
    return tx_id


def update_transaction_status(tx_id: str, status: str, gateway_ref_id: str | None = None) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE transactions SET status = ?, gateway_ref_id = COALESCE(?, gateway_ref_id) WHERE id = ?",
            (status, gateway_ref_id, tx_id),
        )
        conn.commit()


def link_line_identity(*, user_id: str, line_user_id: str) -> IdentityLinkRecord:
    timestamp = now_iso()
    with get_conn() as conn:
        # Keep LINE identity mappings one-to-one across users. If the same
        # LINE account is linked again (e.g. user account merge/recovery),
        # move that mapping to the latest user_id instead of raising an
        # uncaught UNIQUE constraint error.
        conn.execute(
            """
            DELETE FROM identity_links
            WHERE provider = 'LINE' AND provider_user_id = ? AND user_id <> ?
            """,
            (line_user_id, user_id),
        )
        conn.execute(
            """
            INSERT INTO identity_links (user_id, provider, provider_user_id, created_at, updated_at)
            VALUES (?, 'LINE', ?, ?, ?)
            ON CONFLICT(user_id, provider)
            DO UPDATE SET provider_user_id = excluded.provider_user_id, updated_at = excluded.updated_at
            """,
            (user_id, line_user_id, timestamp, timestamp),
        )
        row = conn.execute(
            "SELECT * FROM identity_links WHERE user_id = ? AND provider = 'LINE'",
            (user_id,),
        ).fetchone()
        conn.commit()
    return IdentityLinkRecord(**dict(row))


async def update_payment_status(*, user_id: str, amount: float, status: str) -> str:
    tx_type = "TOPUP"
    normalized_status = status if status in {"PENDING", "SUCCESS", "FAILED"} else "SUCCESS"
    return create_transaction(user_id=user_id, amount=amount, tx_type=tx_type, status=normalized_status)


async def activate_service(user_id: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE subscriptions SET status = 'ACTIVE', next_billing_date = ? WHERE user_id = ?",
            ((datetime.now(tz=timezone.utc) + timedelta(days=30)).isoformat(), user_id),
        )
        conn.commit()


def upsert_user_context(
    *,
    user_id: str,
    line_user_id: str | None = None,
    google_sub: str | None = None,
    tiktok_user_id: str | None = None,
    context_json: str | None = None,
) -> None:
    timestamp = now_iso()
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO user_contexts (user_id, line_user_id, google_sub, tiktok_user_id, context_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, COALESCE(?, '{}'), ?, ?)
            ON CONFLICT(user_id)
            DO UPDATE SET
                line_user_id = COALESCE(excluded.line_user_id, user_contexts.line_user_id),
                google_sub = COALESCE(excluded.google_sub, user_contexts.google_sub),
                tiktok_user_id = COALESCE(excluded.tiktok_user_id, user_contexts.tiktok_user_id),
                context_json = CASE
                    WHEN ? IS NULL THEN COALESCE(user_contexts.context_json, '{}')
                    ELSE excluded.context_json
                END,
                updated_at = excluded.updated_at
            """,
            (user_id, line_user_id, google_sub, tiktok_user_id, context_json, timestamp, timestamp, context_json),
        )
        conn.commit()
