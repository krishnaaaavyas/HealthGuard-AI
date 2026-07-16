# Dataset Card: Diabetes Risk Estimation (V2 Baseline)

This document provides metadata, feature descriptions, target classes, and bias audits for the baseline diabetes training dataset.

---

## 1. Dataset Overview
- **Source**: Synthetic patient generation using physiological ranges from metabolic risk studies (FINDRISC guidelines).
- **Licence**: MIT / Creative Commons Zero (CC0).
- **Population**: General metabolic screening clinic profile representation.
- **Collection Period**: July 2026.
- **Sample Size**: 10,000 synthetic patient records.
- **Intended Use**: Training and validating baseline classifier models for HealthGuard AI V2.
- **Prohibited Use**: Real-world medical diagnosis or treatment guidelines without physician oversight.

---

## 2. Feature Definitions

| Feature Name | Type | Unit / Range | Description |
| :--- | :--- | :--- | :--- |
| `age` | Integer | 1 - 120 (years) | Patient age in years. |
| `bmi` | Float | 10.0 - 45.0 | Body Mass Index, derived from weight and height. |
| `fastingBloodSugar` | Float | 50.0 - 400.0 (mg/dL) | Fasting blood glucose measurement. |
| `systolicBP` | Float | 70.0 - 220.0 (mmHg) | Systolic blood pressure. |
| `diastolicBP` | Float | 40.0 - 130.0 (mmHg) | Diastolic blood pressure. |
| `smoking` | Categorical | `never`, `former`, `current` | Smoking history. |
| `exercise` | Categorical | `none`, `light`, `moderate`, `active` | Physical activity level. |
| `bloodSugarHbA1c` | Float | 3.0 - 18.0 (%) | Hemoglobin A1c (glycated hemoglobin percentage). |

---

## 3. Target Definition
- **`target`**: Binary value (`0` = Low/Normal Diabetes Risk, `1` = High/Pre-diabetic Risk).
- **Positive Label Criteria**: Determined by the metabolic rule:
  - `bloodSugarHbA1c >= 6.5` OR
  - `fastingBloodSugar >= 126` OR
  - Combined elevated BMI (> 28) and elevated blood sugar (HbA1c >= 5.7).

---

## 4. Bias and Limitations
- **Data Source**: Since this dataset is synthetically derived for validation, it lacks real-world correlation noise and geographic clinical nuances.
- **Production Status**: The trained model must remain in **`unavailable`** status in production until a validated, real clinical dataset is acquired, clinically approved, and trained.
