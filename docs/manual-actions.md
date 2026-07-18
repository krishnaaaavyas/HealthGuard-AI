# Manual Actions Log

This document records the exact steps that must be performed manually to support the V2 rollout.

## 1. Environment Variable Setup

Before deploying to production, configure the following variables in the respective hosting consoles:

### Frontend (Vercel Dashboard)

- Add `VITE_ENABLE_HEALTH_ENGINE_V2="false"` (set to `"true"` only when V2 client interface is fully integrated and tested).

### Node/Express Backend (Render Dashboard)

- Add `HEALTH_ENGINE_V2_ENABLED="false"` (set to `"true"` only when ML Python service integrations and schemas are ready).

---

## 2. Firestore Custom Index Configuration

In production environments, execute the Firebase CLI command to deploy the composite indexes for querying:

```bash
firebase deploy --only firestore:indexes
```

The required indexes in `firestore.indexes.json` are:

- Collection `labReportsV2`: `userId` (Ascending) + `updatedAt` (Descending)
- Collection `recommendationsV2`: `userId` (Ascending) + `updatedAt` (Descending)

---

## 3. Translation and Localization Review

Ensure all V2 localized strings and diet terminology are verified by regional language translators for:

- English (EN)
- Hindi (HI)
- Gujarati (GU)

---

## 4. Phase 0 Production Verification Checks

Before performing any schema migrations or schema deployments on the production environment, the database administrator must manually verify:

- [ ] **Confirm production Firebase project**: Ensure the active CLI workspace matches the correct production project.
- [ ] **Confirm current Firestore backup strategy**: Verify automated backup schedules are active under Google Cloud console.
- [ ] **Confirm current Render environment variables**: Double-check backend Render variables check.
- [ ] **Confirm current Vercel environment variables**: Double-check frontend Vercel variables check.
- [ ] **Create a database backup before later schema work**: Run a manual Firestore backup partition export before starting database modifications in later phases.

---

## 5. Creating Verified Experts in Production

Since ordinary users cannot register themselves as verified experts, and mock expert registration is disabled in production, production database administrators must execute the following trusted process to create a verified expert:

1. Request the expert to sign up as a regular user via standard email/password or Google sign-in.
2. Retrieve the expert's authenticated `uid` from the Firebase Authentication console.
3. Access the Firestore console, select the `experts` collection, and create/update a document named `<uid>` with the following fields:
   - `uid`: string (must match the document ID)
   - `name`: string (display name of the expert)
   - `email`: string (expert's registered email)
   - `role`: string (`"doctor"` or `"nutritionist"`)
   - `specialization`: string
   - `verified`: boolean (set to `true` to approve their access)
   - `createdAt`: string (ISO date string)
