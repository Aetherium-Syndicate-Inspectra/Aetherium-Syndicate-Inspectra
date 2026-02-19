from src.backend import db


def test_add_payment_method_self_heals_missing_default_flag(tmp_path):
    db.DB_PATH = tmp_path / "asi-payments.db"
    db.init_db()
    user_id, _ = db.create_default_user("billing@example.com", "Billing", None, None)

    first = db.add_payment_method(
        user_id=user_id,
        provider="STRIPE",
        token_id="tok_first",
        last_digits="4242",
        bank_name=None,
        is_default=False,
    )
    assert first.is_default == 1

    with db.get_conn() as conn:
        conn.execute("UPDATE payment_methods SET is_default = 0 WHERE user_id = ?", (user_id,))
        conn.commit()

    second = db.add_payment_method(
        user_id=user_id,
        provider="OMISE",
        token_id="tok_second",
        last_digits="1111",
        bank_name="KBank",
        is_default=False,
    )

    assert second.is_default == 1
    default_method = db.get_default_payment_method(user_id)
    assert default_method is not None
    assert default_method.id == second.id
