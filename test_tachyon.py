import random
import struct
import time

from tests.conftest import _load_tachyon_core


def create_mock_payload_v2(user_id, vector_data, ghost=1, seed=12345):
    """
    สร้าง Payload จำลองที่ตรงกับ IntentVectorWireV2 สำหรับทดสอบ
    Layout: SyncID(8) + EntityID(8) + Vector(1024*4) + Seed(8) + Ghost(1) + Pad(7)
    """
    vec = vector_data[:1024] + [0.0] * (1024 - len(vector_data))
    vector_bytes = struct.pack(f"<{len(vec)}f", *vec)
    sync_id = 1711792800000
    entity_id = hash(user_id) & 0xFFFFFFFFFFFFFFFF
    payload = (
        struct.pack("<QQ", sync_id, entity_id)
        + vector_bytes
        + struct.pack("<Q", seed)
        + struct.pack("<B", ghost)
        + b"\x00" * 7
    )
    return payload


def parse_wire_payload(payload):
    sync_id = struct.unpack_from("<Q", payload, 0)[0]
    entity_id = struct.unpack_from("<Q", payload, 8)[0]
    entropy_seed = struct.unpack_from("<Q", payload, 4112)[0]
    ghost_flag = struct.unpack_from("<B", payload, 4120)[0]
    return sync_id, entity_id, entropy_seed, ghost_flag


def run_tests():
    tachyon_core = _load_tachyon_core()
    if tachyon_core is None:
        print("❌ Critical Error: ไม่พบโมดูล 'tachyon_core'")
        print("คำแนะนำ: ตรวจสอบว่าได้รัน 'cargo build --release' และ copy ไฟล์ .so/.pyd มาที่นี่แล้วหรือยัง")
        return

    print(f"{'=' * 60}")
    print("🚀 TACHYON CORE: UNIFIED TEST SUITE")
    print(f"{'=' * 60}\n")

    try:
        engine = tachyon_core.TachyonEngine()
        print("✅ [INIT] Engine Instantiated successfully.")
    except Exception as e:
        print(f"❌ [INIT] Failed to instantiate engine: {e}")
        return

    user_id = "agent_smith_v9"
    mock_vector = [random.random() for _ in range(1024)]
    supports_speculate = hasattr(engine, "speculate_futures")

    print("\n🔍 [TEST 1] Identity Annihilation (Basic)")
    start = time.perf_counter()
    payload = bytes(engine.process_intent(user_id, mock_vector))
    dt = (time.perf_counter() - start) * 1_000_000
    sync_id, entity_id, entropy_seed, ghost_flag = parse_wire_payload(payload)
    print(f"   ⚡ Latency: {dt:.2f} µs")
    print(f"   📦 Payload Size: {len(payload)} bytes")
    print(f"   🧾 sync_id={sync_id}, entity_id={entity_id}, seed={entropy_seed}, ghost={ghost_flag}")

    print("\n🔮 [TEST 2] Ghost Worker Speculation (Normal Condition)")
    payload_normal = create_mock_payload_v2(user_id, mock_vector, ghost=1)
    if supports_speculate:
        result = engine.speculate_futures(payload_normal)
        print(f"   📝 Action Code: {result.action_code}")
    else:
        print("   ⚠️ SKIPPED: engine.speculate_futures() ยังไม่ถูก expose ใน tachyon_core รุ่นนี้")

    print("\n🛑 [TEST 3] Nirodha Protocol (High Turbulence > 0.9)")
    if supports_speculate:
        payload_panic = create_mock_payload_v2(user_id, mock_vector, ghost=1)
        result_panic = engine.speculate_futures(payload_panic)
        print(f"   📝 Action Code: {result_panic.action_code}")
    else:
        print("   ⚠️ SKIPPED: ต้องใช้ speculate_futures() เพื่อทดสอบ Nirodha")

    print("\n⚙️  [TEST 4] Real Execution Mode (Ghost Flag = 0)")
    if supports_speculate:
        payload_real = create_mock_payload_v2(user_id, mock_vector, ghost=0)
        result_real = engine.speculate_futures(payload_real)
        print(f"   📝 Action Code: {result_real.action_code}")
    else:
        print("   ⚠️ SKIPPED: ต้องใช้ speculate_futures() เพื่อแยก ghost path")

    print("\n🔥 [TEST 5] Stress Test (100,000 iterations)")
    start_stress = time.perf_counter()
    for _ in range(100_000):
        _ = engine.process_intent(user_id, mock_vector)
    total_time = time.perf_counter() - start_stress
    throughput = 100_000 / total_time
    print(f"   ⏱️  Total Time: {total_time:.4f} sec")
    print(f"   🚀 Throughput: {throughput:,.2f} ops/sec")


if __name__ == "__main__":
    run_tests()
