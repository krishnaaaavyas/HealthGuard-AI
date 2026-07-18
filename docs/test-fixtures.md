# Clinical Test Fixtures Reference (Phase A3)

This document establishes the frozen parameters, input values, and expected clinical score outcomes for validation of the HealthGuard V1 calculator engine.

---

## 1. Frozen Fixture Profiles

### Profile A: Low-Risk Profile
- **Demographics**: Age: 22, Gender: `male`, Height: 175 cm, Weight: 67.5 kg (BMI: 22.0)
- **Lifestyle**: Smoking: `never`, Exercise: `moderate`, Alcohol: `never`
- **History/Symptoms**: Family History: `None`, Symptoms: `None`, Diseases: `None`
- **Expected Scores**:
  - Diabetes Risk Score: `0%` (Category: `Low`)
  - Heart/CVD Risk Score: `0%` (Category: `Low`)
  - Hypertension Risk Score: `0%` (Category: `Low`)
  - Overall Risk Score: `0%` (Category: `Low`)

### Profile B: Moderate/High Lifestyle Risk
- **Demographics**: Age: 45, Gender: `female`, Height: 170 cm, Weight: 86.7 kg (BMI: 30.0)
- **Lifestyle**: Smoking: `never`, Exercise: `none`, Alcohol: `occasional`
- **History/Symptoms**: Family History: `Diabetes in mother`, Symptoms: `fatigue`, Diseases: `None`
- **Expected Scores**:
  - Diabetes Risk Score: `100%` (Category: `High`, points = 16)
  - Heart/CVD Risk Score: `55%` (Category: `Moderate`, points = 11)
  - Hypertension Risk Score: `64%` (Category: `High`, points = 9)
  - Overall Risk Score: `73%` (Category: `High`)

### Profile C: High Cardiovascular Risk Profile
- **Demographics**: Age: 56, Gender: `male`, Height: 175 cm, Weight: 88.8 kg (BMI: 29.0)
- **Lifestyle**: Smoking: `current`, Exercise: `none`, Alcohol: `frequent`
- **History/Symptoms**: Family History: `Cardiovascular history`, Symptoms: `chest discomfort, breathlessness`, Diseases: `None`
- **Expected Scores**:
  - Diabetes Risk Score: `53%` (Category: `Moderate`, points = 8)
  - Heart/CVD Risk Score: `90%` (Category: `High`, points = 18)
  - Hypertension Risk Score: `93%` (Category: `High`, points = 13)
  - Overall Risk Score: `79%` (Category: `High`)

---

## 2. Boundary Profiles

### Age Boundary Values (Low Point Edge)
- **Inputs**: Age: 45 (low boundary of 2-pt tier), Height: 170 cm, Weight: 60 kg (BMI: 20.8)
- **Expected Age Points**:
  - Diabetes: `2`
  - Heart: `7`
  - Hypertension: `0` (Hypertension has boundaries >45 and >60)

### Age Boundary Values (High Point Edge)
- **Inputs**: Age: 61 (high boundary tier), Height: 170 cm, Weight: 60 kg (BMI: 20.8)
- **Expected Age Points**:
  - Diabetes: `3` (for age >=55 & <=64)
  - Heart: `12` (for age >=60)
  - Hypertension: `4` (for age >60)

### Missing Optional Fields Profile
- **Inputs**: Age: 30, Gender: `female`, Height: 165 cm, Weight: 60 kg (BMI: 22.0)
- **Missing Fields**: `familyHistory` (empty), `symptoms` (empty), `alcohol` (undefined), `diseases` (undefined)
- **Expected Scores**:
  - Diabetes: `0%`
  - Heart: `0%`
  - Hypertension: `0%`
  - Overall: `0%`
