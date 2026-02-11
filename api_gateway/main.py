import json
import logging

import uvicorn
from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api_gateway.aetherbus_extreme import AetherBusExtreme
from src.backend.causal_policy_lab import CausalPolicyLab
from src.backend.policy_genome import PolicyGenomeEngine
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
causal_lab = CausalPolicyLab()
policy_genome_engine = PolicyGenomeEngine()

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


@app.post("/causal/estimate")
async def causal_estimate(payload: dict = Body(...)):
    treatment = payload.get("treatment")
    outcome = payload.get("outcome")
    common_causes = payload.get("common_causes")
    method = payload.get("method", "propensity_score_matching")
    if not treatment or not outcome:
        return {"error": "treatment and outcome are required", "causal_effect": None}
    return causal_lab.estimate_causal_effect(
        treatment=treatment,
        outcome=outcome,
        common_causes=common_causes,
        method=method,
    )


@app.get("/causal/recommend")
async def causal_recommend(top_n: int = 3):
    return {"recommendations": causal_lab.recommend_policies(top_n=top_n)}


@app.post("/policy-genome/build")
async def build_policy_genome(payload: dict = Body(default={})):
    policies = payload.get("policies") or causal_lab.recommend_policies(top_n=payload.get("top_n", 5))
    graph = policy_genome_engine.build_graph(policies)
    output_path = payload.get("output_path")
    if output_path:
        policy_genome_engine.save_graph(graph, output_path)
    return graph


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
