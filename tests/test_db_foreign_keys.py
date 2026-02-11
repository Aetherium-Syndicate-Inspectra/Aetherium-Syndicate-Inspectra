import sqlite3

import pytest

from src.backend import db


def test_foreign_keys_are_enforced_per_connection(tmp_path):
    db.DB_PATH = tmp_path / "asi-test.db"
    db.init_db()

    with db.get_conn() as conn:
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute(
                "INSERT INTO subscriptions (user_id, api_key_hash) VALUES (?, ?)",
                ("missing-user", "hash-123"),
            )
            conn.commit()
