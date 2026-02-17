# AetherEvent / AetherBus Extreme: High-Performance Interconnect Specification

- **Version:** 4.3.2 (Tachyon Integrated)
- **Classification:** TACHYON CLEARANCE

## 1) Three-Tier Performance Model

สถาปัตยกรรม AetherBus Extreme แบ่งออกเป็น 3 ระดับชั้นเพื่อลดคอขวดและแยกหน้าที่อย่างชัดเจน

### Tier 1 — The Silicon Fabric (Physical & Kernel Layer)

- **Technology:** RDMA over RoCE v2 / InfiniBand
- **Mechanism:** Kernel Bypass + Zero-Copy Networking
- **Function:** ส่งข้อมูลจาก NIC เข้า Application Memory โดยไม่ผ่าน CPU context switch ของ OS
- **Latency Target:** `< 5 µs`

### Tier 2 — The Tachyon Bridge (FFI & Memory Layer)

- **Technology:** Rust + PyO3 + Shared Memory (Apache Arrow / mmap)
- **Mechanism:** Zero-Copy Pointer Passing
- **Function:** Python ส่งเฉพาะ pointer/handle ขณะที่ Rust จัดการ memory-intensive และ compute-heavy logic
- **Latency Target:** `< 50 µs` (FFI overhead budget)

### Tier 3 — The Cognitive Plane (Event Loop Layer)

- **Technology:** Python asyncio (uvloop)
- **Mechanism:** Batch Processing + Signal Dispatching
- **Function:** orchestration ระดับสูง, decision logic, และ LLM integration
- **Latency Target:** `< 1 ms` (perceptual/control plane budget)

---

## 2) Theoretical Upper Bound (Hybrid Python + Rust)

การคำนวณอ้างอิงข้อจำกัดของ Python GIL และ overhead การข้ามภาษา (FFI)

### Assumptions

- Memory Bandwidth: `64 GB/s` (DDR5), PCIe Gen5
- PyO3 FFI overhead: `~50 ns` ต่อ call
- Python asyncio loop overhead: `~20 µs` ต่อ tick
- Batch size: `N`

### Throughput Formula

สำหรับ batch execution หนึ่งรอบ:

\[
T_{batch} = T_{loop} + T_{ffi} + T_{rust}(N) + T_{fabric}
\]

และ throughput โดยประมาณ:

\[
\text{Throughput} \approx \frac{N}{T_{batch}}
\]

### Worst Case (Naive Python, single-message dispatch)

- ทุกข้อความต้องผ่าน event-loop + Python object handling + syscall/path overhead
- throughput จะถูกจำกัดโดย per-message overhead ของ Python เป็นหลัก

### AetherBus Extreme Case (Batch = 10,000 + Zero-Copy Rust)

ตัวอย่าง budget ต่อหนึ่ง batch:

- Python dispatch: `20 µs`
- Rust in-memory SIMD/parallel process (10k records): `100 µs`
- RDMA latency: `2 µs`

ดังนั้น:

\[
T_{batch} \approx 122\,\mu s
\]

\[
\text{Throughput} \approx \frac{10,000}{122\times10^{-6}} \approx 81.9\ \text{million msg/sec}
\]

> สรุป: คอขวดสำคัญไม่ใช่ Python เพียงอย่างเดียว แต่คือรูปแบบการส่งข้อมูล หากใช้ pointer passing + batching เพดานทฤษฎีสามารถเกิน `80M msg/sec`.

---

## 3) Benchmark Suite (Stress Test Script)

ไฟล์ benchmark: `bench_aether_extreme.py`

แนวคิดการทดสอบ:

- จำลองโครงสร้าง Hybrid (`asyncio` loop + mocked Rust core)
- ส่งงานแบบ batch โดย queue-based producer/consumer
- วัด throughput (msg/sec) และ latency distribution (P50/P99)
- รองรับ `uvloop` อัตโนมัติถ้ามีในระบบ

---

## 4) Kernel Bypass Strategy (RDMA)

### OS memlock baseline

ไฟล์ตัวอย่าง: `/etc/security/limits.d/rdma.conf`

```conf
# RDMA pinning requires unlimited memlock
* soft memlock unlimited
* hard memlock unlimited
```

### Rust implementation note

ใน Tachyon Core ฝั่ง Rust ควรใช้ `ibverbs` หรือ `async-rdma` สำหรับ direct NIC access

```rust
use std::os::raw::c_void;

pub struct RdmaBuffer {
    ptr: *mut c_void,
    len: usize,
    lkey: u32,
}

impl RdmaBuffer {
    pub fn register_memory(ctx: &Context, data: &[u8]) -> Self {
        let mr = ctx.register_mr(data, AccessFlags::LOCAL_WRITE);
        RdmaBuffer {
            ptr: data.as_ptr() as *mut c_void,
            len: data.len(),
            lkey: mr.lkey(),
        }
    }
}
```

---

## 5) Validation & Interpretation Guide

- ถ้า throughput > `5,000,000 msg/sec` บน benchmark simulation:
  - จัดว่า topology พร้อมสำหรับ Tachyon bridge-level optimization
- ถ้าต่ำกว่า threshold:
  - ปรับ `batch_size`
  - ลด Python-side allocations
  - ตรวจ profiler ของ event loop และ queue contention

> หมายเหตุ: benchmark นี้เป็น simulation ระดับ architecture behavior ไม่ใช่การวัด RDMA hardware path จริง (ต้องรันบนระบบที่มี NIC/driver รองรับ RDMA).
