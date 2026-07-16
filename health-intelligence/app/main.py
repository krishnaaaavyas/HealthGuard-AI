from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import joblib
import json
import os
import numpy as np
import pandas as pd

app = FastAPI(title="HealthGuard AI - Health Intelligence Service", version="2.0.0")

# Global variables to store loaded models and metadata
diabetes_model = None
model_metadata = None

MODEL_PATH = "health-intelligence/models/diabetes_model.joblib"
METADATA_PATH = "health-intelligence/models/diabetes_model_metadata.json"

def load_models():
    global diabetes_model, model_metadata
    if os.path.exists(MODEL_PATH):
        try:
            diabetes_model = joblib.load(MODEL_PATH)
            print(f"Loaded diabetes classifier from {MODEL_PATH}")
        except Exception as e:
            print(f"Error loading model: {e}")
    
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                model_metadata = json.load(f)
            print(f"Loaded model metadata from {METADATA_PATH}")
        except Exception as e:
            print(f"Error loading metadata: {e}")

@app.on_event("startup")
def startup_event():
    load_models()

class Assessment(BaseModel):
    age: int
    gender: str
    heightCm: float
    weightKg: float
    smoking: str
    exercise: str
    familyHistory: str = ""
    symptoms: str = ""
    alcohol: str = "never"
    sleepHours: float = 7.0
    systolicBP: float = 120.0
    diastolicBP: float = 80.0
    heartRate: float = 72.0
    fastingBloodSugar: Optional[float] = None
    schemaVersion: str = "2.0.0"

class LabObservation(BaseModel):
    code: str
    value: float
    unit: str
    observedAt: str
    isVerified: bool = False
    verifiedBy: Optional[str] = None

class RegionalContext(BaseModel):
    language: str = "en"
    preferredDietaryType: str = "vegetarian"
    stateOrRegionCode: str = "IN"
    customRegionalRules: List[str] = []
    schemaVersion: str = "2.0.0"

class HealthContext(BaseModel):
    userId: str
    assessment: Assessment
    labObservations: List[LabObservation] = []
    regionalContext: RegionalContext
    schemaVersion: str = "2.0.0"

@app.get("/health")
def get_health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "service": "health-intelligence"
    }

@app.get("/ready")
def get_ready():
    # Attempt lazy loading on check if needed
    if diabetes_model is None:
        load_models()
    return {
        "status": "ok",
        "ready": diabetes_model is not None
    }

@app.get("/models")
def get_models():
    return {
        "active_models": {
            "diabetes": model_metadata if model_metadata else {"status": "unloaded"}
        }
    }

