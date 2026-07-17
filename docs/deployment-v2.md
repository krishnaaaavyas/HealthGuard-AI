# Deployment Strategy: HealthGuard AI V2

This document guides the release, deployment, and monitoring of HealthGuard AI V2 components.

## 1. Hosting Platforms

- **Frontend App**: Hosted on Vercel. Static React assets compiled via Vite, routed through TanStack Router file-based system.
- **Backend API**: Hosted on Render. Node/Express instance listening on port 5000 (proxied through https).

---

## 2. Release Steps (Phase 1)

1. **Pre-Deployment Auditing**:
   - Run type checks (`npm run build`) and lint verification (`npm run lint`).
2. **Setup production flags**:
   - Ensure environment variables (`VITE_ENABLE_HEALTH_ENGINE_V2="false"` and `HEALTH_ENGINE_V2_ENABLED="false"`) are set in hosting panels before starting deployment.
3. **Continuous Deployment**:
   - Merge the approved `feat/v2-phase-1-schema` branch into `main` or `v2`.
   - Vercel and Render auto-deploys will trigger on commit push.
4. **Verifying Safe State**:
   - Check Render server logs to verify start sequence finishes.
   - Verify `/health` check succeeds.
   - Run a request to `/api/v2/health-assessment` and verify it fails with `HEALTH_ENGINE_V2_DISABLED` status (confirming the V2 module is safely locked down).
