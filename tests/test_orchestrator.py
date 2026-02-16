import asyncio

from src.backend.orchestrator import UserLifecycleContext, monitor_user_lifecycle


class DummyCache:
    def __init__(self, context: UserLifecycleContext):
        self.context = context

    async def get_context(self, _user_id: str) -> UserLifecycleContext:
        return self.context


class DummyLineClient:
    def __init__(self):
        self.messages = []

    async def push_message(self, user_id: str, message: str) -> None:
        self.messages.append((user_id, message))


def test_monitor_user_lifecycle_triggers_gold_message() -> None:
    cache = DummyCache(UserLifecycleContext(learning_topics={"gold_invest"}, balance=12000))
    client = DummyLineClient()

    result = asyncio.run(monitor_user_lifecycle("line-1", kv_cache=cache, line_client=client))

    assert result["status"] == "triggered"
    assert len(client.messages) == 1


def test_monitor_user_lifecycle_skips_when_not_eligible() -> None:
    cache = DummyCache(UserLifecycleContext(learning_topics={"stocks"}, balance=5000))
    client = DummyLineClient()

    result = asyncio.run(monitor_user_lifecycle("line-1", kv_cache=cache, line_client=client))

    assert result["status"] == "no_action"
    assert client.messages == []
