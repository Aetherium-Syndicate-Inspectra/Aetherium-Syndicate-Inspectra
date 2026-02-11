import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import importlib.util
import sys

SPEC = importlib.util.spec_from_file_location("enforce_canonical", "scripts/enforce_canonical.py")
enforce_canonical = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = enforce_canonical
SPEC.loader.exec_module(enforce_canonical)


class LineageHashChainTests(unittest.TestCase):
    def test_export_lineage_hash_chain_builds_tamper_evident_sequence(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            json_file = base / "lineage_log.json"
            jsonl_file = base / "lineage_log.jsonl"

            with patch.object(enforce_canonical, "LINEAGE_LOG_FILE", str(json_file)), patch.object(
                enforce_canonical, "LINEAGE_HASH_CHAIN_FILE", str(jsonl_file)
            ):
                enforce_canonical.append_lineage_log([{"function": "f1", "locations": ["a.py"]}])
                enforce_canonical.append_lineage_log([{"function": "f2", "locations": ["b.py"]}])

            lines = [json.loads(line) for line in jsonl_file.read_text(encoding="utf-8").splitlines() if line.strip()]
            self.assertEqual(len(lines), 2)
            self.assertEqual(lines[0]["sequence"], 1)
            self.assertEqual(lines[1]["sequence"], 2)
            self.assertEqual(lines[1]["prev_hash"], lines[0]["hash"])

            expected = hashlib.sha256(
                f"{lines[1]['prev_hash']}:{json.dumps(lines[1]['payload'], sort_keys=True, ensure_ascii=False)}".encode("utf-8")
            ).hexdigest()
            self.assertEqual(lines[1]["hash"], expected)


if __name__ == "__main__":
    unittest.main()
