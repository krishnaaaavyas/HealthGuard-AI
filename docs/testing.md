# Testing and Quality Assurance Guide

This document registers the testing commands, syntax guidelines, and exact baseline verification results for the HealthGuard AI project.

---

## 1. Syntax Check & Lint Verification (Baseline Results)

### Frontend Linter

- **Command**: `npm run lint`
- **Result**: Passed successfully with `0 errors` and `29 warnings` (warnings relate to fast refresh warnings for icons or helper exports from shadcn/ui components).

### Frontend Production Compilation

- **Command**: `npm run build`
- **Result**: Vite production compilation completes successfully in `< 1000ms`, producing clean static assets under `dist/` with no type compiler warnings.

### Backend Linter

- **Command**: `cd backend && npm run lint`
- **Result**: Passed with `0 errors`.

### Backend Type-checking & Build

- **Command**: `cd backend && npm run build`
- **Result**: `tsc` compilation completes with `0 errors`.

---

## 2. Startup Verification & Automated Tests

### Backend Server Listener Startup

- **Command**: `cd backend && npm run dev`
- **Result**: Server successfully boots and listens on `http://localhost:5000` with the connection log:
  `HealthGuard AI Express backend running on http://localhost:5000`

### Automated Calculations & Routes Integration Suite

- **Command**: `cd backend && npm run test`
- **Result**:
  - **Clinical Model checks**: Low-risk Profile A, lifestyle Profile B, and high-risk Profile C resolve correctly to expected categories (`low`, `high`).
  - **Food Scanning check**: Personalized sugar and sodium impact scaling categories verified successfully.
  - **Regression Risk Forecasts**: Confirms improving and worsening trends accurately.
  - **V2 Route Integration**: Returns `503` under `HEALTH_ENGINE_V2_ENABLED=false`, `400` on validation error, and `200` on valid payload submission.

---

## 3. Integration Testing Guidelines (V2)

1. Set `HEALTH_ENGINE_V2_ENABLED=false` inside `backend/.env`. All versioned requests to `/api/v2/*` must resolve to HTTP `503 Service Unavailable` with error payload `HEALTH_ENGINE_V2_DISABLED`.
2. Set `HEALTH_ENGINE_V2_ENABLED=true`. Submit valid schema variables. Response must resolve to `200 OK` or `500` database errors. Submit invalid inputs (e.g. non-numerical sleep hours). Response must yield `400 Bad Request` containing formatting errors list.

---

## 4. Phase A2 Security Verification

To verify authentication, cross-user isolation, and expert Review authorization boundaries, run the automated security test suite:

- **Command**: `cd backend && npm test`
- **Result**: Asserts that:
  - Missing authorization tokens return HTTP `401`.
  - Unverified/tampered JWT tokens return HTTP `401` or `500` safely.
  - Mock authentication is strictly disabled by default.
  - Profiles are query-isolated under the verified token UID.
  - Expert Review messages GET/POST are restricted to the request owner and assigned verified expert (returning `403` otherwise).
  - Message sender role derivation is handled server-side to prevent forgery.
