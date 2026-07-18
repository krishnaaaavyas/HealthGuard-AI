# Test Audit and Classification Report (Phase A3)

This report logs the audit, classification, and execution parameters of the automated regression and security test suites in HealthGuard AI.

---

## 1. Test Classification Matrix

| File Path | Test Case Name / Purpose | Test Category | Target Component |
| :--- | :--- | :--- | :--- |
| `src/lib/compatibility.test.ts` | Legacy record parser strips `mlRisk` | Unit Test | Compatibility / Parsing |
| `src/lib/compatibility.test.ts` | Static check: Dashboard doesn't query `mlRisk` | Static Source Check | UI Integrity |
| `src/lib/compatibility.test.ts` | Render check: Dashboard excludes ML elements | Component Integration | UI Rendering |
| `backend/src/test-runner.ts` | Prints calculations, food advice, predictions | Console Demonstration | Core Math Services |
| `backend/src/test-v2-routes.ts` | Validates V2 routing & fallback behaviors | Integration Test | HTTP Routing |
| `backend/src/test-v2-schemas.ts` | Validates Zod schemas and localStorage hydration | Integration Test | Schemas & State |
| `backend/src/test-v1-invariance.ts` | Asserts calculations do not return `mlRisk` | Integration Test | V1/V2 Isolation |
| `backend/src/test-security.ts` | Enforces token verify and cross-user isolation | Security Integration | Authentication / ACL |
| `e2e/smoke.spec.ts` | E2E browser landing, onboarding, assessment, logout | E2E Browser Test | End-to-End Session |

---

## 2. Test Execution Frameworks

The testing suite utilizes standard JavaScript tooling to maintain high reliability and performance across development and staging environments:

1. **Vitest**: Runs the frontend component renders and utility logic test cases. Execution is handled natively in node without requiring JSDOM setup for unit assertions.
2. **Dynamic Node Fetch**: Backend integration and security suites are executed by spawning the Express engine locally on a dynamic free port (`app.listen(0)`) and sending HTTP requests over loopback (`localhost`).
3. **Playwright**: Runs headless browser sessions against standard localhost targets to verify E2E user flows from registration to report download.
