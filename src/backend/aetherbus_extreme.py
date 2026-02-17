"""Backend-facing aliases for AetherBus Extreme transport."""

from src.backend.core.aetherbus_extreme import AetherBusExtreme


class AetherBus(AetherBusExtreme):
    """Compatibility wrapper used by backend integration services."""


__all__ = ["AetherBus", "AetherBusExtreme"]
