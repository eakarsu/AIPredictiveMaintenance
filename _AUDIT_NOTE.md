# Audit Note — AIPredictiveMaintenance

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_06.md` section #31.

## Original Recommendations

### Gaps — AI Counterparts
- `/alert-fatigue-reduce` (added)
- `/workorder-priority-optimize` (added)

### Gaps — Non-AI Features
- CMMS integration
- OEE tracking
- Asset management (purchase, depreciation)
- Mobile field-tech app
- IoT platform integration

### Custom Feature Suggestions
1. Agentic maintenance orchestration
2. Digital twin simulation
3. Anomaly streaming
4. Predictive parts ordering
5. Maintenance ROI calculator

## Implemented (Mechanical)
- `POST /api/ai/alert-fatigue-reduce` — added in `backend/src/routes/ai.js`. Pulls last N-hour alerts (optional equipment filter), returns clusters, suppressible items, must-action items, fatigue score. Persists via `saveAIPrediction`.
- `POST /api/ai/workorder-priority-optimize` — added in `backend/src/routes/ai.js`. Pulls open work orders + low-health-score equipment snapshot, returns ranked ordering with rationale and suggested priorities. Persists via `saveAIPrediction`.

Both follow existing `callOpenRouter`/`parseAIJson`/`aiRateLimiter`/`saveAIPrediction` style.

## Backlog (deferred)

### NEEDS-CREDS / NEW-DEPS
- CMMS integration (Maximo, SAP PM).
- IoT platform integration (AWS IoT, Azure IoT Hub).
- Mobile push (Firebase, OneSignal).

### NEEDS-PRODUCT-DECISION
- OEE data model & calculation.
- Asset depreciation schema.

### TOO-RISKY
- Real-time anomaly streaming pipeline.
- Digital-twin simulation (proper physics simulation, not LLM).
- Auto-ordering parts (procurement integration + spend authorization).

## Apply pass 3 (frontend)

- **Stack:** Express backend + CRA React frontend (axios + react-icons + recharts).
- **Verdict:** UPDATED-FE. Two endpoints lacked any FE entry point; minimal pages added.
- New pages:
  - `frontend/src/pages/MaintenanceRecommendation.js` — equipment selector + form, calls `POST /api/ai/maintenance-recommendation { equipment_id }`. Renders `maintenance_strategy`, `priority_actions` table, `parts_to_stock`, `cost_benefit_analysis`, plus JSON fallback.
  - `frontend/src/pages/FailureRootCause.js` — failure-record selector, calls `POST /api/ai/failure-root-cause { failure_id }`. Distinct from existing `/ai/root-cause-analysis` already wired in `FailureAnalysis.js`. Renders `primary_root_cause`, `confidence_level`, `contributing_causes`, `five_why_analysis`, `corrective_actions` table, `prevention_measures`, plus JSON fallback.
- Both reuse `services/api.js` axios instance whose interceptor attaches `Authorization: Bearer <token>` from `localStorage.getItem('token')`.
- 503 (no `OPENROUTER_API_KEY`) is surfaced as a red banner with explicit copy.
- Inline styles match the project's existing dark-sidebar / light-page aesthetic and `react-icons/fi` library; no new deps.
- Routes `/maintenance-recommendation` and `/failure-root-cause` registered in `App.js`; sidebar nav entries added in `Sidebar.js`.
- Syntax check: `node --check` passes for `MaintenanceRecommendation.js`, `FailureRootCause.js`, `App.js`, `Sidebar.js`.
- See `_AUDIT/apply3_logs/ab3_46.md` for batch context.

## Apply pass 4 (mechanical backlog)

Added 3 new AI endpoints + 3 new FE pages, sourced from the audit Custom Feature Suggestions list and OEE backlog. Each endpoint uses the existing `callOpenRouter`, `parseAIJson`, `aiRateLimiter`, and `saveAIPrediction` helpers. Each endpoint short-circuits to **HTTP 503** when `OPENROUTER_API_KEY` is not set.

| # | Endpoint | FE page | Audit source |
|---|----------|---------|--------------|
| 1 | `POST /api/ai/maintenance-roi-calculator` | `MaintenanceROI.js` (`/maintenance-roi`) | Custom #5 |
| 2 | `POST /api/ai/oee-analyzer` | `OEEAnalyzer.js` (`/oee-analyzer`) | Non-AI gap: OEE tracking (advisory) |
| 3 | `POST /api/ai/predictive-parts-ordering` | `PredictivePartsOrdering.js` (`/predictive-parts-ordering`) | Custom #4 (advisory only — no procurement integration) |

All three pages reuse `services/api.js` (axios with bearer token from `localStorage`), surface 503 as a red inline banner with the canonical "AI not configured" copy, and follow the existing dark-card / `react-icons/fi` styling used by `WorkOrderPriority.js`. Routes registered in `App.js`; sidebar entries added in `Sidebar.js` (icons reuse already-imported `FiDollarSign`, `FiBarChart2`, `FiShoppingCart`).

**Predictive parts ordering** is intentionally advisory: the route returns an `order_now` / `order_soon` / `watchlist` plan with rationales but never reaches out to procurement. This matches the audit's TOO-RISKY constraint.

**Files touched:**
- `backend/src/routes/ai.js` — added `requireKey()` helper + 3 endpoints below `workorder-priority-optimize`.
- `frontend/src/pages/MaintenanceROI.js` (new), `frontend/src/pages/OEEAnalyzer.js` (new), `frontend/src/pages/PredictivePartsOrdering.js` (new).
- `frontend/src/App.js` — added 3 imports + 3 `<Route>` registrations.
- `frontend/src/components/Sidebar.js` — added 3 nav items.

**Syntax checks:** `node --check` passes for backend; `@babel/parser` (jsx + module) passes for the 3 new pages, `App.js`, and `Sidebar.js`.

**No new deps. No changes to working code (only additions).**
