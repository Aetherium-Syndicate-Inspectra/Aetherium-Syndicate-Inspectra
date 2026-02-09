import random
import struct
import sys
import time

try:
    import tachyon_core
except ImportError:
    print("❌ ไม่พบโมดูล 'tachyon_core'")
    print("ให้รัน: cd tachyon-core && cargo build --release")
    sys.exit(1)


def main() -> None:
    engine = tachyon_core.TachyonEngine()
    user_id = "agent_smith_v9"
    vector = [random.random() for _ in range(1024)]

    start = time.perf_counter()
    payload = engine.process_intent(user_id, vector)
    elapsed_us = (time.perf_counter() - start) * 1_000_000

    expected_size = 8 + 8 + (1024 * 4) + 8 + 1 + 7
    print(f"⚡ latency: {elapsed_us:.2f} µs")
    print(f"📦 payload size: {len(payload)} bytes")

    if len(payload) != expected_size:
        print(f"❌ expected {expected_size}, got {len(payload)}")
        sys.exit(1)

    sync_id = struct.unpack_from("<Q", payload, 0)[0]
    entity_id = struct.unpack_from("<Q", payload, 8)[0]
    print(f"🔍 sync_id={sync_id}, entity_id={entity_id}")


if __name__ == "__main__":
    main()
