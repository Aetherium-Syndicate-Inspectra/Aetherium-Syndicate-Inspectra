
import aetherbus_extreme
def test_get_telemetry():
    bus = aetherbus_extreme.ExtremeAetherbus()
    telemetry = bus.get_telemetry()
    assert telemetry is not None
