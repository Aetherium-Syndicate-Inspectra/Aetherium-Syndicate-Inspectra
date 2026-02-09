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

## Performance Budget Baseline + Lighthouse CI

## CI Failure Fix Note (Job 62975897492)

สาเหตุหลักของงาน Lighthouse CI ล้มเหลวคือ workflow เดิมไม่ได้สตาร์ต static server ก่อน collect audit แต่ config ใช้ URL `http://127.0.0.1:8080/` อยู่แล้ว ทำให้เชื่อมต่อไม่สำเร็จ

ตอนนี้แก้แล้วโดย:
- ใส่ `startServerCommand: python3 -m http.server 8080`
- ใส่ `startServerReadyPattern` และ timeout
- บังคับ budget ใน `collect.settings.budgets` เพื่อให้ enforce ได้ใน CI โดยตรง

ผลคือ action `treosh/lighthouse-ci-action` สามารถเปิดหน้าเว็บได้เองและตรวจ budget/assertion ได้ครบ


ตั้งค่า baseline performance budget และ assertion policy ไว้แล้วที่:

- `.lighthouserc.json`
- `lighthouse-budget.json`

ตัวอย่างคำสั่งรัน Lighthouse CI:

```bash
npx @lhci/cli autorun --config=.lighthouserc.json
```

Baseline หลักที่บังคับ:

- Performance score ขั้นต่ำ: `0.90`
- LCP สูงสุด: `2500ms`
- TBT สูงสุด: `200ms`
- CLS สูงสุด: `0.10`

## Architecture Notes (เตรียมย้ายสู่ React + TypeScript)

โค้ดถูกแยก state ออกเป็น 2 ชั้น:

1. **Domain State (`AppState`)**
   - เก็บข้อมูลธุรกิจ: agents, directives, meetings, metrics
   - รองรับ hydrate/upsert/update เพื่อรองรับข้อมูลจาก API/realtime

2. **UI State (`UIState`)**
   - เก็บ active view, loading, connection status
   - ลด coupling ระหว่าง view lifecycle กับ data lifecycle

รูปแบบนี้ทำให้ migration ไป React + TypeScript ทำได้ง่ายขึ้นโดย map `AppState/UIState` เป็น context/store (เช่น Zustand/Redux Toolkit) แล้วค่อยย้าย view module ทีละส่วน

## Creative Extension Ideas (เพิ่มประสิทธิภาพ + ความท้าทาย)

1. **Scenario Engine (What-if Simulation)**
   - เพิ่มโหมดจำลองเหตุการณ์ เช่น Demand Surge, Compliance Shock, Budget Freeze
   - ให้ AI Council ประชุมและแสดงข้อเสนอเชิงกลยุทธ์อัตโนมัติ

2. **Trust & Explainability Layer**
   - ใส่ "เหตุผลประกอบการตัดสินใจ" (Decision Trace)
   - จัดคะแนนความน่าเชื่อถือของแต่ละ Agent ต่อ Directive

3. **Adaptive Workload Orchestrator**
   - ปรับการกระจายงานตามความสามารถ Agent แบบเรียลไทม์
   - แสดง heatmap ของคอขวดการทำงานในแต่ละแผนก

4. **Predictive Latency Guard**
   - ใช้ time-series model ทำนาย latency ของ AetherBus ล่วงหน้า
   - แจ้งเตือนก่อนระบบเข้าใกล้ SLA breach

5. **Executive Memory Graph**
   - สร้าง knowledge graph จากรายงานประชุม AI
   - ทำ semantic search เพื่อย้อนดูการตัดสินใจเชิงประวัติ

6. **Gamified Red-Team Drill**
   - เพิ่มโหมดโจมตีจำลอง (adversarial scenarios) สำหรับฝึกความพร้อมของ AI Council
   - บันทึกคะแนน resilience รายทีม เพื่อใช้เทียบ benchmark รายเดือน

## Recommended Data Sources (แนวทางต่อยอดด้วยข้อมูลจริง)

- **Operations + Queue Metrics**: latency, throughput, error rate, retry depth จาก AetherBus เพื่อเลี้ยง Predictive Latency Guard
- **Workforce/Agent Skill Matrix**: skill tags, utilization, avg completion time เพื่อเลี้ยง Adaptive Workload Orchestrator
- **Compliance + Risk Events**: audit logs, policy exceptions, regulatory deadlines เพื่อสร้าง Scenario Engine ที่สมจริง
- **Meeting Corpus**: transcript, resolution, dissent notes, outcome KPI เพื่อสร้าง Executive Memory Graph และ Explainability Layer
- **Incident + Red-Team Logs**: attack vector, mean time to detect/respond, blast radius เพื่อทำ resilience benchmark รายเดือน

## Suggested Implementation Sequence (แนะนำลำดับทำงาน)

1. เริ่มจาก **Trust & Explainability Layer** (ได้ผลไว, ยกระดับความโปร่งใสทันที)
2. ต่อด้วย **Predictive Latency Guard** (สร้าง early warning สำหรับ SLA)
3. เพิ่ม **Adaptive Workload Orchestrator** (ลด bottleneck ในการปฏิบัติการ)
4. สร้าง **Scenario Engine** + **Gamified Red-Team Drill** (ยกระดับการฝึกและความพร้อมเชิงกลยุทธ์)
5. ปิดท้ายด้วย **Executive Memory Graph** (ทำให้ระบบเรียนรู้ข้ามเวลาและค้นหาบริบทได้ลึกขึ้น)

## คำแนะนำการต่อยอดเชิงสร้างสรรค์ (เพิ่มเติมจาก baseline)

- เพิ่ม **Directive Risk Score** จากข้อมูล deadline slippage + dissent rate เพื่อ prioritization อัตโนมัติ
- นำ **cross-team dependency graph** มารวมกับ bottleneck heatmap เพื่อตรวจหาคอขวดแบบลูกโซ่
- เก็บ **counterfactual outcomes** จาก Scenario Engine เพื่อ train policy optimizer ว่าแนวทางไหนลด SLA breach ได้จริง
- วัด **Human Override Frequency** เพื่อประเมินความน่าเชื่อถือ AI Council รายเดือน

---

> แนวคิดหลัก: "Resonance Pathway of Intelligence" — จากแดชบอร์ดสาธิต สู่ control plane สำหรับองค์กร AI เต็มรูปแบบ


## แนวทางต่อยอดด้วยข้อมูลจริง (เพิ่มประสิทธิภาพ + ความท้าทาย)

- เพิ่ม **Realtime Queue Depth Forecast** จากข้อมูล queue depth รายนาที + retry depth เพื่อคาดการณ์ congestion 15–30 นาทีล่วงหน้า
- สร้าง **Directive Outcome Dataset** (directive_id, owner_agent, approval_latency, outcome_kpi_delta) เพื่อ train ranking model สำหรับลำดับความสำคัญ directive
- ทำ **Policy Drift Monitor** โดยเทียบ policy exception trend กับ regulatory deadline เพื่อแจ้งเตือนก่อนเกิด compliance shock
- เก็บ **Human-in-the-loop intervention logs** (override reason + confidence delta) เพื่อปรับ trust score ของแต่ละ agent ให้แม่นขึ้น

