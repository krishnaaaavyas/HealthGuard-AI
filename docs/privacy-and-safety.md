# Privacy, Security, & AI Safety Guardrails

This document defines the strict policies and controls implemented in HealthGuard AI V2 to protect patient privacy, comply with HIPAA principles, and maintain clinical safety boundaries.

---

## 1. Protected Health Information (PHI) Logging Policies
To prevent the leakage of sensitive user information:
- **No Identifiable Logs**: System logs must NEVER record full user demographic objects, laboratory value maps, or clinical summaries alongside authentication details or UIDs.
- **Redacted Exceptions**: Error traces containing user-supplied input must pass through a redaction utility before being logged.
- **Secure Token Handling**: JWTs, Firebase Authentication tokens, and session cookies must never be dumped in standard stdout, console logs, or analytics trackers.

---

## 2. Clinical Boundaries & Diagnosis Disclaimer
HealthGuard AI is a preventive risk screening portal and does NOT perform clinical diagnoses or prescribe medication:
- **Language redaction**: AI generators are strictly forbidden from outputting confirmed diagnoses (e.g. "You have Diabetes") or proposing dosages/prescriptions (e.g. "Take 500mg Metformin").
- **Clinical Terminology**: The portal outputs risk tiers ("low risk", "moderate risk", "high risk") rather than diagnostic categories.
- **Consultation Disclaimer**: All recommendation templates must display a standard notice urging users to review reports and recommendations with a licensed healthcare professional before changing their clinical care plans.
