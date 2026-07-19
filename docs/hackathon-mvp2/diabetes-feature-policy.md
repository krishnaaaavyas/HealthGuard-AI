# Research Feature Policy: Diabetes Screening Model

This document establishes the features permitted for research-model development and validation to enforce clinical safety and prevent data leakage.

## 1. Feature Classification

### Core Predictor Candidates (Non-Invasive Baseline)
- **v4 / age_years**: Age of the participant.
- **v8 / bmi**: Body Mass Index, derived from weight and height.
- **v9 / waist_cm**: Waist circumference.

### Enhanced Predictor Candidates
- **v4 / age_years**: Participant age.
- **v8 / bmi**: Body Mass Index.
- **v9 / waist_cm**: Waist circumference.
- **v10 / systolic_bp**: Systolic blood pressure measurement.
- **v11 / diastolic_bp**: Diastolic blood pressure measurement.

### Sensitivity-Analysis Predictor Candidate
- **v5 / sex**: Biological sex of the participant.

## 2. Forbidden Features (Target Leakage Safeguard)

The following columns and features are strictly **forbidden** as predictors in any model:

1. **v36 / diabetes_composite**: The target outcome.
2. **v37 / prediabetes**: Prediabetes outcome.
3. **v38 / hypertension**: Hypertensive outcome.
4. **v39 / abdominal_obesity**: Waist-circumference derived obesity category.
5. **v40 / generalized_obesity**: BMI-derived obesity category.
6. **v41 / dyslipidaemia**: Lipid profile outcome.
7. **Laboratory venipuncture measurements**: Fasting blood glucose, 2-hour post-load glucose, HbA1c, and any other variable directly used to define or diagnose diabetes.

### Leakage Rationale
Including derived categories (obesity, prediabetes, dyslipidemia) or laboratory glucose markers directly models the diagnostic components of the target, leading to artificial high accuracy during training (leakage) and complete failure when deployed as a pre-laboratory screening tool in the community where glucose values are unknown.

## 3. Measurement Availability Requirements
- The screening tool must function when enhanced predictors (blood pressure) are missing by falling back to core features without using default value imputations. Missing measurements must remain missing.
