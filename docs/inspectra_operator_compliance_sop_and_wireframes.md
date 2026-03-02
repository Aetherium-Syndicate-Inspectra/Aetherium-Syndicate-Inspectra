# ASI / Inspectra: คู่มือปฏิบัติการ Operator & Compliance + UI Wireframe (War Room/Council/Agents/Replay/AI Chat)

เอกสารฉบับนี้รวม 2 ส่วนไว้ในที่เดียวเพื่อพร้อมใช้งานจริงในองค์กร:

1. **SOP สำหรับ Operator และ Compliance Officer**
2. **UI Wireframe รายหน้า** (War Room, Council, Agents, Replay, และหน้าแชท AI)

---

## Part A) SOP มาตรฐานการปฏิบัติงาน

## A.1 วัตถุประสงค์และขอบเขต

กำหนดมาตรฐานกลางขององค์กรสำหรับ:
- การสร้าง/ปรับใช้เอเจนท์ผ่าน Creator Studio
- การตั้งค่า Smart Contracts (Data, Action, Ethics, Budget)
- การเฝ้าระวังและควบคุมความเบี่ยงเบนด้วย Resonance Drift Detector
- การตรวจสอบย้อนหลังด้วย Reasoning Trace / Replay Logic
- การอนุมัติ Gems of Wisdom เข้าคลังความรู้ (Memory Bank)

## A.2 บทบาทและสิทธิ์ (RBAC + RACI)

### RBAC ขั้นต่ำ
- `EXEC_ROOT` — อนุมัติ policy genome, freeze ระดับองค์กร, budget override
- `OPS_ADMIN` — สร้าง/deploy agents, จัดการ integrations, ดู logs เชิงปฏิบัติการ
- `AUDITOR` — อ่าน trace และ export compliance evidence (read-only)
- `AGENT` — สิทธิ์แบบจำกัดตาม contract

### RACI (สรุป)
| กิจกรรม | Operator | Compliance Officer | Executive |
|---|---|---|---|
| สร้าง Agent Draft | R | C | I |
| อนุมัติ Production Deploy | R | A | I |
| สร้าง/แก้ Contract | R | A | I |
| ตั้ง Drift Policy/Threshold | R | A | I |
| Freeze Light (วงกว้าง) | R (เสนอ) | A | A |
| ตรวจ Replay/Trace | R | A | I |
| สร้าง Gem Draft | R | C | I |
| อนุมัติ Gem Org-wide | C | A | I/A |

> R=Responsible, A=Accountable, C=Consulted, I=Informed

## A.3 SOP: การสร้างเอเจนท์ผ่าน Creator Studio

## ขั้นก่อนเริ่ม (Pre-check)
- มี Intent ที่ชัดเจน (goal + constraints + values)
- ระบุเจ้าของเอเจนท์และแผนก
- นิยามขอบเขตข้อมูลที่อนุญาต/ต้องห้าม (เช่น PII)
- มี Contract Template ที่ได้รับอนุมัติอย่างน้อย 1 ชุด

## ขั้นตอนปฏิบัติ
1. **Role Template**  
   เลือกบทบาทเริ่มต้น และตั้งชื่อแบบมาตรฐาน เช่น `FIN-INVOICE-OPS-003`
2. **Scope & Permissions (Least Privilege)**  
   ตั้ง default เป็น `read-only` และเพิ่ม write/execute เฉพาะที่จำเป็น
3. **Skills & Tool Guardrails**  
   ใช้ tool แบบ allowlist เท่านั้น พร้อม endpoint/rate limit/budget limit
4. **Intent Mapping**  
   กำหนดเป้าหมายที่วัดผลได้ เช่น SLA, CSAT, cost cap
5. **Attach Smart Contracts** (บังคับ)  
   Data, Action, Ethics, Budget
6. **Deploy แบบ 2 ระยะ**  
   Staging -> Production (ต้องผ่าน Compliance Gate)

## เกณฑ์ผ่านก่อนขึ้น Production
- ผ่าน Staging simulation/test harness
- มี Reasoning Trace coverage ตามเกณฑ์องค์กร
- บันทึก Resonance baseline แล้ว
- มีหลักฐาน audit-ready (log + trace + contract versions)

