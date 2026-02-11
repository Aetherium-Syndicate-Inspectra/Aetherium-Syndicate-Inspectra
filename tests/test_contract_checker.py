import time
import unittest

from tools.contracts.contract_checker import ContractChecker


class ContractCheckerTests(unittest.TestCase):
    def setUp(self):
        self.checker = ContractChecker()

    def test_validate_ipw_v1_success(self):
        payload = {"intent": "optimize", "vector": [0.1, 0.2], "timestamp": time.time()}
        ok, result = self.checker.validate(payload, "ipw_v1")
        self.assertTrue(ok)
        self.assertIn("quality", result)

    def test_validate_missing_required_field(self):
        payload = {"intent": "optimize", "timestamp": time.time()}
        ok, result = self.checker.validate(payload, "ipw_v1")
        self.assertFalse(ok)
        self.assertIn("Missing field", result["error"])

    def test_deduplicate_events_prefers_better_quality(self):
        now = time.time()
        base_payload = {"intent": "optimize", "vector": [1.0], "timestamp": now}
        event = self.checker.canonicalize_event(base_payload, event_type="USER_INPUT", source="dashboard")
        low_quality = {**event, "quality": {"confidence": 0.2, "freshness": 0.2, "completeness": 0.2}}
        high_quality = {**event, "quality": {"confidence": 1.0, "freshness": 1.0, "completeness": 1.0}}

        deduped = self.checker.deduplicate_events([low_quality, high_quality])
        self.assertEqual(len(deduped), 1)
        self.assertEqual(deduped[0]["quality"]["confidence"], 1.0)


    def test_deduplicate_events_prefers_newer_schema_when_quality_ties(self):
        now = time.time()
        payload = {"entity_id": "BID-777", "timestamp": now}
        v1 = self.checker.canonicalize_event(payload, event_type="bid_countered", source="ws", schema_version="v1")
        v2 = self.checker.canonicalize_event(payload, event_type="bid_countered", source="ws", schema_version="v2")

        v1["canonical_key"] = "stable-key"
        v2["canonical_key"] = "stable-key"
        v1["quality"] = {"confidence": 0.9, "freshness": 0.9, "completeness": 1.0}
        v2["quality"] = {"confidence": 0.9, "freshness": 0.9, "completeness": 1.0}

        deduped = self.checker.deduplicate_events([v1, v2])
        self.assertEqual(len(deduped), 1)
        self.assertEqual(deduped[0]["schema_version"], "v2")


    def test_deduplicate_events_freeze_schema_uses_single_best_record(self):
        now = time.time()
        payload = {"entity_id": "freeze-1", "timestamp": now}
        event = self.checker.canonicalize_event(payload, event_type="freeze.saved", source="api/freeze/save")

        weaker = {**event, "quality": {"confidence": 0.7, "freshness": 0.8, "completeness": 0.9}}
        stronger = {**event, "quality": {"confidence": 0.95, "freshness": 1.0, "completeness": 1.0}}

        deduped = self.checker.deduplicate_events([weaker, stronger])
        self.assertEqual(len(deduped), 1)
        self.assertEqual(deduped[0]["quality"]["confidence"], 0.95)



if __name__ == "__main__":
    unittest.main()
