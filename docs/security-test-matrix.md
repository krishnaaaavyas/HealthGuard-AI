# Security Verification Test Matrix

This matrix documents the verification paths, automated assertions, and outcomes for the Phase A2 security implementation in HealthGuard AI.

## 1. Automated Test Cases

The following test suite is implemented in `backend/src/test-security.ts` to assert security boundary correctness:

| Test ID     | Test Category  | Target Assertion                                                                 | Test Command | Outcome   |
| :---------- | :------------- | :------------------------------------------------------------------------------- | :----------- | :-------- |
| **SEC-001** | Authentication | Missing bearer token returns `401 Unauthorized`.                                 | `npm test`   | ✅ Passed |
| **SEC-002** | Authentication | Unverified/tampered JWT tokens return `401` or `500` safely.                     | `npm test`   | ✅ Passed |
| **SEC-003** | Gating         | Mock authentication rejects requests when `ENABLE_MOCK_AUTH=false`.              | `npm test`   | ✅ Passed |
| **SEC-004** | Gating         | Mock authentication succeeds when `ENABLE_MOCK_AUTH=true` in dev/test.           | `npm test`   | ✅ Passed |
| **SEC-005** | Isolation      | Profile endpoints query and return only data owned by the token UID.             | `npm test`   | ✅ Passed |
| **SEC-006** | Gating         | Mock expert registration is rejected when `ENABLE_MOCK_EXPERT_SIGNUP=false`.     | `npm test`   | ✅ Passed |
| **SEC-007** | Authorization  | Expert reviews GET/POST messages endpoints return `403` for non-owners.          | `npm test`   | ✅ Passed |
| **SEC-008** | Derivation     | Message creation derives `senderRole` server-side, ignoring client forged roles. | `npm test`   | ✅ Passed |

---

## 2. Firestore Rule Verification Matrix

Manual or emulator rules assertions verify direct access boundaries:

- **Users Collection Isolation**:
  - Request: `getDoc(doc(db, "users", "user-A"))` as User A -> `Allow`
  - Request: `getDoc(doc(db, "users", "user-B"))` as User A -> `Deny`
- **Experts Self-Promotion Block**:
  - Request: `setDoc(doc(db, "experts", "user-A"), { verified: true })` -> `Deny`
  - Request: `setDoc(doc(db, "experts", "user-A"), { verified: false })` -> `Allow`
- **Messages Cross-Request Reading Block**:
  - Request: Query messages where `requestId == "request-B"` as User A -> `Deny`
  - Request: Query messages where `requestId == "request-B"` as assigned Expert B -> `Allow`
