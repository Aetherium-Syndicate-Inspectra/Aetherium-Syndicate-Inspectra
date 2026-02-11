#!/usr/bin/env python3
import ast
import hashlib
import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, List

ROOT_DIR = "."
IGNORE_DIRS = {".git", ".venv", "node_modules", "target", "__pycache__", ".lighthouseci"}
REGISTRY_FILE = "canonical_registry.json"
LINEAGE_LOG_FILE = "lineage_log.json"
LINEAGE_HASH_CHAIN_FILE = "lineage_log.jsonl"


def get_all_python_files(root_dir: str) -> List[str]:
    py_files: List[str] = []
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file.endswith(".py"):
                py_files.append(os.path.join(root, file))
    return py_files


def extract_functions(filepath: str) -> List[str]:
    functions: List[str] = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=filepath)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append(node.name)
    except Exception as exc:  # noqa: BLE001
        print(f"⚠️ Warning: Could not parse {filepath}: {exc}")
    return functions


def load_registry() -> dict[str, Any]:
    if not os.path.exists(REGISTRY_FILE):
        return {"approved_functions": set(), "canonical_functions": {}}

    with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    canonical_functions = data.get("canonical_functions", {})
    normalized_canonical = {
        name: os.path.normpath(str(meta.get("path", "")))
        for name, meta in canonical_functions.items()
        if isinstance(meta, dict) and meta.get("path")
    }
    return {
        "approved_functions": set(data.get("approved_functions", [])),
        "canonical_functions": normalized_canonical,
    }


def _load_existing_lineage() -> list[dict]:
    if not os.path.exists(LINEAGE_LOG_FILE):
        return []
    try:
        with open(LINEAGE_LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:  # noqa: BLE001
        return []


def _chain_hash(payload: dict, prev_hash: str) -> str:
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(f"{prev_hash}:{canonical}".encode("utf-8")).hexdigest()


def append_lineage_log(violations: list[dict]) -> None:
    event = {
        "event": "DUPLICATE_DETECTED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "violations": violations,
        "action": "BLOCK_DEPLOY",
    }

    existing = _load_existing_lineage()
    existing.append(event)

    with open(LINEAGE_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    export_lineage_hash_chain(event)


def export_lineage_hash_chain(event: dict) -> None:
    prev_hash = "GENESIS"
    sequence = 1

    if os.path.exists(LINEAGE_HASH_CHAIN_FILE):
        with open(LINEAGE_HASH_CHAIN_FILE, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        if lines:
            try:
                last = json.loads(lines[-1])
                prev_hash = last.get("hash", "GENESIS")
                sequence = int(last.get("sequence", 0)) + 1
            except Exception:  # noqa: BLE001
                prev_hash = "GENESIS"
                sequence = 1

    record = {
        "sequence": sequence,
        "prev_hash": prev_hash,
        "payload": event,
    }
    record["hash"] = _chain_hash(record["payload"], prev_hash)

    with open(LINEAGE_HASH_CHAIN_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def main() -> int:
    print("🔍 [GOVERNANCE] Starting Structural Audit: Rule of Single Best Function...")

    files = get_all_python_files(ROOT_DIR)
    func_map = defaultdict(list)

    for filepath in files:
        for func_name in extract_functions(filepath):
            func_map[func_name].append(filepath)

    registry = load_registry()
    approved_registry = registry.get("approved_functions", set())
    canonical_registry = registry.get("canonical_functions", {})
    violations = []

    print(f"📊 Scanned {len(files)} files, found {len(func_map)} unique functions.")

    for func_name, locations in func_map.items():
        if func_name.startswith("__") and func_name.endswith("__"):
            continue

        unique_locations = sorted(set(locations))
        if len(unique_locations) <= 1:
            continue

        canonical_path = canonical_registry.get(func_name)
        if canonical_path:
            canonical_normalized = os.path.normpath(canonical_path)
            normalized_locations = [os.path.normpath(path) for path in unique_locations]
            unexpected_locations = [path for path in normalized_locations if path != canonical_normalized]
            if unexpected_locations:
                violations.append(
                    {
                        "function": func_name,
                        "locations": unique_locations,
                        "canonical_path": canonical_path,
                    }
                )
            continue

        if func_name not in approved_registry:
            violations.append({"function": func_name, "locations": unique_locations})

    if violations:
        print("\n❌ [PĀRĀJIKA] CRITICAL VIOLATION: Duplicate Functions Detected!")
        print("Rule: A function should have one canonical definition unless registered.")
        print("-" * 60)
        for violation in violations:
            print(f"🔴 Function: '{violation['function']}'")
            print(f"   Found in: {violation['locations']}")
            print("-" * 60)

        append_lineage_log(violations)
        return 1

    print("✅ [PASSED] No structural violations found. System Integrity Preserved.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
