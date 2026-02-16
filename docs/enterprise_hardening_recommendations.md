# Enterprise Hardening Recommendations (ATR Core Server Class D)

เอกสารนี้แปลงข้อเสนอเชิงวิเคราะห์ให้เป็นแผนปฏิบัติที่ลงมือทำได้ โดยคงหลักการสำคัญของระบบ Deep Core:
- deterministic execution
- immutable/auditable data flow
- strict schema & signature validation
- effectively-once semantics

## 1) Code Duplication Reduction

### Current signals
- Duplicate checks already exist via:
  - `scripts/check-duplicate-functions.mjs`
  - `scripts/semantic_duplicate_detector.py`

### Target state
- Shared business logic moved into common utility modules with explicit API contracts.
- Duplicate detector scripts become CI gates (warning first, then blocking).

### Action plan
1. Inventory duplicates by domain (`economy`, `auth`, `resonance`, `gateway`).
2. Extract pure/stateless helpers into `src/backend/common/`.
3. Keep orchestration (I/O, DB, HTTP) in service layer; keep compute logic side-effect free.
4. Add import boundaries to prevent circular dependencies.

### Guardrails
- No change to canonical serialization.
- Refactors must preserve idempotency/dedup behavior.

---

## 2) API Structure Consolidation (`api_gateway/` + `src/backend/api_server.py`)

### Current risk
สองจุดเข้าใช้งาน API อาจทำให้:
- policy drift (auth/rate-limit ไม่เท่ากัน)
- duplicated middleware
- security coverage ไม่สม่ำเสมอ

### Target state
- One ingress architecture with explicit layering:
  - **Edge Gateway** (routing, authn/authz, rate-limit, observability)
  - **Core Service Modules** (domain logic)

### Action plan
1. Define authoritative ingress in architecture decision record (ADR).
2. Move shared middleware (auth, correlation-id, request schema validation) to one module.
3. Keep backward-compatible route aliases during migration window.
4. Remove duplicated routes after parity test.

### Guardrails
- Signature verification remains mandatory.
- Quarantine flow and schema validation cannot be bypassed.

---

## 3) Production Database Upgrade (SQLite -> PostgreSQL + Migration)

### Current risk
SQLite ดีสำหรับ local/dev แต่ข้อจำกัดเรื่อง concurrency และ operational tooling ไม่เหมาะ production-scale enterprise workloads.

### Target state
- PostgreSQL as primary transactional store.
- Alembic migration history for deterministic schema evolution.

### Action plan
1. Introduce DB URL abstraction with explicit environment profiles.
2. Add Alembic baseline from current schema.
3. Migrate constraints/indexes with deterministic naming.
4. Add connection pooling + retry policy for transient DB failures.
5. Run dual-write shadow phase (optional) before cutover.

### Guardrails
- Preserve foreign key integrity and lineage hash assumptions.
- No schema change that weakens audit/event truth model.

---

## 4) Documentation Completion

### Current gap
Project summary exists but should be expanded into operational documents that support team handoff.

### Required documents
- System Context + Component Diagram
- Deployment Guide (dev/staging/prod)
- Runbook (incident, rollback, key rotation)
- Security model (authn, authz, signature verification path)
- Data model and migration policy

### Acceptance criteria
- New engineer can run service locally within 30 minutes.
- On-call engineer can execute rollback from documented steps only.

---

## 5) Security and Authentication Hardening (`src/backend/auth/google_auth.py`)

### Review focus
- Session lifecycle (issue/refresh/revoke/expiry)
- RBAC enforcement points and default-deny posture
- Token verification cache and failure-mode behavior

### Action plan
1. Enforce strict audience/issuer checks for Google ID token.
2. Centralize session validation middleware.
3. Add role-to-permission matrix and deny-by-default policy.
4. Add structured security audit logs (auth success/failure, privilege checks).

### Guardrails
- Authentication failures must not degrade into anonymous access.
- RBAC checks must be deterministic and side-effect free.

---

## 6) Frontend Performance and SEO (Lighthouse)

### Current signal
`.lighthouseci/` reports indicate optimization opportunities.

### Action plan
1. Prioritize critical rendering path:
   - reduce render-blocking assets
   - defer non-critical scripts
2. Optimize static assets:
   - image sizing/compression
   - cache headers with immutable fingerprints
3. Improve runtime cost:
   - avoid redundant API polling
   - batch UI state updates
4. Re-run Lighthouse in CI and track trend.

### Guardrails
- Performance changes must not alter business semantics.
- Security headers/CSP should be preserved or strengthened.

---

## Suggested Implementation Sequence
1. Documentation + ADR freeze (architecture and migration strategy)
2. API ingress consolidation design + compatibility layer
3. Duplication refactor in small deterministic batches
4. PostgreSQL + Alembic rollout
5. Auth/RBAC hardening
6. Lighthouse optimization pass + budgets

This sequence minimizes operational risk while keeping deterministic behavior and validation guarantees intact.
