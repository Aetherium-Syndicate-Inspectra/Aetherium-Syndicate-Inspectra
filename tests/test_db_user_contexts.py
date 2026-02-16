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
