from src.backend import db


def test_upsert_user_context_persists_cross_platform_mapping(tmp_path):
    db.DB_PATH = tmp_path / "asi-context.db"
    db.init_db()
    user_id, _ = db.create_default_user("ctx@example.com", "Ctx", None, "google-sub-ctx")

    db.upsert_user_context(user_id=user_id, line_user_id="line-123", google_sub="google-sub-ctx", tiktok_user_id="tt-555")

    with db.get_conn() as conn:
        row = conn.execute("SELECT * FROM user_contexts WHERE user_id = ?", (user_id,)).fetchone()

    assert row is not None
    assert row["line_user_id"] == "line-123"
    assert row["tiktok_user_id"] == "tt-555"


def test_create_or_get_user_updates_google_link_for_existing_email(tmp_path):
    db.DB_PATH = tmp_path / "asi-auth.db"
    db.init_db()

    user_id, _ = db.create_default_user("auth@example.com", "Auth User", None, None)

    user, api_key = db.create_or_get_user(
        email="auth@example.com",
        name="Auth User",
        picture="https://example.com/avatar.png",
        google_sub="google-sub-123",
    )

    assert api_key is None
    assert user["user_id"] == user_id
    assert user["google_sub"] == "google-sub-123"
    assert user["picture"] == "https://example.com/avatar.png"


def test_create_or_get_user_prefers_existing_google_sub_link(tmp_path):
    db.DB_PATH = tmp_path / "asi-auth-sub.db"
    db.init_db()

    user_id, _ = db.create_default_user("owner@example.com", "Owner", None, "google-sub-owner")

    user, api_key = db.create_or_get_user(
        email="new-email@example.com",
        name="Owner",
        picture=None,
        google_sub="google-sub-owner",
    )

    assert api_key is None
    assert user["user_id"] == user_id
    assert user["email"] == "owner@example.com"


def test_create_or_get_user_backfills_google_sub_when_legacy_value_is_blank(tmp_path):
    db.DB_PATH = tmp_path / "asi-auth-blank-sub.db"
    db.init_db()

    user_id, _ = db.create_default_user("legacy@example.com", "Legacy", None, None)
    with db.get_conn() as conn:
        conn.execute("UPDATE users SET google_sub = '' WHERE user_id = ?", (user_id,))
        conn.commit()

    user, api_key = db.create_or_get_user(
        email="legacy@example.com",
        name="Legacy",
        picture=None,
        google_sub="google-sub-recovered",
    )

    assert api_key is None
    assert user["user_id"] == user_id
    assert user["google_sub"] == "google-sub-recovered"


def test_upsert_user_context_does_not_clear_existing_context_json_when_omitted(tmp_path):
    db.DB_PATH = tmp_path / "asi-context-preserve.db"
    db.init_db()
    user_id, _ = db.create_default_user("ctx-preserve@example.com", "Ctx Preserve", None, None)

    db.upsert_user_context(user_id=user_id, context_json='{"persona":"analyst"}')
    db.upsert_user_context(user_id=user_id, line_user_id="line-789")

    with db.get_conn() as conn:
        row = conn.execute("SELECT * FROM user_contexts WHERE user_id = ?", (user_id,)).fetchone()

    assert row is not None
    assert row["line_user_id"] == "line-789"
    assert row["context_json"] == '{"persona":"analyst"}'


def test_upsert_user_context_uses_default_context_json_on_initial_insert(tmp_path):
    db.DB_PATH = tmp_path / "asi-context-default.db"
    db.init_db()
    user_id, _ = db.create_default_user("ctx-default@example.com", "Ctx Default", None, None)

    db.upsert_user_context(user_id=user_id)

    with db.get_conn() as conn:
        row = conn.execute("SELECT * FROM user_contexts WHERE user_id = ?", (user_id,)).fetchone()

    assert row is not None
    assert row["context_json"] == "{}"


def test_upsert_user_context_backfills_legacy_null_context_json(tmp_path):
    db.DB_PATH = tmp_path / "asi-context-legacy-null.db"
    db.init_db()
    user_id, _ = db.create_default_user("ctx-legacy@example.com", "Ctx Legacy", None, None)

    with db.get_conn() as conn:
        conn.execute(
            """
            INSERT INTO user_contexts (user_id, context_json, created_at, updated_at)
            VALUES (?, NULL, ?, ?)
            """,
            (user_id, db.now_iso(), db.now_iso()),
        )
        conn.commit()

    db.upsert_user_context(user_id=user_id, line_user_id="line-legacy-001")

    with db.get_conn() as conn:
        row = conn.execute("SELECT * FROM user_contexts WHERE user_id = ?", (user_id,)).fetchone()

    assert row is not None
    assert row["line_user_id"] == "line-legacy-001"
    assert row["context_json"] == "{}"
