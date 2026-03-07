import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.backend.core.aetherbus_extreme import AetherBusExtreme
from src.backend.causal_policy_lab import CausalPolicyLab
from src.backend.auth.google_auth import router as google_auth_router
from src.backend.freeze_api import router as freeze_router
from src.backend.resonance_drift_api import router as resonance_drift_router
from src.backend.integration_layer import router as integration_router
from src.backend.economy.router import (
    router as billing_router,
    credits_router,
    marketplace_router
)
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
from src.backend.reasoning_profile import select_reasoning_profile
from src.backend.cogitator_x import (
    CogitatorXEngine,
    LanguageMixedThoughtGenerator,
    PangenesAgent,
    ProcessRewardModel,
    RuleBasedOutcomeReward,
    WisdomGemStore,
)
from src.backend.db import init_db, register_agent
from src.backend.economy.gatekeeper import require_feature, write_audit_log
from tools.contracts.contract_checker import ContractChecker

logger = logging.getLogger("AetherGateway")

try:
    import tachyon_core
except ImportError:  # pragma: no cover
    tachyon_core = None

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield

ROOT_DIR = Path(__file__).resolve().parents[1]
frontend_dist = ROOT_DIR / "frontend" / "dist"
GENESIS_WEBHOOK_SECRET = os.getenv("GENESIS_WEBHOOK_SECRET", "asi-genesis-dev-secret")

app = FastAPI(title="Aetherium API Gateway", version="1.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Include Routers
app.include_router(google_auth_router)
app.include_router(freeze_router)
app.include_router(resonance_drift_router)
app.include_router(integration_router)
app.include_router(billing_router)
app.include_router(credits_router)
app.include_router(marketplace_router)

bus = AetherBusExtreme()
immune_system = ContractChecker()
causal_lab = CausalPolicyLab()
policy_genome_engine = PolicyGenomeEngine()
resonance_orchestrator = ResonanceFeedbackLoopOrchestrator()
cogitator_engine = CogitatorXEngine(
    generator=LanguageMixedThoughtGenerator(),
    prm=ProcessRewardModel(),
    pangenes=PangenesAgent(WisdomGemStore()),
)

genesis_core = GenesisCoreService()
lifecycle = LifecycleManager()
genesis_bridge = WebSocketBridge(genesis_core.environment)

tachyon_engine = tachyon_core.TachyonEngine() if tachyon_core is not None else None
HAS_BRAIN = tachyon_engine is not None

# Mock Data for Legacy UI
AGENTS = [
    {"id": "alpha-1", "name": "Alpha-1", "role": "Chief Strategy Officer", "status": "active", "cpu": 75, "memory": 60},
    {"id": "beta-x", "name": "Beta-X", "role": "Chief Financial Officer", "status": "busy", "cpu": 92, "memory": 85},
]
DIRECTIVES = [
    {"id": "DIR-012", "title": "Market Pulse Q4", "status": "pending", "department": "Marketing", "time": "2h ago"},
]

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
    return JSONResponse(status_code=503, content={"message": "frontend build is not available"})

@app.get("/api/agents")
def get_agents():
    return AGENTS

@app.get("/api/directives")
def get_directives():
    return DIRECTIVES

@app.get("/api/v1/tachyon/metrics")
async def tachyon_metrics():
    return {
        "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
        "latency_us": 0.3,
        "throughput_rps": 12847,
        "source": "tachyon_core" if HAS_BRAIN else "simulated",
    }

@app.get("/api/events")
async def sse_events() -> StreamingResponse:
    async def event_generator():
        while True:
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            await asyncio.sleep(2)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

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
    return graph

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

    # Signed webhook payloads still need robust JSON validation to avoid
    # surfacing internal parsing errors as a generic 500.
    try:
        payload = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JSONResponse(status_code=400, content={"status": "invalid_json"})

    envelope = await genesis_core.ingest_intent(IntentIngressRequest(**payload))
    return {"status": "ok", "vector_id": envelope.intent_vector.vector_id}

@app.post("/api/genesis/mint")
async def mint_agent(seed: int = 1000, user_sub=require_feature("MINT_AGENT")):
    if not HAS_BRAIN:
        return {"error": "Brain missing"}
    deck = tachyon_engine.mint_starter_deck(seed)
    register_agent(user_sub.user_id)
    write_audit_log("MINT_AGENT", user_sub.user_id, {"seed": seed})
    return {"sentinel": json.loads(tachyon_engine.inspect_identity_json(deck[0]))}

@app.websocket("/ws/feed")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
