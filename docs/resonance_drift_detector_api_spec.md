# Resonance Drift Detector API Spec (Rapid User Feedback Loop)

Version: `v0.1-stub`
Status: `Implementable now / ready for real-user telemetry wiring`

## Scope

เอกสารนี้ครอบคลุมเฉพาะ API สำหรับ **Resonance Drift Detector ล่าสุด** ที่เน้นเชื่อมต่อ feedback loop จากผู้ใช้จริงให้เร็วที่สุด โดย **ไม่ขยาย Crisis Tournament API** สำหรับ replay set หรือ comparative cross-scenario analysis.

## Design Goals

1. **Low-latency ingestion:** รับ feedback ต่อ interaction ได้ทันที
2. **Tight loop:** ดึง action (intervention) ที่ระบบเสนอได้เร็ว
3. **Lightweight rollout:** ใช้ class stub ที่เปลี่ยน backend store ภายหลังได้โดยไม่เปลี่ยน contract
4. **Canonical simplicity:** เลี่ยง endpoint ซ้ำซ้อน, ใช้เส้นทางหลักชุดเดียว

## Base Path

`/api/resonance-drift`

---

## 1) Capture user feedback

### `POST /feedback`

รับ interaction + score เพื่ออัปเดต drift state และประเมิน intervention effectiveness แบบต่อเนื่อง

### Request JSON

```json
{
  "user_id": "u-001",
  "intent": "summarize_budget_impact",
  "response": "...",
  "feedback_score": 0.74
}
```

### Response JSON (200)

```json
{
  "status": "captured",
  "captured_at": "2026-01-01T00:00:00+00:00",
  "snapshot": {
    "user_id": "u-001",
    "resonance_score": 0.7812,
    "switch_count": 1,
    "switch_success_rate": 0.0,
    "current_preferences": {
      "format": "bullet",
      "tone": "operational",
      "evidence": "analogy"
    },
    "pending_actions": []
  }
}
```

---

## 2) Read profile + detector state

### `GET /profiles/{user_id}`

อ่าน state ล่าสุดของผู้ใช้

Response fields:
- `current_resonance_score`
- `drift_threshold`
- `active_cohort`
- `last_drift_ratio`
- `detection_window`
- `switch_count`
- `switch_success_rate`
- `preferences`

---

## 3) Tune profile config (runtime)

### `PATCH /profiles/{user_id}`

รองรับการปรับค่า runtime เพื่อ rollout กับผู้ใช้จริงโดยไม่ต้อง deploy ใหม่

Request (partial):

```json
{
  "preferred_format": "summary",
  "preferred_tone": "strategic",
  "preferred_evidence": "number",
  "drift_threshold": 0.2,
  "detection_window": 6
}
```

Response: `{ "status": "updated", "user_id": "u-001" }`

---

## 4) Pull pending interventions

### `POST /profiles/{user_id}/actions/pull?limit=5`

ดึง action ที่ detector เสนอเพื่อให้ frontend/agent workflow นำไปใช้ทันที

Query param `limit` ต้องอยู่ในช่วง `1..100`

Response includes `actions[]` with:
- `action_id`
- `triggered_at`
- `previous_format`, `previous_tone`
- `proposed_format`, `proposed_tone`, `proposed_evidence`

---

## 5) Submit intervention outcome

### `POST /profiles/{user_id}/actions/{action_id}/outcome`

บันทึกผลลัพธ์ของ action เพื่อปิด loop

Request:

```json
{
  "accepted": true,
  "followup_feedback_score": 0.82
}
```

---

## Class Stub Mapping

- API layer: `src/backend/resonance_drift_api.py`
- Orchestration stub: `ResonanceFeedbackLoopOrchestrator`
- Detector core: `src/backend/resonance_drift.py` (`DriftDetector`, `InterventionEvaluator`)

> หมายเหตุ: Orchestrator ใช้ in-memory queue เพื่อให้เริ่ม integration ได้เร็ว ก่อนย้าย state ไป Redis/DB ใน phase ถัดไป

## Non-Goals (explicit)

- ไม่เพิ่ม endpoint replay-set
- ไม่เพิ่ม endpoint comparative cross-scenario analytics
- ไม่เปลี่ยน contract ของ `src/backend/crisis_tournament.py`
