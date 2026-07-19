# HealthGuard AI - Health Intelligence Microservice

This service implements the version 2 (V2) metabolic risk assessment backend using FastAPI.

## Model Governance and Safeguard Guidelines

To ensure patient safety, data integrity, and compliance with clinical research standards, this repository strictly adheres to the following safeguards:

1. **Documented Real-World Datasets Only**: HealthGuard uses only documented, real-world clinical datasets for research-model development and validation.
2. **Prohibition of Synthetic Training Data**: Synthetic patient profiles or mock data may never be used to train models intended for user-facing risk screening.
3. **Restricted Use of Synthetic Fixtures**: Synthetic patient fixtures may only be used inside isolated unit/integration tests to verify endpoint routing or schema validation stability.
4. **Mandatory Documentation Cards**: Every integrated machine learning model or analytical algorithm requires a corresponding **dataset card** and **model card** detailing its training source, limitations, clinical bounds, and evaluation metrics.
5. **Explicit External Dataset Paths**: All training scripts and commands must accept an explicit external path argument to the clinical dataset rather than referencing tracked, local, or hardcoded project files.
6. **No Raw Datasets in Version Control**: Raw, restricted, or external patient-level clinical datasets must never be committed to Git.
7. **Lifecycle State Labeling**: Every model artifact or metadata description must be clearly labeled with its approved lifecycle status, such as `RESEARCH_ONLY` or `VALIDATION_CANDIDATE`.
8. **Missing Model Error Handling**: If an approved research model is not installed or loaded, endpoints must return a clean `model-unavailable` status and corresponding reason codes rather than returning fabricated risk scores or falling back silently to heuristics.
