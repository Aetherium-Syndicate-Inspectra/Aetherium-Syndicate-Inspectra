import sys
import json
import time

try:
    import tachyon_core
except ImportError:
    print("❌ Critical Error: ไม่พบโมดูล 'tachyon_core'")
    print("คำแนะนำ: ตรวจสอบว่าได้รัน 'cargo build --release' และ copy ไฟล์ .so/.pyd มาที่นี่แล้วหรือยัง")
    sys.exit(1)


def main():
    print(f"{'='*60}")
    print("📇 ASI V4.2.2: IDENTITY CRYSTALLIZATION SEQUENCE")
    print(f"{'='*60}\n")

    try:
        engine = tachyon_core.TachyonEngine()
        print("✅ Tachyon Engine Initialized.")
    except Exception as e:
        print(f"❌ Engine Failed: {e}")
        return

    company_seed_id = 990001
    print(f"🔨 Forging Starter Deck for Company ID: {company_seed_id}...")

    start_time = time.perf_counter()
    sentinel_bytes, catalyst_bytes, harmonizer_bytes = engine.mint_starter_deck(company_seed_id)
    end_time = time.perf_counter()

    print(f"⚡ Forge Time: {(end_time - start_time) * 1000:.4f} ms")
    print(f"📦 Zero-Copy Payload: {len(sentinel_bytes)} bytes per card")

    print("\n🔍 IDENTITY MARKETPLACE VIEW (JSON Output):")

    cards_data = [
        ("🛡️ The Sentinel", sentinel_bytes),
        ("🚀 The Catalyst", catalyst_bytes),
        ("❤️ The Harmonizer", harmonizer_bytes),
    ]

    for name, data in cards_data:
        json_str = engine.inspect_identity_json(bytes(data))
        card_info = json.loads(json_str)

        print(f"\n   {name} [Gen {card_info['generation']}]")
        print(f"   ID: {card_info['id']}")
        print(f"   TYPE: {card_info['archetype']}")

        traits = card_info['traits']
        print("   📊 BLOCH STATS:")
        print(f"      • Logic/Emotion Bias : {traits['logic_bias']*100:.1f}%")
        print(f"      • Risk Tolerance     : {traits['risk_tolerance']*100:.1f}%")
        print(f"      • Empathy Resonance  : {traits['empathy']*100:.1f}%")

        if card_info['archetype'] == "Sentinel" and traits['risk_tolerance'] > 0.2:
            print("   ❌ ERROR: Sentinel anomaly detected! Too risky.")
        elif card_info['archetype'] == "Catalyst" and traits['risk_tolerance'] < 0.8:
            print("   ❌ ERROR: Catalyst anomaly detected! Too passive.")
        else:
            print("   ✅ Integrity Verified")

    print(f"\n{'='*60}")
    print("🏆 STARTER DECK READY FOR DEPLOYMENT")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
