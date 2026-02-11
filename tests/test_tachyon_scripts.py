import importlib.util
import sys
from pathlib import Path


def _load_module(module_name, file_name):
    file_path = Path(__file__).resolve().parents[1] / file_name
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_test_identity_import_safe_without_tachyon_core(monkeypatch):
    original_import = __import__

    def fake_import(name, *args, **kwargs):
        if name == "tachyon_core":
            raise ImportError("mock missing tachyon_core")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr("builtins.__import__", fake_import)
    module = _load_module("test_identity", "test_identity.py")
    assert module._load_tachyon_core() is None


def test_test_tachyon_import_safe_without_tachyon_core(monkeypatch):
    original_import = __import__

    def fake_import(name, *args, **kwargs):
        if name == "tachyon_core":
            raise ImportError("mock missing tachyon_core")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr("builtins.__import__", fake_import)
    module = _load_module("test_tachyon", "test_tachyon.py")
    assert module._load_tachyon_core() is None


def test_create_mock_payload_v2_layout():
    module = _load_module("test_tachyon_payload", "test_tachyon.py")

    payload = module.create_mock_payload_v2("agent", [0.25] * 1024, ghost=1, seed=99)
    assert len(payload) == 4128

    sync_id, entity_id, entropy_seed, ghost_flag = module.parse_wire_payload(payload)
    assert sync_id == 1711792800000
    assert isinstance(entity_id, int)
    assert entropy_seed == 99
    assert ghost_flag == 1