@app.post("/v1/modules/diabetes/evaluate")
def evaluate_diabetes(context: HealthContext):
    global diabetes_model, model_metadata
    
    if diabetes_model is None:
        load_models()
        if diabetes_model is None:
            raise HTTPException(status_code=503, detail="Diabetes model is currently not loaded on server.")

    assessment = context.assessment
    lab_observations = context.labObservations

    # Check HbA1c in lab observations
    hba1c_val = None
    for obs in lab_observations:
        if obs.code == "HbA1c" and obs.value is not None:
            hba1c_val = obs.value

    # Check Fasting blood sugar in lab observations or fallback to assessment
    fbs_val = assessment.fastingBloodSugar
    for obs in lab_observations:
        if obs.code == "fastingBloodSugar" and obs.value is not None:
            fbs_val = obs.value

    # Compute derived features
    bmi = assessment.weightKg / ((assessment.heightCm / 100.0) ** 2) if assessment.heightCm > 0 else np.nan

    gender_map = {"male": 0, "female": 1, "other": 2}
    smoking_map = {"never": 0, "former": 1, "current": 2}
    exercise_map = {"none": 0, "light": 1, "moderate": 2, "active": 3}

    gender_code = gender_map.get(assessment.gender, 0)
    smoking_code = smoking_map.get(assessment.smoking, 0)
    exercise_code = exercise_map.get(assessment.exercise, 0)

    # Setup feature dataframe matching the preprocessor pipelines
    features_df = pd.DataFrame([{
        "age": assessment.age,
        "gender": gender_code,
        "heightCm": assessment.heightCm,
        "weightKg": assessment.weightKg,
        "bmi": bmi,
        "smoking": smoking_code,
        "exercise": exercise_code,
        "systolicBP": assessment.systolicBP,
        "diastolicBP": assessment.diastolicBP,
        "fastingBloodSugar": fbs_val if fbs_val is not None else np.nan,
        "bloodSugarHbA1c": hba1c_val if hba1c_val is not None else np.nan
    }])

    try:
        prob = float(diabetes_model.predict_proba(features_df)[0][1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction execution failed: {e}")

    threshold = model_metadata.get("classification_threshold", 0.5) if model_metadata else 0.5
    
    if prob >= threshold:
        risk_tier = "elevated"
    elif prob >= (threshold * 0.5):
        risk_tier = "moderate"
    else:
        risk_tier = "lower"

    # Evidence Completeness Mapping
    if not assessment.age or not assessment.heightCm or not assessment.weightKg:
        evidence_completeness = 0.0
        confidence = "insufficient"
    elif hba1c_val is not None:
        evidence_completeness = 1.0
        confidence = "strongly-supported"
    elif fbs_val is not None:
        evidence_completeness = 0.75
        confidence = "moderately-supported"
    else:
        evidence_completeness = 0.5
        confidence = "preliminary"

    # Deterministic Explainability Factors
    top_contributors = []
    protective_factors = []

    if fbs_val is not None and fbs_val > 100:
        top_contributors.append({
            "factorId": "fastingBloodSugar",
            "name": "Fasting Blood Sugar",
            "impactValue": round(30.0 if fbs_val > 126 else 15.0, 1),
            "description": f"Fasting blood glucose is elevated at {fbs_val} mg/dL."
        })
    if hba1c_val is not None and hba1c_val >= 5.7:
        top_contributors.append({
            "factorId": "bloodSugarHbA1c",
            "name": "HbA1c Level",
            "impactValue": round(40.0 if hba1c_val >= 6.5 else 20.0, 1),
            "description": f"HbA1c level is in the pre-diabetic or diabetic range at {hba1c_val}%."
        })
    if bmi is not None and bmi > 25.0:
        top_contributors.append({
            "factorId": "bmi",
            "name": "Body Mass Index",
            "impactValue": round(15.0 if bmi > 30.0 else 8.0, 1),
            "description": f"BMI is elevated at {round(bmi, 1)} kg/m²."
        })
    if assessment.age > 45:
        top_contributors.append({
            "factorId": "age",
            "name": "Age Factor",
            "impactValue": 10.0,
            "description": f"Age is {assessment.age} years (risk elevates above 45)."
        })

    if assessment.exercise in ["moderate", "active"]:
        protective_factors.append({
            "factorId": "exercise",
            "name": "Physical Activity",
            "impactValue": -15.0,
            "description": f"Regular '{assessment.exercise}' exercise aids insulin sensitivity."
        })
    if bmi is not None and bmi < 23.0:
        protective_factors.append({
            "factorId": "bmi",
            "name": "Healthy BMI",
            "impactValue": -10.0,
            "description": f"BMI of {round(bmi, 1)} kg/m² is within the healthy weight range."
        })

    missing_inputs = []
    if fbs_val is None:
        missing_inputs.append("fastingBloodSugar")
    if hba1c_val is None:
        missing_inputs.append("bloodSugarHbA1c")

    safety_flags = []
    if fbs_val is not None and (fbs_val >= 250 or fbs_val <= 50):
        safety_flags.append({
            "flagType": "red-flag",
            "moduleId": "diabetes",
            "message": f"Critical blood sugar level: {fbs_val} mg/dL detected. Immediate consult advised.",
            "clinicalActionRequired": True
        })

    recommended_actions = []
    if prob >= threshold:
        recommended_actions.append("Schedule a consultation with an endocrinologist.")
        recommended_actions.append("Adopt a low-glycemic, high-fiber dietary pattern.")
    else:
        recommended_actions.append("Maintain active exercise routines and balanced nutrition.")

    return {
        "moduleId": "diabetes",
        "moduleVersion": "2.0.0",
        "resultType": "risk-tier",
        "status": "unavailable",
        "score": round(prob * 100, 1),
        "riskTier": risk_tier,
        "evidenceCompleteness": evidence_completeness,
        "confidenceLevel": confidence,
        "topContributors": top_contributors,
        "protectiveFactors": protective_factors,
        "missingInputs": missing_inputs,
        "recommendedActions": recommended_actions,
        "recommendedTests": [],
        "safetyFlags": safety_flags
    }
