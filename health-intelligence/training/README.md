# HealthGuard AI - Model Training Directory

The previous synthetic data generator (`generate_synthetic_data.py`) and synthetic model training pipeline (`train.py`) have been removed as part of the model security and cleanup phase.

The approved, real-data clinical model training pipeline will be added in a later development phase. 

## Design Requirements for Future Pipeline:
- **No Synthetic Data**: The training script must not generate or contain any synthetic patient profiles.
- **External Dataset Path**: The pipeline must accept an explicit, external path to a validated clinical dataset as an input argument (e.g. via `--data-path` or environment variables), rather than using a hardcoded or tracked local CSV path.
