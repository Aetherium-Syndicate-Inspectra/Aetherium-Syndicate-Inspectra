# คู่มือการใช้งาน Aetherium-Syndicate-Inspectra

เอกสารนี้สรุปขั้นตอนเริ่มต้นสำหรับรันระบบแบบ local ทั้งฝั่ง Backend และ Frontend รวมถึงคำสั่งทดสอบพื้นฐานของโปรเจกต์

## 1) ความต้องการเบื้องต้น

- Python 3.11+
- Node.js 20+
- npm 10+

> หมายเหตุ: โปรเจกต์นี้มีทั้ง FastAPI (Python) และ Vite/React (Frontend)

## 2) เตรียม Environment Variables

1. คัดลอกไฟล์ตัวอย่าง

```bash
cp .env.example .env
```

2. แก้ค่าอย่างน้อยต่อไปนี้ใน `.env`

- `GOOGLE_CLIENT_ID` สำหรับ Google Auth
- `PAYMENT_WEBHOOK_SECRET` (ถ้าต้องทดสอบ webhook)
- `TACHYON_CORE_LIBRARY_PATH` (เฉพาะกรณีต้องการผูก Rust core library)

## 3) ติดตั้ง dependencies

### Backend (Python)

ติดตั้ง dependency ตาม environment ของทีมคุณ (เช่น virtualenv หรือ conda) และให้มี package สำคัญ เช่น `fastapi`, `uvicorn`, `pydantic`, `python-dotenv`, `pytest`

### Frontend (React/Vite)

```bash
cd frontend
npm install
cd ..
```

## 4) รันระบบ

### 4.1 รัน Backend API Gateway

```bash
uvicorn api_gateway.main:app --reload --host 0.0.0.0 --port 8000
```

เมื่อรันสำเร็จสามารถตรวจสอบได้ที่:

- API status: `http://localhost:8000/`
- Dashboard endpoint: `http://localhost:8000/dashboard`

### 4.2 รัน Frontend (Dev mode)

เปิดอีก terminal แล้วรัน:

```bash
cd frontend
npm run dev
```

ค่า default ของ Vite มักอยู่ที่ `http://localhost:5173`

## 5) Build สำหรับ production

### 5.1 Build Frontend

```bash
cd frontend
npm run build
cd ..
```

ไฟล์จะอยู่ที่ `frontend/dist` และสามารถเปิดผ่าน backend route `/dashboard`

## 6) การทดสอบ (Testing)

### 6.1 รันชุดทดสอบ Python

```bash
pytest -q
```

### 6.2 รันทดสอบ JavaScript ที่มีอยู่ใน repo

```bash
node --test tests/app-state.test.mjs
```

## 7) โครงสร้างสำคัญที่ควรรู้

- `api_gateway/main.py` — จุดเข้าใช้งาน API gateway และเส้นทาง dashboard
- `src/backend/api_server.py` — FastAPI bridge และ integration หลักกับ backend modules
- `frontend/` — โค้ด UI ฝั่ง React + Vite
- `tests/` — ชุดทดสอบหลักของระบบ
- `docs/` — เอกสารเชิงเทคนิคและเอกสารประกอบ

## 8) ปัญหาที่พบบ่อย

- **เปิด `/dashboard` ไม่ได้**: ให้ build frontend ก่อน (`npm run build`) เพื่อสร้าง `frontend/dist`
- **Google auth ใช้งานไม่ได้**: ตรวจค่า `GOOGLE_CLIENT_ID` ใน `.env`
- **Tachyon Core ไม่ถูกโหลด**: ระบบจะทำงานโหมด fallback ได้ แต่ถ้าต้องใช้ Rust core ให้ตั้งค่า `TACHYON_CORE_LIBRARY_PATH` ให้ถูกต้อง

---

หากต้องการเอกสารเชิงสถาปัตยกรรมเชิงลึกเพิ่มเติม ดูในโฟลเดอร์ `docs/` เช่น launch readiness report และ high-performance spec
