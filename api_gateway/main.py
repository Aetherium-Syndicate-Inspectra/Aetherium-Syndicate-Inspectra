import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Body, FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api_gateway.aetherbus_extreme import AetherBusExtreme
from src.backend.causal_policy_lab import CausalPolicyLab
from src.backend.auth.google_auth import router as google_auth_router
from src.backend.genesis_core import (
    GenesisCoreService,
    IntentIngressRequest,
    LifecycleManager,
    SoulBreakError,
    WebSocketBridge,
    problem_details_from_error,
    verify_hmac_sha256,
)
from src.backend.policy_genome import PolicyGenomeEngine
from src.backend.resonance_feedback_loop import ResonanceFeedbackLoopOrchestrator
from src.backend.cogitator_x import (
    CogitatorXEngine,
    LanguageMixedThoughtGenerator,
    PangenesAgent,
    ProcessRewardModel,
    RuleBasedOutcomeReward,
    WisdomGemStore,
)
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

bus = AetherBusExtreme()
immune_system = ContractChecker()
causal_lab = CausalPolicyLab()
policy_genome_engine = PolicyGenomeEngine()
genesis_core = GenesisCoreService()
genesis_lifecycle = LifecycleManager()
genesis_bridge = WebSocketBridge(genesis_core.environment)
GENESIS_WEBHOOK_SECRET = "genesis-webhook-dev-secret"
resonance_orchestrator = ResonanceFeedbackLoopOrchestrator()
cogitator_engine = CogitatorXEngine(
    generator=LanguageMixedThoughtGenerator(),
    prm=ProcessRewardModel(),
    pangenes=PangenesAgent(WisdomGemStore()),
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    async def heartbeat_loop() -> None:
        while True:
            await genesis_core.environment.publish(
                "system.vitals",
                {"cpu_load": 0.32, "memory_usage": 0.41, "status": "genesis_online"},
            )
            await asyncio.sleep(2)

    await genesis_lifecycle.start(heartbeat_loop())
    try:
        yield
    finally:
        await genesis_lifecycle.shutdown()


app = FastAPI(title="Aetherium Syndicate Interface", lifespan=lifespan)

frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/dashboard/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="dashboard-assets")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.include_router(google_auth_router)

@app.exception_handler(SoulBreakError)
async def soulbreak_exception_handler(_request: Request, exc: SoulBreakError):
    status_code, payload = problem_details_from_error(exc, status_code=400)
    return JSONResponse(status_code=status_code, content=payload)


@app.get("/")
async def root():
    return {"status": "ONLINE", "brain_connected": HAS_BRAIN}


@app.get("/dashboard")
async def dashboard_index():
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse(
        status_code=503,
        content={"message": "frontend build is not available. Build frontend/ to enable /dashboard"},
    )


@app.get("/dashboard/{path:path}")
async def dashboard_spa(path: str):
    index_file = frontend_dist / "index.html"
    asset_file = frontend_dist / path
    if asset_file.exists() and asset_file.is_file():
        return FileResponse(asset_file)
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse(status_code=503, content={"message": "frontend build is not available"})


@app.get("/api/v1/tachyon/metrics")
async def tachyon_metrics():
    now = datetime.now(tz=timezone.utc)
    metrics = {
        "timestamp": int(now.timestamp() * 1000),
        "latency_us": 0.3,
        "throughput_rps": 12847,
        "memory_percent": 67.2,
        "source": "tachyon_core" if HAS_BRAIN else "simulated",
    }
    if HAS_BRAIN and hasattr(tachyon_engine, "status"):
        try:
            metrics["engine_status"] = tachyon_engine.status()
        except Exception:  # pragma: no cover
            metrics["engine_status"] = "unavailable"
    return metrics


@app.get("/api/v1/resonance/drift")
async def resonance_drift():
    snapshot = resonance_orchestrator.ingest_feedback(
        user_id="dashboard-system",
        intent="monitoring",
        response="heartbeat",
        feedback_score=0.97,
    )
    return {
        "resonance_score": snapshot.resonance_score,
        "switch_count": snapshot.switch_count,
        "switch_success_rate": snapshot.switch_success_rate,
        "current_preferences": snapshot.current_preferences,
    }


@app.get("/api/v1/agents/council")
async def agents_council():
    return {
        "agents": [
            {"id": "ceo-01", "name": "APEX-Ω", "role": "Chief Executive Officer", "status": "active"},
            {"id": "cto-01", "name": "FORGE-Δ", "role": "Chief Technology Officer", "status": "processing"},
            {"id": "cfo-01", "name": "VAULT-Σ", "role": "Chief Financial Officer", "status": "active"},
        ]
    }


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
    await bus.subscribe("CODE_GEN_UPDATE", synapse_handler)

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
        await bus.unsubscribe("CODE_GEN_UPDATE", synapse_handler)
        logger.info("🔌 Dashboard Disconnected")


@app.websocket("/ws/aetherbus")
async def websocket_aetherbus(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(
                {
                    "type": "HEARTBEAT",
                    "status": "AETHERBUS_ACTIVE",
                    "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
                }
            )
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        logger.info("🔌 AetherBus client disconnected")


@app.post("/api/v1/chat/llm")
async def chat_with_internal_llm(payload: dict = Body(...)):
    prompt = str(payload.get("prompt", "")).strip()
    if not prompt:
        return JSONResponse(status_code=400, content={"message": "prompt is required"})

    result = cogitator_engine.solve(
        prompt=prompt,
        outcome_reward=RuleBasedOutcomeReward(lambda _answer: True),
        compute_budget=8,
        base_branch_factor=3,
        language_mode="mixed",
    )

    answer = str(result.get("answer", "")).strip()
    if answer == "insufficient-data" or not answer:
        answer = f"[Cogitator-X] ได้รับคำถามแล้ว: {prompt}\nสรุปเบื้องต้น: ควรเพิ่มบริบทหรือข้อมูลเชิงตัวเลขเพื่อให้ตอบได้แม่นยำยิ่งขึ้น"

    return {
        "answer": answer,
        "confidence": float(result.get("confidence", 0.0)),
        "engine": "cogitator_x_internal",
    }


@app.get("/api/genesis/terminology")
async def get_genesis_terminology():
    return {"mapping": genesis_core.terminology.snapshot()}


@app.post("/api/genesis/intent")
async def ingest_genesis_intent(payload: dict = Body(...)):
    envelope = await genesis_core.ingest_intent(IntentIngressRequest(**payload))
    return {
        "protocol": ["devordota", "akashic_envelope", "aetherbus", "digisonic"],
        "envelope": envelope.model_dump(),
    }


@app.post("/api/genesis/webhook/ingest")
async def genesis_webhook_ingest(request: Request):
    raw = await request.body()
    signature = request.headers.get("X-Genesis-Signature")
    if not verify_hmac_sha256(raw, signature, secret=GENESIS_WEBHOOK_SECRET):
        return JSONResponse(status_code=401, content={"status": "invalid_signature"})
    payload = await request.json()
    envelope = await genesis_core.ingest_intent(IntentIngressRequest(**payload))
    return {"status": "ok", "vector_id": envelope.intent_vector.vector_id}


@app.websocket("/ws/genesis")
async def websocket_genesis(websocket: WebSocket):
    await websocket.accept()
    await genesis_bridge.attach(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await genesis_bridge.detach(websocket)


if __name__ == "__main__":
    import uvicorn

    logger.info("🚀 Aetherium Manifest: Awakening Sequence Initiated...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
