"""FastAPI bridge between Tachyon Rust core and Aetherium frontend."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

try:
    import tachyon_core
except ImportError as exc:  # pragma: no cover - runtime integration check
    raise RuntimeError(
        "tachyon_core module not found. Build/install the Python extension before running API server."
    ) from exc

app = FastAPI(title="Aetherium Tachyon API", version="1.0.0")
engine = tachyon_core.TachyonEngine()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENTS: list[dict[str, Any]] = [
    {
        "id": "alpha-1",
        "name": "Alpha-1",
        "role": "Chief Strategy Officer",
        "status": "active",
        "cpu": 75,
        "memory": 60,
        "task": "Processing M&A Data",
    },
    {
        "id": "beta-x",
        "name": "Beta-X",
        "role": "Chief Financial Officer",
        "status": "busy",
        "cpu": 92,
        "memory": 85,
        "task": "Auditing Q2",
    },
    {
        "id": "gamma-7",
        "name": "Gamma-7",
        "role": "Chief Operations Officer",
        "status": "active",
        "cpu": 45,
        "memory": 50,
        "task": "Rebalancing Server Load",
    },
]

DIRECTIVES: list[dict[str, Any]] = [
    {
        "id": "DIR-012",
        "title": "Market Pulse Q4",
        "status": "pending",
        "department": "Marketing",
        "time": "2h ago",
        "author": "A",
    },
    {
        "id": "DIR-019",
        "title": "Budget Forecasting",
        "status": "meeting",
        "department": "Finance",
        "time": "4h ago",
        "author": "B",
    },
    {
        "id": "DIR-007",
        "title": "Hiring Strategy",
        "status": "completed",
        "department": "HR",
        "time": "1d ago",
        "author": "HR",
    },
]

MEETINGS: list[dict[str, Any]] = [
    {"id": "m1", "title": "Strategic Market Capture", "duration": "28m", "participants": ["M", "F", "L"]},
    {"id": "m2", "title": "Compute Cost Rebalancing", "duration": "17m", "participants": ["L", "S"]},
    {"id": "m3", "title": "Legal Compliance Delta", "duration": "24m", "participants": ["O", "H", "R"]},
]


class DirectiveCreate(BaseModel):
    title: str
    department: str = "General"
    status: str = "pending"
    author: str = "U"


@app.get("/api/agents")
def get_agents() -> list[dict[str, Any]]:
    return AGENTS


@app.get("/api/directives")
def get_directives() -> list[dict[str, Any]]:
    return DIRECTIVES


@app.get("/api/meetings")
def get_meetings() -> list[dict[str, Any]]:
    return MEETINGS


@app.post("/api/directives")
def create_directive(payload: DirectiveCreate) -> dict[str, Any]:
    next_num = max(
        (int(d["id"].split("-")[1]) for d in DIRECTIVES if d.get("id", "").startswith("DIR-")),
        default=0,
    ) + 1
    directive = {
        "id": f"DIR-{next_num:03d}",
        "title": payload.title,
        "department": payload.department,
        "status": payload.status,
        "time": "Just now",
        "author": payload.author,
    }
    DIRECTIVES.insert(0, directive)
    return directive


@app.get("/api/mint-starter-deck")
def mint_starter_deck(seed: int = 1000) -> dict[str, Any]:
    try:
        sentinel, catalyst, harmonizer = engine.mint_starter_deck(seed)
    except Exception as exc:  # pragma: no cover - rust runtime integration
        raise HTTPException(status_code=500, detail=f"Tachyon mint failed: {exc}") from exc

    return {
        "sentinel": json.loads(engine.inspect_identity_json(sentinel)),
        "catalyst": json.loads(engine.inspect_identity_json(catalyst)),
        "harmonizer": json.loads(engine.inspect_identity_json(harmonizer)),
    }


@app.websocket("/ws/aetherbus")
async def websocket_aetherbus(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(
                {
                    "type": "HEARTBEAT",
                    "status": "TACHYON_ACTIVE",
                    "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
                }
            )
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        return


@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(
                {
                    "type": "metrics.updated",
                    "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
                    "data": {"latency": 0.7, "throughput": 10900, "load": 45},
                }
            )
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return


@app.get("/api/events")
async def sse_events() -> StreamingResponse:
    async def event_generator():
        while True:
            payload = {
                "type": "metrics.updated",
                "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
                "data": {"latency": 0.72, "throughput": 10780, "load": 44},
            }
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
