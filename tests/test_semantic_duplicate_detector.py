import tempfile
import textwrap
import unittest
from pathlib import Path

import importlib.util
import sys

SPEC = importlib.util.spec_from_file_location("semantic_duplicate_detector", "scripts/semantic_duplicate_detector.py")
semantic_duplicate_detector = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = semantic_duplicate_detector
SPEC.loader.exec_module(semantic_duplicate_detector)
scan_semantic_duplicates = semantic_duplicate_detector.scan_semantic_duplicates


class SemanticDuplicateDetectorTests(unittest.TestCase):
    def test_detects_ast_level_semantic_duplicates(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / "a.py").write_text(
                textwrap.dedent(
                    """
                    def alpha(x):
                        y = x + 1
                        return y * 2
                    """
                ),
                encoding="utf-8",
            )
            (p / "b.py").write_text(
                textwrap.dedent(
                    """
                    def beta(v):
                        k = v + 5
                        return k * 3
                    """
                ),
                encoding="utf-8",
            )

            groups = scan_semantic_duplicates(str(p))
            self.assertEqual(len(groups), 1)
            names = {item["name"] for item in groups[0]["functions"]}
            self.assertEqual(names, {"alpha", "beta"})


if __name__ == "__main__":
    unittest.main()