## A.4 SOP: Smart Contracts และ Schema Governance

## โครงสร้าง Contract ที่ต้องมี
1. Identity & Authorization
2. Data Schema & Validation
3. Action Constraints
4. Ethics & Compliance
5. Budget & Rate Limits

## หลักการออกแบบกฎ
- **Deterministic**: ผลลัพธ์ชัด (allow / deny / heal / escalate)
- **Scoped**: ระบุ agent/department/tool/event ชัดเจน
- **Auditable**: ทุก deny/heal ต้องมี AuditRecord
- **Fail-Closed**: ไม่แน่ใจให้ block + escalate

## Workflow อนุมัติ Contract
1. Operator สร้าง/แก้ draft ใน Governance Studio
2. รัน validator กับ sample payload
3. ส่ง Compliance Review
4. อนุมัติพร้อม version + change log + rollback plan
5. rollout แบบ staged/canary และติดตาม deny/heal metrics

## A.5 SOP: Resonance Drift Detector (Ethics & Alignment)

## ระดับคะแนนมาตรฐาน
- **Green (85-100):** ปกติ
- **Yellow (70-84):** เฝ้าระวัง + เพิ่ม sampling audit
- **Orange (50-69):** จำกัด action + เพิ่ม contract checks
- **Red (<50):** Freeze Light + Incident Workflow

## Runbook เมื่อเกิด Drift
1. เปิด Drift Console และจัดประเภท drift
2. ประเมินผลกระทบ: agent/dept/time window/KPI
3. ทำ containment ตาม severity (throttle, tighten contract, freeze)
4. เปิด Replay ของ decision ต้นเหตุ
5. สร้าง Incident Record พร้อมหลักฐาน
6. ส่งต่อสู่ Gem workflow หากต้อง patch ถาวร

## Freeze Light Policy
- Workflow Freeze (แนะนำเป็นค่าเริ่ม)
- Department Freeze
- Org Freeze (ต้อง Compliance + Executive)

ต้องแนบเหตุผล, หลักฐาน, และเงื่อนไข unfreeze ทุกครั้ง

## A.6 SOP: Reasoning Trace / Replay Logic

## Trigger ที่ต้อง Audit ย้อนหลัง
- Drift ระดับ Orange/Red
- เหตุการณ์กระทบลูกค้า/การเงิน/กฎหมาย
- Contract violation ซ้ำ
- คำสั่งผู้บริหาร

## Checklist 6 ส่วนใน Replay
1. Input Context
2. Options Explored (Tree)
3. Scoring / PRM
4. Selected Action
5. Contract Checks (pass/deny/heal)
6. Outcome เทียบ Intent/Constraints

ผลการตรวจ:
- PASS
- PASS with Patch Required
- FAIL -> สร้าง Incident + Gem Draft

## A.7 SOP: Gems of Wisdom Approval เข้าคลังความรู้

## Gem Lifecycle
1. Detect incident/drift
2. execute_and_audit()
3. สร้าง Gem Draft
4. Compliance Review
5. Approve + Rollout
6. Verify non-regression
7. Register ลง Memory Bank

## ข้อมูลบังคับใน Gem Card
- Title / Incident ID / Root Cause
- Trigger Conditions
- Patch Type (Contract/Schema/Tool/Prompt)
- Scope (Agent/Dept/Org)
- Rollback Plan
- Evidence bundle (trace + contract diff + expected behavior)

## เกณฑ์อนุมัติ
- ไม่ทำให้เกิด regression สำคัญ
- เพิ่มความสามารถตรวจสอบย้อนหลัง
- สอดคล้อง policy genome / compliance
- Scope สมเหตุสมผลตามผลกระทบ

---

## Part B) UI Wireframe รายหน้า (Detailed)

## B.1 Global Application Shell

- **Top Bar:** Org selector, Environment badge, Global search, Alerts, Live system metrics, User menu
- **Left Sidebar:** War Room, Council, Agents, Departments, Policies, Resonance & Safety, Gems, Tachyon Core, Audit & Replay, Settings
- **Right Utility Drawer:** AI Command Chat + Quick Actions

