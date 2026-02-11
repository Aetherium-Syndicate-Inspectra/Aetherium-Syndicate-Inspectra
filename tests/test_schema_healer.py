import unittest

from tools.contracts.schema_healer import heal_payload


class SchemaHealerTests(unittest.TestCase):
    def test_heal_payload_remaps_legacy_fields(self):
        result = heal_payload(
            {"intent_name": "optimize", "intent_vector": [0.1], "intent_ts": 123.0},
            aliases={"intent_name": "intent", "intent_vector": "vector", "intent_ts": "timestamp"},
        )
        self.assertEqual(result.payload["intent"], "optimize")
        self.assertEqual(result.payload["vector"], [0.1])
        self.assertEqual(result.payload["timestamp"], 123.0)
        self.assertEqual(result.remapped_fields["intent_name"], "intent")

    def test_heal_payload_preserves_canonical_value(self):
        result = heal_payload(
            {"intent": "canonical", "intent_name": "legacy"}, aliases={"intent_name": "intent"}
        )
        self.assertEqual(result.payload["intent"], "canonical")
        self.assertNotIn("intent_name", result.payload)


if __name__ == "__main__":
    unittest.main()
