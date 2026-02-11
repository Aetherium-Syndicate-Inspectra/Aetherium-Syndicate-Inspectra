import json
import logging

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api_gateway.aetherbus_extreme import AetherBusExtreme
from tools.contracts.contract_checker import ContractChecker

logger = logging.getLogger("AetherGateway")

try:
    import tachyon_core

    tachyon_engine = tachyon_core.TachyonEngine()
    HAS_BRAIN = True
    logger.info("🧠 Tachyon Core: CONNECTED")
except ImportError:
    HAS_BRAIN = False
    tachyon_engine = None
    logger.warning("⚠️ Tachyon Core: NOT FOUND (Running in Spinal Reflex Mode)")

app = FastAPI(title="Aetherium Syndicate Interface")
bus = AetherBusExtreme()
immune_system = ContractChecker()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ONLINE", "brain_connected": HAS_BRAIN}


@app.get("/api/events/recent")
async def recent_events(limit: int = 50):
    return {"events": bus.recent_events(limit=limit)}


@app.post("/api/genesis/mint")
async def mint_agent(seed: int = 1000):
    """สั่งสมองให้สร้าง Agent ใหม่ (Identity Crystallization)"""
    if not HAS_BRAIN:
        return {"error": "Brain missing"}

    deck_bytes = tachyon_engine.mint_starter_deck(seed)
    sentinel, catalyst, harmonizer = deck_bytes

    agents = {
        "sentinel": json.loads(tachyon_engine.inspect_identity_json(sentinel)),
        "catalyst": json.loads(tachyon_engine.inspect_identity_json(catalyst)),
        "harmonizer": json.loads(tachyon_engine.inspect_identity_json(harmonizer)),
    }

    await bus.emit("AGENT_MINTED", agents)
    return agents


@app.websocket("/ws/feed")
async def websocket_endpoint(websocket: WebSocket):
    """ท่อส่งข้อมูล Real-time ไปยัง Dashboard"""
    await websocket.accept()

    async def synapse_handler(event):
        try:
            await websocket.send_json(event)
        except Exception:  # pragma: no cover
            logger.debug("WebSocket send failed")

    await bus.subscribe("AGENT_MINTED", synapse_handler)
    await bus.subscribe("SYSTEM_ALERT", synapse_handler)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
            except json.JSONDecodeError:
                await bus.emit("SYSTEM_ALERT", {"message": "Malformed JSON payload", "raw": data})
                continue

            is_valid, result = immune_system.validate_adaptive(parsed, contract_type="ipw_v1")
            if not is_valid:
                await bus.emit("SYSTEM_ALERT", {"message": "Contract violation", "detail": result})
                continue

            event = immune_system.canonicalize_event(parsed, event_type="USER_INPUT", source="dashboard")
            event["quality"] = result["quality"]
            await bus.emit("USER_INPUT", event)

    except WebSocketDisconnect:
        await bus.unsubscribe("AGENT_MINTED", synapse_handler)
        await bus.unsubscribe("SYSTEM_ALERT", synapse_handler)
        logger.info("🔌 Dashboard Disconnected")


if __name__ == "__main__":
    logger.info("🚀 Aetherium Manifest: Awakening Sequence Initiated...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
