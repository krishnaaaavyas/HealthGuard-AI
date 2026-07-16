import unittest
from fastapi.testclient import TestClient
import numpy as np
from app.main import app

class TestDiabetesAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "2.0.0")

    def test_ready_endpoint(self):
        response = self.client.get("/ready")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue("ready" in data)

    def test_models_endpoint(self):
        response = self.client.get("/models")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("active_models", data)
        self.assertIn("diabetes", data["active_models"])

    def test_evaluate_endpoint_success(self):
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
            "labObservations": [
                {
                    "code": "HbA1c",
                    "value": 5.4,
                    "unit": "%",
                    "observedAt": "2026-07-16T20:30:00Z",
                    "isVerified": True,
                    "verifiedBy": "Mock Lab"
                }
            ],
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
        self.assertEqual(data["moduleId"], "diabetes")
        self.assertEqual(data["moduleVersion"], "2.0.0")
        self.assertEqual(data["status"], "unavailable")
        self.assertTrue("score" in data)
        self.assertTrue("riskTier" in data)
        self.assertEqual(data["evidenceCompleteness"], 1.0)

    def test_evaluate_endpoint_lifestyle_only(self):
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
                "fastingBloodSugar": None,
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
        self.assertEqual(data["evidenceCompleteness"], 0.5)

if __name__ == "__main__":
    unittest.main()
