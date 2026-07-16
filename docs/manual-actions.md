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
