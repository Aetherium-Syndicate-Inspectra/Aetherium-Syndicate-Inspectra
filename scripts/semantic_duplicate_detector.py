#!/usr/bin/env python3
"""AST-level semantic duplicate detector for Python functions.

Detects behaviorally-similar functions by normalizing identifiers/constants from AST.
"""

from __future__ import annotations

import ast
import copy
import hashlib
import json
import os
from collections import defaultdict
from dataclasses import dataclass

ROOT_DIR = "."
IGNORE_DIRS = {".git", ".venv", "node_modules", "target", "__pycache__", ".lighthouseci"}


@dataclass
class FunctionFingerprint:
    name: str
    path: str
    line: int
    signature: str


class SemanticNormalizer(ast.NodeTransformer):

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.AST:  # noqa: N802
        node.name = "_fn"
        self.generic_visit(node)
        return node

    def visit_Name(self, node: ast.Name) -> ast.AST:  # noqa: N802
        return ast.copy_location(ast.Name(id="_id", ctx=node.ctx), node)

    def visit_arg(self, node: ast.arg) -> ast.AST:  # noqa: N802
        return ast.copy_location(ast.arg(arg="_arg", annotation=None), node)

    def visit_Constant(self, node: ast.Constant) -> ast.AST:  # noqa: N802
        placeholder = type(node.value).__name__
        return ast.copy_location(ast.Constant(value=f"CONST<{placeholder}>"), node)


def iter_python_files(root_dir: str):
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file.endswith(".py"):
                yield os.path.join(root, file)


def fingerprint_function(node: ast.FunctionDef, path: str) -> FunctionFingerprint:
    function_copy = copy.deepcopy(node)
    cloned = ast.fix_missing_locations(SemanticNormalizer().visit(ast.Module(body=[function_copy], type_ignores=[])))
    dumped = ast.dump(cloned, annotate_fields=False, include_attributes=False)
    digest = hashlib.sha256(dumped.encode("utf-8")).hexdigest()
    return FunctionFingerprint(name=node.name, path=path, line=node.lineno, signature=digest)


def scan_semantic_duplicates(root_dir: str = ROOT_DIR) -> list[dict]:
    signatures: dict[str, list[FunctionFingerprint]] = defaultdict(list)

    for filepath in iter_python_files(root_dir):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read(), filename=filepath)
        except SyntaxError:
            continue

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                fp = fingerprint_function(node, filepath)
                signatures[fp.signature].append(fp)

    duplicates = []
    for signature, members in signatures.items():
        unique_locations = {(m.path, m.name, m.line) for m in members}
        if len(unique_locations) < 2:
            continue
        duplicates.append(
            {
                "signature": signature,
                "functions": [
                    {"path": m.path, "name": m.name, "line": m.line}
                    for m in sorted(members, key=lambda x: (x.path, x.line, x.name))
                ],
            }
        )

    return duplicates


def main() -> int:
    duplicates = scan_semantic_duplicates()

    if duplicates:
        print("⚠️ Semantic duplicate candidates detected (AST-level):")
        for group in duplicates:
            print(f"- signature={group['signature'][:12]}...")
            for item in group["functions"]:
                print(f"  • {item['path']}:{item['line']} ({item['name']})")
        with open("semantic_duplicate_report.json", "w", encoding="utf-8") as f:
            json.dump(duplicates, f, indent=2, ensure_ascii=False)
        print("Report written to semantic_duplicate_report.json")
        return 1

    print("✅ No semantic duplicate candidates found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
