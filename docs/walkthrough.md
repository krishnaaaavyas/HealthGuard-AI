# Corrective Walkthrough: HealthGuard V1 Restoration & V2 Isolation

We have successfully restored the stable V1 production runtime flows and user dashboard interface to their original specifications while fully isolating all experimental V2 ML service layers and schemas.

---

## 🚀 Key Accomplishments

### 1. Heuristic Classification Renamed & Relocated
- Moved the rule-based risk classification logic from `backend/src/services/mlRisk.service.ts` to [experimentalRiskHeuristic.service.ts](file:///c:/Users/admin/Documents/Hackathons%20ig/HealthGuard%20AI/backend/src/experimental/experimentalRiskHeuristic.service.ts).
- Renamed the exported class to `ExperimentalRiskHeuristicService` to avoid mislabeling as a machine learning model.
- Removed all arbitrary confidence numbers from V1 interfaces.

### 2. V1 Production Routes Isolated
- Corrected the `/api/profile`, `/api/risk/calculate`, and `/api/risk/advice` routes in [server.ts](file:///c:/Users/admin/Documents/Hackathons%20ig/HealthGuard%20AI/backend/src/server.ts) to eliminate legacy ML classification dependencies.
- Added a result filter in `/api/dashboard/bootstrap` and `/api/profile` to strip historical `mlRisk` fields, keeping backward compatibility clean and robust.
- Removed prompt-injection details in [ai.service.ts](file:///c:/Users/admin/Documents/Hackathons%20ig/HealthGuard%20AI/backend/src/services/ai.service.ts) to guarantee that Gemini advice prompt payloads contain zero machine learning terms.

### 3. V1 User Dashboard Reverted
- Removed experimental V2 cards, badges, and layout overrides from the condition breakdown dashboard.
- Completely removed the legacy heuristic overall `mlRisk` card block from [_app.dashboard.lazy.tsx](file:///c:/Users/admin/Documents/Hackathons%20ig/HealthGuard%20AI/src/routes/_app.dashboard.lazy.tsx).
- Standardized file layouts to align with linter guidelines.

### 4. Regression & Invariance Assertions
- Introduced [test-v1-invariance.ts](file:///c:/Users/admin/Documents/Hackathons%20ig/HealthGuard%20AI/backend/src/test-v1-invariance.ts) in the backend test runner suite.
- Validated that V1 endpoints return no `mlRisk` records, prompts sent to Gemini contain no machine learning words, and old records with `mlRisk` load safely without leaking.
- Added skipping support to the live FastAPI router test if the Python server is offline.

---

## 🧪 Verification Results

1. **Backend Integration & Invariance Suite**
   Ran the consolidated test scripts via `npm run test`:
   - `test-runner.ts` (Phase 1 Heuristics & Phase 2/3 Models): `100% PASS`
   - `test-v2-routes.ts` (V2 API endpoints & status overrides): `100% PASS`
   - `test-v2-schemas.ts` (Zod validation & offline/live scenarios): `100% PASS`
   - `test-v1-invariance.ts` (V1 isolation boundaries & database compatibility): `100% PASS`
   - **Consolidated Output**: `All 4 test runners resolved successfully with exit code 0.`

2. **Visual Regression baseline & Onboarding Flow**
   - Launched the E2E Playwright screenshot capture script `node src/capture-screenshots.cjs` to run through user registration, the onboarding questionnaire, and verify dashboard layout structures.
