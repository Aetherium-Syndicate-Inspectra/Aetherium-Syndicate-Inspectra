"""Seed demo users and subscriptions for local entitlement testing."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.backend.db import create_default_user, init_db

SEED_USERS = [
    ("solo@example.com", "Solo User"),
    ("syndicate@example.com", "Syndicate User"),
    ("singularity@example.com", "Singularity User"),
]


def main() -> None:
    init_db()
    for email, name in SEED_USERS:
        try:
            user_id, api_key = create_default_user(email=email, name=name, picture=None)
            print(f"created {email}: user_id={user_id} api_key={api_key}")
        except Exception as exc:
            print(f"skip {email}: {exc}")


if __name__ == "__main__":
    main()
