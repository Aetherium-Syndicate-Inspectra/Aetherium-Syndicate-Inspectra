import asyncio

from src.backend.cogitator_x import AgentFinPay


class DummyVisualEngine:
    def __init__(self, data):
        self.data = data

    async def analyze_slip(self, _image_data):
        return self.data


class DummyDB:
    def __init__(self):
        self.updated = None
        self.activated = None

    async def update_payment_status(self, *, user_id, amount, status):
        self.updated = (user_id, amount, status)

    async def activate_service(self, user_id):
        self.activated = user_id


def test_agent_finpay_verifies_slip_and_activates_service() -> None:
    db = DummyDB()
    visual = DummyVisualEngine({"is_valid_slip": True, "ref_id": "ABC123", "amount": 499.0})
    service = AgentFinPay(db=db, visual_engine=visual)

    message = asyncio.run(service.verify_slip_and_activate(image_data=b"img", user_id="user-001"))

    assert "499.00" in message
    assert db.updated == ("user-001", 499.0, "COMPLETED")
    assert db.activated == "user-001"


def test_agent_finpay_rejects_invalid_slip() -> None:
    db = DummyDB()
    visual = DummyVisualEngine({"is_valid_slip": False})
    service = AgentFinPay(db=db, visual_engine=visual)

    message = asyncio.run(service.verify_slip_and_activate(image_data=b"img", user_id="user-001"))

    assert message == "สลิปไม่ถูกต้อง กรุณาส่งใหม่อีกครั้ง"
    assert db.updated is None
