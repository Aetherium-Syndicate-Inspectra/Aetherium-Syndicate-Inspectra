import asyncio
import json
import logging

import uvicorn
from fastapi import Body, FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from api_gateway.aetherbus_extreme import AetherBusExtreme
from src.backend.causal_policy_lab import CausalPolicyLab
from src.backend.creator_studio import CreatorStudioService
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
creator_studio = CreatorStudioService()
genesis_core = GenesisCoreService()
genesis_lifecycle = LifecycleManager()
genesis_bridge = WebSocketBridge(genesis_core.environment)
GENESIS_WEBHOOK_SECRET = "genesis-webhook-dev-secret"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(SoulBreakError)
async def soulbreak_exception_handler(_request: Request, exc: SoulBreakError):
    status_code, payload = problem_details_from_error(exc, status_code=400)
    return JSONResponse(status_code=status_code, content=payload)


@app.on_event("startup")
async def startup_genesis_lifecycle() -> None:
    async def heartbeat_loop() -> None:
        while True:
            await genesis_core.environment.publish(
                "system.vitals",
                {"cpu_load": 0.32, "memory_usage": 0.41, "status": "genesis_online"},
            )
            await asyncio.sleep(2)

    await genesis_lifecycle.start(heartbeat_loop())


@app.on_event("shutdown")
async def shutdown_genesis_lifecycle() -> None:
    await genesis_lifecycle.shutdown()



@app.get("/")
async def root():
    return {"status": "ONLINE", "brain_connected": HAS_BRAIN}


@app.get("/api/events/recent")
async def recent_events(limit: int = 50):
    return {"events": bus.recent_events(limit=limit)}


@app.post("/api/creator/chat")
async def creator_chat(payload: dict = Body(...)):
    message = (payload.get("message") or "").strip()
    if not message:
        return {"response": "กรุณาป้อนข้อความก่อน", "code": creator_studio.session.code}

    result = creator_studio.chat(message)
    event = immune_system.canonicalize_event(
        {
            "intent": "creator_chat",
            "explanation": result["response"],
            "code_size": len(result["code"]),
        },
        event_type="CODE_GEN_UPDATE",
        source="creator_studio",
    )
    await bus.emit("CODE_GEN_UPDATE", event)
    return result




@app.post("/api/creator/pr-compose")
async def creator_pr_compose(payload: dict = Body(...)):
    previous_code = payload.get("previous_code", "")
    current_code = payload.get("code", "")
    if not current_code:
        return {"message": "missing fields: code"}

    suggestion = creator_studio.compose_pr_metadata(
        previous_code=previous_code,
        current_code=current_code,
        user_intent=payload.get("intent", ""),
        scope_hint=payload.get("scope_hint", "creator-studio"),
    )

    branch_hint = payload.get("branch", "feature/creator-studio-update")
    policy = creator_studio.validate_pr_policy(
        branch=branch_hint,
        commit_message=suggestion["commit_message"],
    )

    return {"suggestion": suggestion, "policy": policy}

@app.post("/api/creator/github-pr")
async def creator_github_pr(payload: dict = Body(...)):
    required = ["repo", "branch", "code"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return {"message": f"missing fields: {', '.join(missing)}", "pr_url": ""}

    compose = creator_studio.compose_pr_metadata(
        previous_code=payload.get("previous_code", ""),
        current_code=payload["code"],
        user_intent=payload.get("intent", ""),
        scope_hint=payload.get("scope_hint", "creator-studio"),
    )
    commit_message = (payload.get("message") or compose["commit_message"]).strip()
    policy = creator_studio.validate_pr_policy(
        branch=payload["branch"],
        commit_message=commit_message,
    )
    if not policy["ok"]:
        return {"message": "policy gate rejected request", "pr_url": "", "policy": policy}

    result = creator_studio.create_github_pr(
        repo=payload["repo"],
        branch=payload["branch"],
        commit_message=commit_message,
        code=payload["code"],
        filename=payload.get("filename", "app.js"),
        base_branch=payload.get("base_branch"),
        pr_body=payload.get("pr_body", compose["pr_body"]),
        enforce_policy=True,
    )
    await bus.emit(
        "SYSTEM_ALERT",
        {
            "message": "Creator Studio PR action completed",
            "detail": result,
        },
    )
    return {**result, "policy": policy, "compose": compose}


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
    logger.info("🚀 Aetherium Manifest: Awakening Sequence Initiated...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
