# HealthGuard AI 🛡️

### AI-Powered Preventive Health Awareness & Risk Assessment Portal

HealthGuard AI is a modern, patient-first web application designed to help individuals evaluate their metabolic and cardiovascular risk factors before symptoms manifest. Leveraging **Gemini AI**, evidence-based clinical guidelines, and a beautiful, high-performance user interface, HealthGuard AI empowers users to identify chronic health risks (Type 2 Diabetes, Hypertension, and Heart Disease) in under 10 minutes and receive immediate, personalized, and actionable lifestyle guidance.

---

## 🌟 Key Features

### 📋 1. Guided One-Time Health Assessment (Onboarding)

- First-time users are automatically redirected to a multi-step health questionnaire on signup/login.
- Once completed, returning users skip directly to the dashboard — no repeated questionnaires.
- Assessment covers: age, gender, height, weight, smoking, exercise, alcohol, family history, and current symptoms.
- Reassessment is available at any time from the **Profile** page.

### 📊 2. Intelligent Risk Dashboard

- **Clinical Risk Math**: Computes scores using **FINDRISC** (Type 2 Diabetes) and **Framingham** (Heart Disease & Hypertension) equations for clinical transparency.
- **Action Impact Engine**: Tests multiple realistic lifestyle changes, recalculates risk for each, and ranks them by impact. The dashboard says *"Exercise 30 min/day can reduce your risk by 19%"* — not just a number.
- **Risk Driver Analysis**: Breaks down risk into weighted contributors (e.g. Sedentary Lifestyle 38%, BMI 27%) so users understand *why* their risk is high.
- **Dynamic Journey Card**: Shows assessment completion status, recommended next step, and profile age.

### 🍱 3. Personalized Action Plan

- AI-generated weekly meal and activity plans tuned to regional cuisine (Indian veg/non-veg) and fitness level.
- Supports **English, Hindi, and Gujarati** language output.

### 🔍 4. Smart Food Scanner

- **Gemini Multimodal OCR**: Parses food packaging photos (drag-and-drop or live webcam) and extracts ingredients.
- **Personalized Impact**: Scores each food item against the user's specific risk profile — not generic nutrition advice.
- **Health Score (1–10)**: Reports glycemic (Diabetes), vascular (Hypertension), and cardiac impact separately.
- Offline fallback keyword evaluator when API is unavailable.

### 🩺 5. Human Expert Review

- Users can request their health summary be reviewed by a clinical expert.
- Real-time expert chat powered by **Firestore listeners** (with polling fallback).
- Expert portal at `/expert-dashboard` shows pending patient requests with full risk snapshots.
- Supports mock expert registration for development/demo environments.

### 📄 6. Clinician-Friendly PDF Reports

- Downloadable PDF health summaries via `jsPDF` for hospital portals or personal records.

### 🛡️ 7. Post-Generation Safety Guardrails

- Regex/word-matching validator on all AI recommendations redacts diagnosis assertions and drug prescription language, keeping all content strictly educational.

---

## 🛠️ Tech Stack & Architecture

### Frontend

| Layer | Technology |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 + Radix UI primitives |
| Charts | Recharts |
| Reports | jsPDF |
| Auth / DB | Firebase client SDK (Auth + Firestore) |

### Backend (`/backend`)

| Layer | Technology |
|---|---|
| Server | Express.js + TypeScript (`tsx watch`) |
| Auth | Firebase Admin SDK (+ mock fallback) |
| AI | Gemini API `gemini-2.5-flash` |
| Validation | Zod |

---

## 📂 Project Structure

