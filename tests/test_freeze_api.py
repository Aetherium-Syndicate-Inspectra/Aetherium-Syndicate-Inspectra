import base64
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.backend.freeze_api import FreezeStore, router


PNG_1PX = base64.b64encode(
    bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489"
        "0000000A49444154789C6360000002000154A24F5D0000000049454E44AE426082"
    )
).decode("ascii")


def test_freeze_save_list_delete_flow(tmp_path: Path):
    store = FreezeStore(storage_dir=tmp_path / "frozen", index_path=tmp_path / "frozen" / "index.json")

    app = FastAPI()
    from src.backend import freeze_api

    freeze_api.store = store
    app.include_router(router)
    client = TestClient(app)

    save_resp = client.post(
        "/api/freeze/save",
        json={
            "structure": {"positions": [[0, 0, 0]], "colors": [[1, 0, 0]], "intensities": [1.0]},
            "file_name": "test-light",
            "file_format": "png",
            "image_data_base64": PNG_1PX,
            "quality": {"confidence": 0.91, "freshness": 0.97, "completeness": 1.0},
        },
    )
    assert save_resp.status_code == 200
    payload = save_resp.json()["freeze"]
    assert payload["event_type"] == "freeze.saved"
    assert payload["canonical_key"].startswith("v1:")

    list_resp = client.get("/api/freeze/list")
    assert list_resp.status_code == 200
    assert len(list_resp.json()["items"]) == 1

    freeze_id = payload["id"]
    delete_resp = client.delete(f"/api/freeze/{freeze_id}")
    assert delete_resp.status_code == 200

    list_after = client.get("/api/freeze/list")
    assert list_after.json()["items"] == []


def test_freeze_save_rejects_invalid_base64(tmp_path: Path):
    store = FreezeStore(storage_dir=tmp_path / "frozen", index_path=tmp_path / "frozen" / "index.json")

    app = FastAPI()
    from src.backend import freeze_api

    freeze_api.store = store
    app.include_router(router)
    client = TestClient(app)

    response = client.post(
        "/api/freeze/save",
        json={
            "structure": {"positions": []},
            "file_name": "bad",
            "file_format": "png",
            "image_data_base64": "not-base64!!",
        },
    )

    assert response.status_code == 400
