import asyncio
import unittest

from api_gateway.aetherbus_extreme import AetherBusExtreme
from tools.contracts.canonical import build_canonical_key


class AetherBusExtremeTests(unittest.IsolatedAsyncioTestCase):
    async def test_subscribe_emit_and_unsubscribe(self):
        bus = AetherBusExtreme(history_limit=5)
        received = []

        async def handler(event):
            received.append(event)

        await bus.subscribe("TOPIC", handler)
        await bus.emit("TOPIC", {"x": 1})
        self.assertEqual(len(received), 1)

        event = received[0]
        self.assertEqual(
            event["canonical_key"],
            build_canonical_key(
                event_type=event["event_type"],
                event_time=event["event_time"],
                source=event["source"],
            ),
        )

        await bus.unsubscribe("TOPIC", handler)
        await bus.emit("TOPIC", {"x": 2})
        self.assertEqual(len(received), 1)

    async def test_recent_events_respects_limit(self):
        bus = AetherBusExtreme(history_limit=3)
        for idx in range(5):
            await bus.emit("LOAD", {"idx": idx})

        self.assertEqual(len(bus.recent_events(limit=10)), 3)
        self.assertEqual(len(bus.recent_events(limit=2)), 2)
        self.assertEqual(bus.recent_events(limit=0), [])


if __name__ == "__main__":
    unittest.main()
