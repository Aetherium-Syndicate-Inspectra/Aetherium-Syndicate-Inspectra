# Aetherium-Syndicate-Inspectra

Aetherium-Syndicate-Inspectra คือแดชบอร์ดต้นแบบสำหรับการกำกับดูแล "บริษัทอัจฉริยะที่ขับเคลื่อนด้วย AI ทั้งองค์กร" ตั้งแต่ระดับแผนกจนถึง CEO AI Council

## Overview

โปรเจ็กต์นี้สาธิตหน้า **Aetherium Genesis Executive Dashboard** สำหรับ:
- ติดตามสถานะ CEO AI Council แบบกึ่งเรียลไทม์
- สร้าง Directive ใหม่ผ่านฟอร์มบนหน้า Dashboard
- ดูกระดาน Active Directives (Kanban snapshot)
- ตรวจสอบการประชุม AI ล่าสุด และสถานะ AetherBus
- เชื่อมข้อมูลจาก API จริง + realtime transport (WebSocket/SSE) พร้อม fallback mock

## Current Repository Structure

```text
Aetherium-Syndicate-Inspectra/
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       ├── services/
│       │   ├── api-client.js
│       │   ├── mock-aetherbus.js
│       │   └── realtime-channel.js
│       ├── state/
│       │   ├── app-state.js
│       │   └── ui-state.js
│       ├── utils/
│       └── views/
├── tests/
├── .lighthouserc.json
├── lighthouse-budget.json
├── backup/dashboard.js
├── index.html
└── README.md
```

## Quick Start

```bash
git clone <repo-url>
cd Aetherium-Syndicate-Inspectra
python3 -m http.server 8080
# open http://127.0.0.1:8080
```

## Backend API Contract (สำหรับโหมด real data)

ระบบ Frontend จะ bootstrap ด้วย endpoint เหล่านี้:

- `GET /api/agents`
- `GET /api/directives`
- `GET /api/meetings`
- `POST /api/directives`

Realtime status updates รองรับ 2 transport:

1. `ws://<host>/ws/status` (preferred)
2. `GET /api/events` (SSE fallback)

ตัวอย่าง event payload ที่รองรับ:

```json
{
  "type": "metrics.updated",
  "data": {
    "latency": 1.1,
    "throughput": 12000,
    "load": 58
  }
}
```

รองรับ `agent.updated`, `directive.created`, `directive.updated`, `meeting.appended`, `metrics.updated`

## Tests

```bash
node --test tests/*.test.mjs
```

## Newly Implemented Creative Extension (อัปเดตล่าสุด)

ตอนนี้ระบบได้ต่อยอดตามแนวทางที่ร้องขอเรียบร้อย โดยเพิ่มความสามารถเชิงวิเคราะห์สำคัญดังนี้:

1. **Directive Risk Score Auto-Prioritization**
   - คำนวณคะแนนความเสี่ยงจาก `deadline slippage` + `dissent rate`
   - จัดลำดับ Directive ที่ควรถูกเร่งดำเนินการอัตโนมัติในหน้า Analytics

2. **Cross-team Dependency Chain Bottleneck Heatmap**
   - แสดง dependency ระหว่างทีมเป็นสายโซ่ (`from -> to`)
   - คำนวณ chain pressure เพื่อค้นหาคอขวดแบบเชื่อมโยงหลายทีม

3. **Scenario Counterfactual Outcomes for Policy Optimization**
   - เก็บผลลัพธ์แบบ counterfactual ของ strategy ต่าง ๆ
   - แสดงเปอร์เซ็นต์การลด SLA breach ที่วัดผลได้จริง

4. **Human Override Frequency (Monthly AI Council Audit)**
   - รวมสถิติ override รายเดือน
   - ใช้เป็นตัวชี้วัด trust และ governance ระหว่างมนุษย์กับ AI

5. **Unified Feature Store (Metrics + Decisions + Incidents)**
   - รวมข้อมูลเชิงเหตุการณ์ไว้ที่เดียว
   - ใช้กติกา canonical key เพื่อลดข้อมูลซ้ำ: `(entity_id, event_type, event_time, source)`
   - เลือก record ที่ดีที่สุดจาก `ingested_at ล่าสุด` + `quality_score สูงกว่า`

## Data Hygiene & De-dup Strategy (แนวปฏิบัติเมื่อข้อมูลซ้ำ)

เพื่อให้ระบบสะอาดและตีความสถานะปัจจุบันได้ถูกต้อง แนะนำมาตรฐานต่อเนื่องดังนี้:

- กำหนดทุก event ให้มี canonical keys เดียวกันทั้งระบบ
- สร้าง quality scoring rubric เดียว (เช่น confidence, freshness, completeness)
- หากพบฟังก์ชันซ้ำบทบาท ให้ยุบเหลือ implementation เดียว (single best function)
- เพิ่ม regression tests สำหรับ logic dedup ทุกครั้งที่มี schema ใหม่

## Suggested Next Creative Challenges (คำแนะนำต่อยอด)

1. **Causal Policy Lab**
   - เพิ่ม causal inference เพื่ออธิบายว่า policy ไหน “ทำให้” SLA ดีขึ้นจริง ไม่ใช่แค่สัมพันธ์กัน

2. **Constraint-aware Optimizer**
   - ให้ optimizer คำนึงถึงงบประมาณ, compliance และ capacity พร้อมกัน (multi-objective)

3. **Narrative Incident Replay**
   - ทำ time-travel replay เหตุการณ์พร้อม decision trace สำหรับ postmortem เชิงผู้บริหาร

4. **Self-healing Data Contracts**
   - ตรวจ schema drift อัตโนมัติและสร้าง mapping rule เพื่อให้ pipeline ไม่พังเมื่อ source เปลี่ยน
