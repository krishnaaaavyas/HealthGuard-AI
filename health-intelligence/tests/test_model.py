import unittest
import os
import json
import joblib
import numpy as np
import pandas as pd

class TestDiabetesModel(unittest.TestCase):
    MODEL_PATH = "health-intelligence/models/diabetes_model.joblib"
    METADATA_PATH = "health-intelligence/models/diabetes_model_metadata.json"

    def test_model_files_exist(self):
        """Verify model and metadata files are serialized successfully."""
        self.assertTrue(os.path.exists(self.MODEL_PATH), "Model joblib file does not exist.")
        self.assertTrue(os.path.exists(self.METADATA_PATH), "Model metadata JSON file does not exist.")

    def test_model_loading_and_type(self):
        """Verify that model loads and has correct type/methods."""
        model = joblib.load(self.MODEL_PATH)
        self.assertIsNotNone(model)
        self.assertTrue(hasattr(model, "predict_proba"), "Model does not implement predict_proba.")

    def test_metadata_contents(self):
        """Verify metadata fields are present and valid."""
        with open(self.METADATA_PATH, "r") as f:
            meta = json.load(f)
        self.assertEqual(meta["model_version"], "2.0.0")
        self.assertIn("classification_threshold", meta)
        self.assertIn("feature_coefficients", meta)
        self.assertIn("features", meta)

    def test_prediction_output_calibration(self):
        """Verify model predictions are between 0 and 1."""
        model = joblib.load(self.MODEL_PATH)
        
        # Build normal fixture profile
        normal_fixture = pd.DataFrame([{
            "age": 30,
            "gender": 0,
            "heightCm": 170.0,
            "weightKg": 70.0,
            "bmi": 24.22,
            "smoking": 0,
            "exercise": 3,
            "systolicBP": 120.0,
            "diastolicBP": 80.0,
            "fastingBloodSugar": 85.0,
            "bloodSugarHbA1c": 5.0
        }])
        
        probs = model.predict_proba(normal_fixture)
        prob = probs[0][1]
        self.assertTrue(0.0 <= prob <= 1.0, f"Probability {prob} out of bounds.")
        self.assertLess(prob, 0.4, f"Normal profile yielded high probability: {prob}")

    def test_high_risk_prediction(self):
        """Verify high risk patient parameters result in elevated risk."""
        model = joblib.load(self.MODEL_PATH)
        with open(self.METADATA_PATH, "r") as f:
            meta = json.load(f)
        threshold = meta["classification_threshold"]

        high_risk_fixture = pd.DataFrame([{
            "age": 60,
            "gender": 1,
            "heightCm": 165.0,
            "weightKg": 95.0,
            "bmi": 34.9,
            "smoking": 2,
            "exercise": 0,
            "systolicBP": 160.0,
            "diastolicBP": 95.0,
            "fastingBloodSugar": 180.0,
            "bloodSugarHbA1c": 7.2
        }])

        prob = model.predict_proba(high_risk_fixture)[0][1]
        self.assertGreaterEqual(prob, threshold, f"High-risk profile probability {prob} is below threshold {threshold}")

    def test_missing_input_imputation(self):
        """Verify that NaN inputs are processed via SimpleImputer without crashing."""
        model = joblib.load(self.MODEL_PATH)
        
        # Test fixture with missing bloodSugarHbA1c and fastingBloodSugar
        missing_fixture = pd.DataFrame([{
            "age": 35,
            "gender": 0,
            "heightCm": 175.0,
            "weightKg": 75.0,
            "bmi": 24.5,
            "smoking": 0,
            "exercise": 2,
            "systolicBP": 120.0,
            "diastolicBP": 80.0,
            "fastingBloodSugar": np.nan,
            "bloodSugarHbA1c": np.nan
        }])
        
        try:
            prob = model.predict_proba(missing_fixture)[0][1]
            self.assertTrue(0.0 <= prob <= 1.0)
        except Exception as e:
            self.fail(f"Prediction crashed on missing inputs: {e}")

if __name__ == "__main__":
    unittest.main()
