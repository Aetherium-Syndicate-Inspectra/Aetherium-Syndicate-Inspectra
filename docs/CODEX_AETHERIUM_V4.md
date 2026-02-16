# ASI CODEX: ENGINEERING STANDARDS & ARCHITECTURE (v4.3.1)

**Status:** ACTIVE  
**Enforcement:** STRICT (Patimokkha Level)  
**Scope:** Python (Backend/Reasoning), Rust (Tachyon Core), JavaScript (Vanilla Frontend)

---

## 1) ปรัชญาการพัฒนา (Development Philosophy)

Aetherium Syndicate Inspectra (ASI) ถูกออกแบบเป็น “Digital Organism” ที่ต้องรักษาทั้งความเร็ว, ความถูกต้อง, และความสามารถในการกำกับดูแล (governance) ไปพร้อมกัน

### 1.1 Spec-Driven Development (SDD)
- ห้ามเริ่มจากการเขียนโค้ดล้วน ๆ จาก prompt
- ลำดับบังคับ: **Specification → Plan → Implementation → Validation**
- ต้องอัปเดตเอกสารใน `docs/` หรือ `README.md` ทุกครั้งเมื่อโครงสร้าง/สัญญา (contract) เปลี่ยน

### 1.2 Single Best Function (SBF)
- ตรรกะหนึ่งชนิดต้องมีเพียง **canonical path** เดียว
- ถ้าพบความสามารถซ้ำ ต้องรวมให้เหลือจุดเดียว และให้ทุกจุดเรียกผ่าน canonical source
- CI gate บังคับผ่าน `scripts/check-duplicate-functions.mjs`

### 1.3 Governance-First
- payload เชิงระบบต้องตรวจด้วยชุดเครื่องมือใน `tools/contracts/`
- การตั้งชื่อ intent/shape ของข้อมูลต้องสอดคล้องกับ `canonical_registry.json`
- แนวคิดหลัก: **Heal, Don’t Fail** สำหรับข้อมูล legacy ที่พอเยียวยาได้

### 1.4 Zero-Copy Mentality (Tachyon)
- Tachyon Core (`tachyon-core/`) ต้องรักษาแนวคิด low-latency และ memory discipline
- โค้ด Rust production หลีกเลี่ยง panic path ที่ควบคุมไม่ได้

---

## 2) โครงสร้างระบบล่าสุด (Reality-Aligned Directory Blueprint)

> อัปเดตฉบับนี้สะท้อนการเปลี่ยนแปลงสำคัญ:  
> **(A)** รวมศูนย์ logic ฝั่ง Python ไว้ที่ `src/backend/`  
> **(B)** ย้าย frontend หลักสู่ **root-level static assets** (`assets/` + root HTML)

```text
aetherium-syndicate-inspectra/
├── .github/workflows/                  # CI/CD + Quality Gates
│   ├── deploy.yml
│   ├── duplicate-function-gate.yml
│   ├── lighthouse.yml
│   ├── static.yml
│   └── summary.yml
│
├── tachyon-core/                       # [RUST] Layer 0: high-performance core
│   ├── src/lib.rs
│   └── Cargo.toml
│
├── api_gateway/                        # [PYTHON] API ingress layer (FastAPI bridge)
│   ├── main.py
│   ├── aetherbus_extreme.py
│   └── __init__.py
│
├── src/backend/                        # [PYTHON] Canonical business logic center (Layer 2)
│   ├── cogitator_x.py
│   ├── creator_studio.py
│   ├── resonance_drift.py
│   ├── resonance_drift_api.py
│   ├── crisis_tournament.py
│   ├── genesis_core.py
│   ├── paged_kv_cache.py
│   ├── db.py
│   ├── integration_layer.py
│   ├── orchestrator.py
│   ├── freeze_api.py
│   ├── freeze_light_events.py
│   ├── policy_genome.py
│   ├── causal_policy_lab.py
│   ├── resonance_feedback_loop.py
│   ├── api_server.py
│   ├── auth/
│   └── economy/
│
├── assets/                             # [FRONTEND] Root-level static assets
│   ├── css/
│   └── js/
│       ├── app.js
│       ├── creator-studio/
│       ├── role-studio/
│       ├── services/
│       ├── state/
│       ├── utils/
│       └── views/
│
├── tools/contracts/                    # Governance tooling
│   ├── contract_checker.py
│   ├── schema_healer.py
│   ├── canonical.py
│   └── adaptive_budgeting.py
│
├── scripts/                            # Engineering checks & automation
│   ├── check-duplicate-functions.mjs
│   ├── semantic_duplicate_detector.py
│   └── enforce_canonical.py
│
├── tests/                              # Regression, API, integrity, and frontend state tests
├── docs/                               # Architecture/spec references
├── canonical_registry.json             # Canonical map for SBF governance
├── index.html                          # Main dashboard entry
├── creator-studio.html                 # Creator Studio entry
├── enterprise_windows.html             # Enterprise simulation entry
└── src/frontend/                       # Legacy pages retained for compatibility/migration
```

