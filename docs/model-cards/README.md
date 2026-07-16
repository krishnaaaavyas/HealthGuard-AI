# Model Cards Directory

This directory contains specifications and performance cards for individual clinical prediction engines and machine learning classifiers integrated within the V2 platform.

## 1. Card Templates
Each integrated algorithm or API model should document:
- **Intended Use**: Primary preventive target population, out-of-scope usages.
- **Underlying Formulation**: Equations (e.g. Framingham General Cardiovascular Risk, Finnish Diabetes Risk FINDRISC) or neural architectures.
- **Evaluation Details**: Calibration data, validation metrics, demographic bounds.

## 2. Active Models
- **Diabetes Risk Engine (FINDRISC)**: Calculates type-2 diabetes risk based on BMI, age, activity level, and dietary habits.
- **Cardiovascular Risk Engine (Framingham)**: 30-year general cardiovascular event score.
- **Hypertension Estimator (Evidence-based Rules)**: Classifies vascular risk based on blood pressure measurements and lifestyle factors.
