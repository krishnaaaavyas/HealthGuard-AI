# Dataset Card: Diabetes Risk Screening (V2 Research)

## 1. Current State
- **Previous Prototype**: The previous synthetic prototype training dataset (`diabetes_data.csv`) and model classifier have been completely removed.
- **Model Status**: No approved research model is currently installed. The FastAPI screening endpoints return `model-unavailable` status.
- **Proposed Next Model**: The proposed next-phase classifier model will be trained using an authentic **ICMR-INDIAB sample**.

## 2. Intended Use and Task
- **Intended Task**: Research-only pre-laboratory screening prioritization (identifying individuals for recommended laboratory HbA1c tests).
- **Prohibited Use**: Real-world clinical diagnosis, prescription, or clinical decision support without licensed physician oversight.

## 3. Dataset Characteristics & Limitations
- **Size and Scope**: The authentic research sample is small and regionally limited to specific cohorts.
- **Validation**: External validation data is currently unavailable.
- **No Claims**: No clinical efficacy, safety, diagnostic accuracy, or national population representativeness claims are made or allowed.
