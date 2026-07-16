# Current Architecture Audit

This document presents a precise, real audit of the current HealthGuard AI codebase, covering the frontend and backend structures, environment variables, database configuration, local-first cache keys, and calculation engines.

---

## 1. Frontend Structure
- **Core Technology**: React 19 + TypeScript + Vite.
- **Routing**: TanStack Router (file-based routing). The routes are defined in `src/routes/` using lazy-loading for heavier pages to optimize bundle sizes (e.g. `_app.dashboard.lazy.tsx`, `_app.scanner.lazy.tsx`).
- **Styling**: Tailwind CSS v4 and Radix UI primitive components.
- **Charts**: Recharts used for risk progression graphs and metrics attribution.
- **PDF Export**: Generated purely on the client side using the `jsPDF` package.
- **Authentication**: Firebase Client SDK handles user logins, registration, and session listeners.
- **API Client**: Robust client in `src/lib/api-client.ts` providing timeout aborts (15s/25s), auto-injected auth headers, exponential backoff retries, and duplicate request deduplication.

---

## 2. Backend Structure
- **Core Technology**: Node.js + Express + TypeScript.
- **Execution / Compilation**: Managed via `tsx watch` for development and compiled to JS using `tsc` for production.
- **Database/Auth Access**: Firebase Admin SDK. Supports full connection to Firestore and fallback mock mode when credentials are not supplied.
- **AI Integrations**: Google Gemini API via `gemini-2.5-flash` for plan generation, explanation support, and scanned foodOCR checks.
- **Calculations**: Risk service and simulation modules performing statistical analysis.

---

## 3. Firebase Configuration
- **Auth**: Firebase Authentication manages clinical and patient logins.
- **Firestore**: Database layout with collections:
  - `users`: Patient profile records, metadata, and assessment milestones.
  - `progressLogs`: Snapshots of risk factors over time.
  - `expertRequests`: Real-time expert reviews.
  - `chats`: Communication logs between patients and expert review clinicians.
- **Rules**: Security rules in `firestore.rules` enforcing document-level authentication checks.

---

## 4. Existing Assessment & Calculations
- **Wizard Form**: `src/routes/_app.assessment.lazy.tsx` runs a 4-step health assessment.
- **Risk Calculation**: Performs clinical evaluations client-side and backend-side using two primary guidelines:
  - **FINDRISC Points Table**: Type 2 Diabetes risk evaluation.
  - **Framingham Equation**: Cardiovascular risk and Heart Disease probability.
  - **Vascular Rules**: Multi-dimension hypertension indicator.

---

## 5. Existing LocalStorage & Sync Architecture
- **Cache Keys**:
  - `hg.profile.v1`: User demographic/physiological profiles.
  - `hg.result.v1`: Calculated risk summaries, AI plans, and diet coaching.
  - `hg.history.v1`: Snapshot records list tracking historical assessments.
  - `hg.pending-sync.v1`: Array of queued payload modifications.
- **Sync Engine**: `src/lib/profile-sync.ts` manages connection recovery hooks (`online` events), debounces multiple edits, and uploads changes in the background.

---

## 6. React Query & Testing Setup
- **React Query**: Configured in `src/router.tsx` and wrapped in `src/routes/__root.tsx`, but no active query hooks are used for REST routes.
- **Tests**:
  - `backend/src/test-runner.ts` tests ML clinical engines.
  - `backend/src/test-v2-routes.ts` tests V2 versioned routes and feature flags.
