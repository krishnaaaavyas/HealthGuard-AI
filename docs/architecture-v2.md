# Architecture Design: HealthGuard AI V2

This document details the architecture design for the V2 upgrade of the HealthGuard AI preventive health engine, integrating machine learning models, laboratory report processing, personalized recommendations, and localized context engines.

```mermaid
graph TD
  User[User Client] -->|Protected API Request| Gate[Express Gateway]
  Gate -->|Feature Flag Checks| RouterV2{V2 Enabled?}
  RouterV2 -->|No: Fallback 503| Disabled[Disabled State Response]
  RouterV2 -->|Yes| HandlerV2[V2 Route Handler]
  HandlerV2 -->|Validate Payload| Zod[Zod Schema Checker]
  Zod -->|Fail: 400| BadReq[Validation Error Response]
  Zod -->|Success| ControllerV2[V2 Storage & ML controller]
  ControllerV2 -->|Firestore Collection| DB[(Firestore V2 Collections)]
```

## 1. Feature Flags & Decoupled Isolation

All new health-intelligence integrations reside behind distinct feature flags to ensure additive safety without breaking legacy stability:

- **Frontend Toggle**: `VITE_ENABLE_HEALTH_ENGINE_V2` (defaults to `false`).
- **Backend Toggle**: `HEALTH_ENGINE_V2_ENABLED` (defaults to `false`).

When disabled, all endpoints under the versioned route path `/api/v2/*` yield a controlled `HEALTH_ENGINE_V2_DISABLED` response (HTTP 503 Service Unavailable).

## 2. Versioned Endpoint Separation

To avoid collision with the active database synchronization and calculations, all V2 interfaces are completely isolated on their own version path `/api/v2/*`.

The four core endpoints introduced in Phase 1:

1. **Health Assessment**: `/api/v2/health-assessment` (GET / POST)
2. **Lab Reports**: `/api/v2/lab-reports` (GET / POST)
3. **Recommendations**: `/api/v2/recommendations` (GET / POST)
4. **Regional Context**: `/api/v2/regional-context` (GET / POST)

## 3. Fallback and Resilience Strategy

- **Fallback Database**: V2 schemas are mapped to dedicated Firestore collections (`assessmentsV2`, `labReportsV2`, `recommendationsV2`, `regionalContextV2`). The primary risk models and local structures from V1 are retained as-is, ensuring that if a V2 ML module encounters an error, the platform remains fully functional.
- **Fail-Soft Logic**: In case of failures, client components display a user-friendly unavailable message instead of crashing the UI, allowing normal navigation and dashboard viewing.

## 4. Model Deployment and Governance Safeguards

- **Decoupled Python Execution**: The Python FastAPI service is designed to run independently of any specific installed model file. If a requested model artifact is missing or not configured, the service responds gracefully with a `model-unavailable` status.
- **No Fabricated Output**: When a model is absent or unavailable, no score or risk tier is produced or saved. The assessment results are persisted as incomplete/unavailable rather than fabricating scores.
- **Explicit Installation**: Approved research model artifacts must be explicitly installed and configured (including checksum and lifecycle validation) rather than loaded implicitly or fall back silently.
- **Strict Isolation from V1**: Legacy V1 calculators and heuristics are strictly isolated. V1 is never used as a hidden V2 fallback or default generator.
- **Development Lifecycle**: Large-scale dataset training, cohort validation, and full model deployment remain future project phases. All currently running test structures use only isolated, non-production research endpoints.