### 2.1 Canonical placement policy (สำคัญ)
- **Business Logic ใหม่ทุกชิ้น:** ต้องวางใน `src/backend/` ก่อนเสมอ
- **Frontend runtime ใหม่:** ต้องวางใน `assets/js/` และเชื่อมผ่าน root-level HTML
- `src/frontend/` ถือเป็นโซน **legacy compatibility** ไม่ใช่พื้นที่หลักสำหรับการเพิ่ม logic ใหม่

---

## 3) มาตรฐานการเขียนโค้ด (Coding Standards)

### 3.1 Python (Backend & Gateway)
- บังคับใช้ type hints กับ public functions และ service boundaries
- import ฟังก์ชันหลักจาก canonical module เท่านั้น (ห้าม clone logic)
- SQLite access ต้องเปิด `PRAGMA foreign_keys = ON` ผ่าน canonical DB path (`src/backend/db.py`)
- endpoint/route ควรเป็น orchestration layer; domain logic ให้อยู่ service module ใน `src/backend/`

**ตัวอย่าง**
```python
# ✅ Canonical import
from src.backend.cogitator_x import CogitatorXEngine

# ❌ Duplicate local implementation
class MyOwnCogitator:
    ...
```

### 3.2 JavaScript (Frontend)
- ใช้ Vanilla JS (ES modules) เป็นค่าเริ่มต้น
- single-writer/single-entry policy:
  - LLM interaction ใน Role Studio ผ่าน `assets/js/role-studio/core/llm.js`
  - Freeze Light recording ผ่าน `assets/js/role-studio/services/freezeLight.js`
- state management ให้ใช้โมดูลใน `assets/js/state/` หรือ state module เฉพาะโดเมน (เช่น `role-studio/core/state.js`) แทนการฝัง state ใน DOM

### 3.3 Rust (Tachyon Core)
- หลีกเลี่ยง panic ใน production path
- `unsafe` ต้องมี safety rationale ชัดเจน
- รักษาแนวทาง zero-copy / low-allocation เมื่อออกแบบ data movement

---

## 4) Workflow Protocols

### 4.1 The Creation Ritual (ฟีเจอร์ใหม่)
1. **Spec** — เขียนหรืออัปเดตเอกสารใน `docs/` หรือ `README.md`
2. **Canonical Check** — ตรวจ `canonical_registry.json` ว่ามีหน้าที่นี้อยู่แล้วหรือไม่
3. **Implement** — วางโค้ดตาม canonical structure (`src/backend/`, `assets/js/`, `api_gateway/`, `tachyon-core/`)
4. **Audit** — รัน `node scripts/check-duplicate-functions.mjs`
5. **Test** — รัน test ที่เกี่ยวข้องใน `tests/`
6. **PR** — เปิด PR พร้อมคำอธิบาย architectural impact และ governance impact

### 4.2 Data Governance Protocol
- เพิ่ม/แก้โครงสร้างข้อมูล ต้องอัปเดต contract tooling ใน `tools/contracts/` และ registry ที่เกี่ยวข้อง
- ใช้แนวทาง “heal, don’t fail” สำหรับ payload legacy ที่แปลงได้อย่างปลอดภัย
- ห้าม bypass การตรวจ canonical/contract ใน production flows

---

## 5) Definition of Done (DoD)

งานจะถือว่าเสร็จเมื่อครบทุกข้อ:
- โค้ดใหม่อยู่ใน canonical path ที่ถูกต้องตามโครงสร้างล่าสุด
- ไม่เพิ่ม duplicate logic ที่ขัดหลัก SBF
- ผ่าน duplicate-function gate และ test ที่เกี่ยวข้อง
- เอกสารสถาปัตยกรรม/สัญญาข้อมูลได้รับการอัปเดต
- reviewer สามารถ trace ได้ว่า logic ใหม่ผูกกับ module กลางใดอย่างชัดเจน

---

## 6) Architectural North Star (v4.3.1)

- **Backend Consolidation:** `src/backend/` คือศูนย์กลางความจริงของ business logic
- **Frontend Simplification:** ใช้ root-level `assets/` + root HTML เป็น runtime หลักเพื่อลด fragmentation
- **Governance-by-default:** contracts + canonical registry + duplicate gates คือกลไกบังคับไม่ใช่ทางเลือก
- **Performance posture:** Tachyon core คงหลัก low-latency และ predictable runtime behavior

---

**Document signed by:** Hollis (AI Architect)  
**Revision:** v4.3.1 (Reality-aligned restructure edition)  
**Timestamp:** 2025-Epoch-Current
