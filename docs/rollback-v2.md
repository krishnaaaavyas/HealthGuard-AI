# HealthGuard AI V2 Rollback Strategy & Verification

This document guides operations engineers on how to safely rollback V2 deployments to the stable legacy V1 state, and how to verify that legacy operations function normally.

---

## 1. Rollback Actions

### 1.1 Disable V2 Frontend App Shell
- Navigate to the **Vercel dashboard** for the frontend application.
- Select **Environment Variables**.
- Modify `VITE_ENABLE_HEALTH_ENGINE_V2` and set its value to `"false"`.
- Trigger a new deployment of the production branch (or re-deploy the last known stable deployment commit).

### 1.2 Disable V2 Node/Express Backend Routes
- Navigate to the **Render dashboard** for the backend API server.
- Select **Environment**.
- Modify `HEALTH_ENGINE_V2_ENABLED` and set its value to `"false"`.
- Trigger a manual deployment or restart the server instance. This dynamically locks down `/api/v2/*` endpoints, returning `503 Service Unavailable` fallbacks.

### 1.3 Restore Legacy Routes
- The legacy API endpoints (`/api/profile`, `/api/risk/calculate`, `/api/risk/advice`) remain active at all times. Toggling backend feature flags to `"false"` routes patient data processing through the legacy clinical algorithms immediately.

### 1.4 Remove New Environment Variables
- To completely clean up configuration keys, delete `VITE_ENABLE_HEALTH_ENGINE_V2` from the Vercel console and `HEALTH_ENGINE_V2_ENABLED` from the Render environment variables, then redeploy.

---

## 2. Legacy Verification Checklist
To confirm that legacy operations are successfully restored:
1. **Login Flow**: Complete a login/registration check. Verify user status resolves.
2. **Assessment Calculations**: Open `/assessment` and complete the questionnaire. Verify clinical scores are computed and saved locally.
3. **Background Sync**: Verify background uploads write successfully to the database.
4. **Dashboard rendering**: Verify risk drivers and Modifiable Action Priorities load.
5. **Nudges / Expert chat**: Verify real-time expert reviews still function.
