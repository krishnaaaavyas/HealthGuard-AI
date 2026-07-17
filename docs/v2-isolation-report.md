# HealthGuard V2 Isolation Report

This report outlines the isolation and stabilization tasks completed to revert the HealthGuard V1 runtime flow and UI to its stable baseline while preserving the experimental V2 machine learning pipeline.

## Stable V1 Reference Point
- **Git Tag Reference**: `v1.0.0-pre-v2` represents the stable MVP baseline.
- **Goal**: Revert V1 runtime behavior (Express routes, Firestore state, Gemini prompts, frontend dashboard rendering) to match this tag, while ensuring V2 code remains available but isolated.

## Summary of Changes

### 1. Relocation of Rule-Based Calculations
- Relocated legacy `mlRisk.service.ts` to `backend/src/experimental/experimentalRiskHeuristic.service.ts`.
- Renamed the exported class to `ExperimentalRiskHeuristicService`.
- Removed all "ML" / "Machine Learning" labeling to prevent misrepresenting deterministic conditional weightings as trained models.

### 2. V1 Runtime Code Corrections (Backend)
- Modified `backend/src/server.ts` to:
  - Remove imports and invocations of the legacy ML classification service within `POST /api/profile`, `POST /api/risk/calculate`, and `POST /api/risk/advice`.
  - Filter historical `mlRisk` properties from results in `GET /api/profile` and `GET /api/dashboard/bootstrap` for database compatibility.
  - Export the `app` instance and wrap the server port listener in a test conditional to support automated integration testing.
- Modified `backend/src/services/ai.service.ts` to omit the `mlRisk` parameters from constructed Gemini prompts.

### 3. V1 Frontend Layout Reversion
- Modified `src/routes/_app.dashboard.lazy.tsx` to:
  - Revert the disease breakdown rendering logic to exclude V2 model tags, badges, registries, and indicators.
  - Completely hide and remove the `result.mlRisk` card block, ensuring no V1 user sees evidence of the experimental heuristics.

### 4. Integration Verification Suites
- Updated `backend/src/test-runner.ts` to test `ExperimentalRiskHeuristicService` at its new location.
- Added `backend/src/test-v1-invariance.ts` to verify:
  - All V1 Express endpoints exclude `mlRisk` and ML classification fields from responses.
  - V1 Gemini API coach prompts contain zero machine learning terms.
  - Stored profiles carrying historical `mlRisk` fields are safely ignored at read boundaries.

## Testing Execution Results
The test suites verify that:
1. V1 legacy operations run perfectly with the FastAPI service stopped.
2. V2 routes under `/api/v2/*` default to disabled and return a controlled `HEALTH_ENGINE_V2_DISABLED` response.
3. The visual E2E smoke tests successfully execute all wizard onboarding step captures.