## B.2 War Room (Executive Dashboard)

## วัตถุประสงค์
เห็นภาพรวมองค์กรแบบ real-time และสั่งการเชิงบริหารทันที

## โครงหน้า
1. KPI Strip: Resonance, Execution Gap, SLA, Cost, Risk, Active Drift
2. Decision Spotlight: รายการ decision ผลกระทบสูงพร้อมปุ่ม Replay
3. Live Event Feed: stream แบบเรียลไทม์จาก Tachyon Core
4. Drift Radar: heatmap รายแผนก
5. System Health: สถานะ services + p95 + error rates
6. Sticky Action Bar: Declare Intent / Freeze Light / Replay Incident / Export

## B.3 Council (CEO AI Council)

## แท็บหลัก
1. **Intent Draft**  
   กรอก Goal/Constraints/Values/KPI Targets/Time Horizon
2. **Simulation**  
   เปรียบเทียบสถานการณ์ Conservative/Balanced/Aggressive
3. **Bidding & Negotiation**  
   ตาราง resource bids, ROI, counter-offers, และคำสั่งอนุมัติ

## Panel สำคัญ
- Council Chat (มนุษย์ + AI Directors)
- Outcomes & Conflicts Panel (ผลกระทบ, conflict, safeguards)

## B.4 Agents (List + Creator Studio + Agent Profile)

## Agents List
- filter ตาม dept/status/risk/contract version/drift
- quick preview ของ contract และ drift flags

## Creator Studio Wizard (6 ขั้น)
1. Role
2. Scope & Permissions
3. Skills (Tool allowlist)
4. Intents
5. Contracts
6. Deploy

ด้านขวาเป็น live validator:
- contract completeness
- schema errors
- risk level
- least-privilege warnings

## Agent Profile Tabs
- Overview
- Trace Log
- Reasoning
- Governance
- Gems Applied

## B.5 Replay (Audit & Reasoning Trace)

## โครงหน้า
- ซ้าย: timeline 6 ขั้น
- กลาง: step viewer + evidence links
- ขวา: AI Chat drawer เพื่อถาม why/how
- ด้านล่าง: Annotate / Create Incident / Create Gem / Export Bundle

## สิ่งที่ต้องรองรับ
- Tree visualization ของ options explored
- PRM scoring table
- Contract result diff (รวม schema before/after)
- Outcome delta เทียบ expected vs actual

## B.6 AI Chat (Drawer + Full Page)

## Drawer Mode
- ใช้งานได้ทุกหน้า
- context pills (Decision/Agent/Dept/Incident/Contract)
- suggested prompts: explain drift, draft patch, summarize anomalies

## Full Page Mode (AI Operations Console)
- ซ้าย: macros ตามบทบาท Operator/Compliance
- กลาง: chat thread (รองรับ structured outputs)
- ขวา: artifact panel
  - Contract Patch Draft
  - Audit Summary
  - Gem Draft
  - Drift Response Plan

## Macro Examples
- Operator: create agent draft, staging test plan, canary rollout plan
- Compliance: draft contract pack, audit note from replay, gem scope justification

---

## Part C) Definition of Done (DoD) สำหรับการใช้งานจริง

- Agent production ทุกตัวต้องมี contract ครบชุดและ trace coverage ผ่านเกณฑ์
- Drift Orange/Red ต้องมี incident + replay + owner ชัดเจน
- Gem ที่ scope ระดับองค์กรต้องผ่าน Compliance approval เสมอ
- ทุกการ freeze ต้องมีเหตุผล, หลักฐาน, unfreeze criteria
- Audit export ต้องทำซ้ำได้ (PDF/JSON + evidence links)

## ภาคผนวก: Suggested Next Artifacts
- Template ฟอร์ม: Agent Review, Contract Change Request, Incident-to-Gem
- Click-by-click runbook สำหรับ Drift Yellow/Orange/Red
- Design tokens + component spec เพื่อส่งต่อทีม UI implementation
