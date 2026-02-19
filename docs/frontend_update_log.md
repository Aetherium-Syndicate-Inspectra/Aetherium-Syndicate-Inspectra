# Frontend Update Log

## 2026-02-19 — Pre-Login Home Redesign + Unified Structure

### What changed
- Introduced a brand-new pre-login **Landing Page** (`frontend/src/pages/LandingPage.tsx`) that explains platform value before entering dashboard.
- Refactored app flow in `frontend/src/App.tsx` to use two views:
  - `landing` (new pre-login homepage)
  - `dashboard` (existing operational console)
- Introduced `frontend/src/layouts/DashboardShell.tsx` to centralize dashboard layout concerns (header, sidebar, panel rendering, footer).
- Added `frontend/src/constants/navigation.ts` for tab metadata as a single source of truth.
- Updated `frontend/src/components/Header.tsx` to consume shared tab definitions and include `Exit` action back to pre-login page.
- Added reusable landing component `frontend/src/components/landing/FeatureCard.tsx`.

### Why this helps next iteration
- Clear separation between **entry experience** and **inside-console experience** makes future work easier:
  - Authentication wiring can be connected at the `view` boundary in `App.tsx`.
  - Role-based access or SSO can route users directly to `dashboard` while preserving the landing marketing narrative.
  - Navigation updates only need edits in `constants/navigation.ts`.

### Suggested next steps
1. Connect real auth state and session persistence to replace temporary `landing/dashboard` toggle.
2. Add internationalization for Thai/English labels in landing and dashboard tab descriptions.
3. Introduce router-based URLs (`/`, `/dashboard`, `/dashboard/:tab`) for deep-linking.
4. Add visual regression snapshots in CI using the two new baseline screens.
