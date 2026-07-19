import unittest
import os
from fastapi.testclient import TestClient
from app.main import app

class TestDiabetesAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_synthetic_csv_absent(self):
        """Verify synthetic diabetes CSV is completely absent."""
        self.assertFalse(os.path.exists("health-intelligence/health-intelligence/data/diabetes_data.csv"))
        self.assertFalse(os.path.exists("health-intelligence/data/diabetes_data.csv"))

    def test_synthetic_generator_absent(self):
        """Verify synthetic data generator script is completely absent."""
        self.assertFalse(os.path.exists("health-intelligence/training/generate_synthetic_data.py"))

    def test_synthetic_model_artifact_absent(self):
        """Verify synthetic model and metadata artifacts are completely absent."""
        self.assertFalse(os.path.exists("health-intelligence/health-intelligence/models/diabetes_model.joblib"))
        self.assertFalse(os.path.exists("health-intelligence/models/diabetes_model.joblib"))
        self.assertFalse(os.path.exists("health-intelligence/health-intelligence/models/diabetes_model_metadata.json"))
        self.assertFalse(os.path.exists("health-intelligence/models/diabetes_model_metadata.json"))

    def test_service_starts_without_model(self):
        """Verify the service process starts up correctly without a model artifact."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["process"], "running")
        self.assertEqual(data["model_installed"], False)

    def test_ready_endpoint_reports_not_ready(self):
        """Verify ready endpoint reports not ready for inference with a stable reason code."""
        response = self.client.get("/ready")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["ready"], False)
        self.assertEqual(data["reason"], "APPROVED_MODEL_NOT_INSTALLED")

    def test_evaluation_returns_model_unavailable(self):
        """Verify evaluation returns model-unavailable with no score and no risk tier."""
        payload = {
            "userId": "test-user-123",
            "assessment": {
                "age": 35,
                "gender": "male",
                "heightCm": 175.0,
                "weightKg": 75.0,
                "smoking": "never",
                "exercise": "moderate",
                "familyHistory": "None",
                "symptoms": "None",
                "alcohol": "never",
                "sleepHours": 7.0,
                "systolicBP": 120.0,
                "diastolicBP": 80.0,
                "heartRate": 72.0,
                "fastingBloodSugar": 95.0,
                "schemaVersion": "2.0.0"
            },
            "labObservations": [],
            "regionalContext": {
                "language": "en",
                "preferredDietaryType": "vegetarian",
                "stateOrRegionCode": "IN",
                "customRegionalRules": [],
                "schemaVersion": "2.0.0"
            },
            "schemaVersion": "2.0.0"
        }
        
        response = self.client.post("/v1/modules/diabetes/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "model-unavailable")
        self.assertNotIn("score", data)
        self.assertNotIn("riskTier", data)
        self.assertIn("APPROVED_MODEL_NOT_INSTALLED", data.get("reasonCodes", []))

if __name__ == "__main__":
    unittest.main()
