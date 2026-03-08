# Tachyon Next-Step Strategy: Data Durability vs Agent Intelligence

เอกสารนี้สรุปข้อเสนอ 5 หัวข้อสำหรับระบบ Tachyon ที่รันระดับ 15M+ msg/s และให้คำแนะนำเชิงลำดับการลงทุน (Execution Priority) ว่าควรโฟกัสอะไรเป็นก้าวถัดไป

## Executive Decision (ข้อสรุป)

**คำตอบสั้น:** โฟกัส **Data Durability ก่อน** แบบมีกรอบเวลา แล้วค่อยเร่ง **Agent Intelligence** ต่อทันที

**เหตุผลหลัก:** เมื่อ throughput สูงมาก ต้นทุนที่เสี่ยงที่สุดคือข้อมูลสูญหาย/เขียนไม่ทัน/กู้คืนไม่ได้ หากฐานข้อมูลเชิงเหตุการณ์ (immutable history) ไม่แน่นพอ ความฉลาดของ agent จะขยายความผิดพลาดได้เร็วกว่าความสามารถในการตรวจสอบ

## ประเมิน 5 แนวคิดที่เสนอ

### 1) Nano-Segmentation (SIMD Bitmask Routing)
- **ผลกระทบ:** สูงมากต่อ hot-path routing และ fan-out จำนวนมาก
- **ความเสี่ยง:** ต้องออกแบบ topic-to-bitspace ให้หลีกเลี่ยง collision และ versioning
- **คำแนะนำ:** ทำเป็น incremental path (dual-route: string + bitmask) พร้อม telemetry เทียบผล

### 2) Predictable Jitter Control (Aether-Governor)
- **ผลกระทบ:** สูงต่อ P99/P999 latency stability
- **ความเสี่ยง:** migration policy ผิดจังหวะอาจเกิด cache miss และ jitter แทนที่จะลด jitter
- **คำแนะนำ:** เริ่มจาก detect+alert ก่อน แล้วเปิด soft-migration แบบ staged rollout

### 3) Hyper-Compression for Akashic Records (Temporal Dedup)
- **ผลกระทบ:** สูงมากต่อ disk I/O และ storage TCO
- **ความเสี่ยง:** reconstruct path ต้อง deterministic 100% และตรวจสอบย้อนกลับได้
- **คำแนะนำ:** ใช้กับ event class ที่ idempotent/heartbeat ก่อน และบันทึก lineage hash ของ reconstruction ทุกครั้ง

### 4) Zero-Latency Feedback Loop (RDMA Shared Latent Space)
- **ผลกระทบ:** สูงต่อ coordination latency ระหว่าง agent
- **ความเสี่ยง:** consistency model, contention และ safety boundary ซับซ้อนมาก
- **คำแนะนำ:** เริ่มจาก use-case แคบ (single producer domain) ก่อนขยาย multi-domain

### 5) AI Physiology: Sensory Adaptation
- **ผลกระทบ:** สูงต่อ resilience ภายใต้ burst traffic
- **ความเสี่ยง:** ถ้า fast-path ลด validation มากเกินไปจะกระทบ governance integrity
- **คำแนะนำ:** ผูกกับ policy budget ที่ชัดเจน (strict/balanced/fast) และ freeze audit trail ทุกโหมด

## ลำดับความสำคัญที่แนะนำ (90 วัน)

### Phase 1 (สัปดาห์ 1-4): Durability Baseline Hardening
1. เปิดใช้ Temporal Dedup เฉพาะ heartbeat/state-stable events
2. เพิ่ม reconstruct verifier + lineage hash cross-check
3. ทำ SLO ใหม่: write amplification, recovery time, replay fidelity

### Phase 2 (สัปดาห์ 5-8): Throughput + Jitter Stability
1. เปิด Nano-Segmentation ในเส้นทางที่ subscriber หนาแน่นที่สุด
2. เปิด Aether-Governor โหมด observe -> assist -> auto
3. วัด KPI: P99/P999 latency, thermal throttling incidence, migration success rate

### Phase 3 (สัปดาห์ 9-12): Intelligence Expansion on Stable Substrate
1. เปิด RDMA shared latent space สำหรับ agent cohort ที่ควบคุมได้
2. เปิด Sensory Adaptation พร้อม governance budget guardrail
3. วัด KPI: decision cycle time, policy-violation rate, causal trace completeness

## Target Allocation

- **60% Data Durability + Replay Integrity**
- **30% Performance Stability (routing + jitter)**
- **10% Agent Intelligence pilot**

เมื่อ durability metrics ผ่านเกณฑ์ 2 sprint ติดต่อกัน ค่อยสลับเป็น **40/30/30** เพื่อเร่ง intelligence อย่างปลอดภัย

## Definition of Done (ก่อน scale intelligence เต็มรูปแบบ)

ต้องผ่านทุกข้อ:
1. Replay fidelity ≥ 99.99%
2. Recovery drill ผ่านตาม RTO/RPO ที่กำหนด
3. P99 latency คงที่ภายใต้ sustained peak
4. Fast-path ไม่ทำให้ policy violation เกิน risk budget

## สรุปสำหรับการตัดสินใจ

หากต้องเลือกเพียงหนึ่งแกนในตอนนี้ ให้เลือก **Data Durability** เป็นลำดับแรก เพราะเป็น "ตัวคูณความน่าเชื่อถือ" ของทุกความสามารถถัดไป จากนั้นใช้ความเร็ว 15M+ msg/s ที่มีอยู่เป็นฐานเพื่อเร่ง **Agent Intelligence** ในเฟสถัดไปแบบควบคุมความเสี่ยงได้