```
healthguard-ai/
├── src/
│   ├── components/
│   │   ├── ui/                    # Radix UI primitives
│   │   ├── app-sidebar.tsx        # Sidebar: Dashboard, Food Scanner, Action Plan, Progress, Expert Review, Profile
│   │   └── language-switcher.tsx
│   ├── contexts/
│   │   └── auth-context.tsx       # Firebase auth state + backend sync
│   ├── lib/
│   │   ├── firebase.ts            # Firebase config + local fallback
│   │   ├── health-store.ts        # LocalStorage + cloud sync helpers
│   │   ├── health.functions.ts    # Gemini API integration + schema validation
│   │   └── i18n.ts                # EN / HI / GU translations
│   └── routes/
│       ├── _app.tsx               # Auth layout + onboarding redirect guard
│       ├── _app.dashboard.tsx     # Risk dashboard + action impacts + drivers
│       ├── _app.assessment.tsx    # Multi-step onboarding questionnaire
│       ├── _app.scanner.tsx       # Food label scanner
│       ├── _app.action-plan.tsx   # Personalized lifestyle plan
│       ├── _app.progress.tsx      # Historical risk tracking
│       ├── _app.expert-review.tsx # Patient expert request + real-time chat
│       ├── _app.profile.tsx       # User profile + reassessment trigger
│       ├── expert-dashboard.tsx   # Expert (doctor) portal
│       └── index.tsx              # Marketing landing page
├── backend/
│   └── src/
│       ├── server.ts                    # Express routes + middleware
│       ├── firebase-admin.ts            # Admin SDK + mock in-memory fallback
│       ├── middleware/auth.ts           # Token verification (real + mock)
│       └── services/
│           ├── risk.service.ts          # FINDRISC + Framingham equations
│           ├── actionImpact.service.ts  # Action ranking engine
│           ├── riskDriver.service.ts    # Risk factor attribution
│           ├── foodImpact.service.ts    # Personalized food scoring
│           ├── ai.service.ts            # Gemini coaching + plan generation
│           └── progress.service.ts     # Longitudinal snapshot logging
├── .env                           # VITE_FIREBASE_* + VITE_API_URL
├── backend/.env                   # GEMINI_API_KEY
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- (Optional) Firebase project credentials for cloud sync

### 1. Install Dependencies

```bash
# Root (frontend)
npm install

# Backend
cd backend && npm install
```

### 2. Configure Environment Variables

**Root `.env`** (frontend):
```env
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_API_URL="http://localhost:5000"
```

**`backend/.env`**:
```env
GEMINI_API_KEY="your-gemini-api-key"
# Optional: uncomment and set if you have a Firebase service account
# FIREBASE_SA_KEY_PATH="./service-account.json"
```

> **Note**: Without Firebase service account credentials, the backend automatically falls back to in-memory mock storage. This is sufficient for local development and demos.

### 3. Start Development Servers

**Both servers at once** (recommended):
```bash
npm run dev:all
```

**Or separately**:
```bash
# Terminal 1 — Frontend (http://localhost:5173)
npm run dev

# Terminal 2 — Backend (http://localhost:5000)
cd backend && npm run dev
```

### 4. First-Time User Flow

1. Visit `http://localhost:5173`
2. **Sign up** or **Log in**
3. Complete the one-time **Health Assessment** (redirected automatically)
4. Land on your personalized **Dashboard** with risk profile, action impacts, and risk drivers

### 5. Production Build

```bash
# Frontend
npm run build

# Backend
cd backend && npm run build
```

---

## 🗺️ Development Phases

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Vite + React 19 + TanStack Router + Tailwind v4 foundation | ✅ Complete |
| **Phase 2** | Multimodal Food Scanner (Gemini Vision OCR + webcam) | ✅ Complete |
| **Phase 3** | Clinical Calibration (FINDRISC + Framingham equations) | ✅ Complete |
| **Phase 4** | Safety Guardrails (AI claim + prescription validation) | ✅ Complete |
| **Phase 5** | Backend Foundation + Firestore Migration | ✅ Complete |
| **Phase 6** | Action Impact Engine (ranked lifestyle interventions) | ✅ Complete |
| **Phase 7** | Risk Driver Analysis (explainable factor contributions) | ✅ Complete |
| **Phase 8** | Food Intelligence (personalized food–risk connection) | ✅ Complete |
| **Phase 9** | UX Cleanup (dashboard focus + sidebar simplification) | ✅ Complete |
| **Phase 10** | Expert Review (human clinical review + real-time chat) | ✅ Complete |
| **Phase 11** | Guided Onboarding (one-time assessment + smart redirects) | ✅ Complete |
