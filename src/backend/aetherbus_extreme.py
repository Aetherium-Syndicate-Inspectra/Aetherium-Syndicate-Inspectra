"""Backend-facing alias for AetherBus Extreme transport."""

from __future__ import annotations

from api_gateway.aetherbus_extreme import AetherBusExtreme


class AetherBus(AetherBusExtreme):
    """Compatibility wrapper used by backend integration services."""

