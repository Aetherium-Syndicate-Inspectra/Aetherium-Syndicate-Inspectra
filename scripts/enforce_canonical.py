#!/usr/bin/env python3
import ast
import json
import os
import sys
from collections import defaultdict
from typing import List, Set

ROOT_DIR = "."
IGNORE_DIRS = {".git", ".venv", "node_modules", "target", "__pycache__", ".lighthouseci"}
REGISTRY_FILE = "canonical_registry.json"
LINEAGE_LOG_FILE = "lineage_log.json"


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


def load_registry() -> Set[str]:
    if not os.path.exists(REGISTRY_FILE):
        return set()

    with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return set(data.get("approved_functions", []))


def append_lineage_log(violations: list[dict]) -> None:
    existing = []
    if os.path.exists(LINEAGE_LOG_FILE):
        try:
            with open(LINEAGE_LOG_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:  # noqa: BLE001
            existing = []

    existing.append(
        {
            "event": "DUPLICATE_DETECTED",
            "violations": violations,
            "action": "BLOCK_DEPLOY",
        }
    )

    with open(LINEAGE_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)


def main() -> int:
    print("🔍 [GOVERNANCE] Starting Structural Audit: Rule of Single Best Function...")

    files = get_all_python_files(ROOT_DIR)
    func_map = defaultdict(list)

    for filepath in files:
        for func_name in extract_functions(filepath):
            func_map[func_name].append(filepath)

    registry = load_registry()
    violations = []

    print(f"📊 Scanned {len(files)} files, found {len(func_map)} unique functions.")

    for func_name, locations in func_map.items():
        unique_locations = sorted(set(locations))
        if len(unique_locations) > 1 and func_name not in registry:
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
