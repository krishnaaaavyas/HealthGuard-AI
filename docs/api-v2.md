# Versioned API V2 Documentation

This document describes the API contract, request payloads, response bodies, and validation conditions of versioned V2 endpoints.

---

## 1. Auth Guard requirement

All endpoints under the `/api/v2/*` versioned path require a valid Firebase ID Token passed in the `Authorization` header:

```text
Authorization: Bearer <Firebase_ID_Token>
```

---

## 2. API Endpoints

### 2.1 Health Assessment (`/api/v2/health-assessment`)

Demographic, clinical, and physiological measurements.

- **Method**: `POST`
- **Request Payload Example**:
  ```json
  {
    "age": 32,
    "gender": "male",
    "heightCm": 178,
    "weightKg": 75,
    "smoking": "never",
    "exercise": "moderate",
    "familyHistory": "Type 2 diabetes in father",
    "symptoms": "none",
    "alcohol": "occasional",
    "sleepHours": 7,
    "systolicBP": 120,
    "diastolicBP": 80,
    "heartRate": 70,
    "fastingBloodSugar": 88
  }
  ```
- **Response Bodies**:
  - **Success (`200 OK`)**:
    ```json
    {
      "success": true,
      "message": "V2 Health assessment saved successfully.",
      "data": { ... }
    }
    ```

- **Method**: `GET`
- **Response Bodies**:
  - **Success (`200 OK`)**: Returns current user's V2 assessment metadata.

---

### 2.2 Laboratory Reports (`/api/v2/lab-reports`)

Uploaded report metrics and biomarker validation records.

- **Method**: `POST`
- **Request Payload Example**:

  ```json
  {
    "reportId": "rep_902341",
    "uploadDate": "2026-07-16T18:00:00Z",
    "bloodSugarHbA1c": 5.7,
    "totalCholesterol": 190,
    "hdlCholesterol": 50,
    "ldlCholesterol": 110,
    "triglycerides": 140,
    "isVerified": false
  }
  ```

- **Method**: `GET`
- **Response Bodies**:
  - **Success (`200 OK`)**: Returns array of all lab reports uploaded by the current user.

---

### 2.3 Recommendations (`/api/v2/recommendations`)

ML-derived disease specific risk and lifestyle advice routine.

- **Method**: `POST`
- **Request Payload Example**:

  ```json
  {
    "assessmentId": "uid_assessment_99",
    "riskCategory": "moderate",
    "diseaseSpecificRisks": {
      "diabetesRiskPercent": 14.5,
      "heartDiseaseRiskPercent": 8.2,
      "hypertensionRiskPercent": 22.0
    },
    "dietPlanRegional": {
      "cuisinePreference": "Indian Vegetarian",
      "dailyMeals": ["Oatmeal with nuts", "Dal Tadka and Roti", "Mixed fruit salad"],
      "keyExclusions": ["High sugar sweets", "Refined grains"]
    },
    "fitnessRoutine": {
      "exercises": ["Brisk Walking", "Yoga"],
      "frequencyWeekly": 5,
      "durationMinutesPerSession": 30
    },
    "clinicalReferralNeeded": false,
    "physicianGuidanceNotes": "Monitor blood pressure and exercise regularly."
  }
  ```

- **Method**: `GET`
- **Response Bodies**:
  - **Success (`200 OK`)**: Returns list of recommendation models for the user.

---

### 2.4 Regional Context (`/api/v2/regional-context`)

Custom language preference, dietary limitations, and state-level settings.

- **Method**: `POST`
- **Request Payload Example**:

  ```json
  {
    "language": "hi",
    "preferredDietaryType": "vegetarian",
    "stateOrRegionCode": "IN-MH",
    "customRegionalRules": ["Exclude dairy during fasts"]
  }
  ```

- **Method**: `GET`
- **Response Bodies**:
  - **Success (`200 OK`)**: Returns regional setting profiles.
