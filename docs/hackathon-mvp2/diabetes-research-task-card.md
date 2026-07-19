# Research Task Card: Diabetes Risk Screening Prioritisation

## 1. Task Definition
- **Task**: Pre-laboratory screening prioritization.
- **Purpose**: Identifying individuals within a community who exhibit elevated screening metrics, indicating they should be prioritized for laboratory blood glucose testing (HbA1c or OGTT).
- **Prohibited Interpretations**:
  - **Not a diagnosis**: This task does not establish a clinical diagnosis of diabetes.
  - **Not future incidence prediction**: This is a cross-sectional screening task, not a longitudinal prediction of whether an individual will develop diabetes in the future.
  - **No individual probability claims**: This task does not produce a calibrated individual percentage chance of disease.

## 2. Intended Population & Scope
- **Intended Population**: Limited strictly to the audited demographic and regional characteristics represented in the local ICMR-INDIAB cohort sample.
- **External Validation**: Currently unavailable. The classification results cannot be generalized to outside populations without further validation.
- **Lifecycle Status**: `RESEARCH_ONLY`.

## 3. Evaluation Design
- **Target Outcome**: `v36` (`diabetes_composite`).
- **Feature Decoupling**: Models must rely strictly on non-invasive demographic and physiological measurements (features v4, v8, v9, v10, v11, v5) as defined in the feature policy.
