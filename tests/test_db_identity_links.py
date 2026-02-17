from src.backend import db


def test_link_line_identity_reassigns_existing_line_user_to_new_user(tmp_path):
    db.DB_PATH = tmp_path / "asi-identity.db"
    db.init_db()

    user_one, _ = db.create_default_user("one@example.com", "One", None, None)
    user_two, _ = db.create_default_user("two@example.com", "Two", None, None)

    first_link = db.link_line_identity(user_id=user_one, line_user_id="line-dup-001")
    second_link = db.link_line_identity(user_id=user_two, line_user_id="line-dup-001")

    assert first_link.user_id == user_one
    assert second_link.user_id == user_two

    with db.get_conn() as conn:
        rows = conn.execute(
            "SELECT user_id, provider_user_id FROM identity_links WHERE provider = 'LINE'"
        ).fetchall()

    assert len(rows) == 1
    assert rows[0]["provider_user_id"] == "line-dup-001"
    assert rows[0]["user_id"] == user_two
