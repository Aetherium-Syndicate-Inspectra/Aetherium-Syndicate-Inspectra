import pytest

pytest.importorskip("fastapi")

from fastapi.testclient import TestClient

from api_gateway import main
from src.backend.core.aetherbus_extreme import AetherBusExtreme
from tools.contracts.contract_checker import ContractChecker


def test_gateway_bootstrap_initializes_core_dependencies():
    assert main.app.title == "Aetherium Gateway"
    assert isinstance(main.bus, AetherBusExtreme)
    assert isinstance(main.immune_system, ContractChecker)


def test_dashboard_endpoint_gracefully_handles_missing_build():
    response = TestClient(main.app).get("/dashboard")
    assert response.status_code in {200, 503}
