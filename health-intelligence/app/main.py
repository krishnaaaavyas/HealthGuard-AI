from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="HealthGuard AI - Health Intelligence Service", version="2.0.0")

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
        "service": "health-intelligence",
        "process": "running",
        "model_installed": False,
        "message": "Service process is running. No approved research model is installed."
    }

@app.get("/ready")
def get_ready():
    return {
        "status": "ok",
        "ready": False,
        "reason": "APPROVED_MODEL_NOT_INSTALLED",
        "reasonCode": "APPROVED_MODEL_NOT_INSTALLED"
    }

@app.get("/models")
def get_models():
    return {
        "active_models": {
            "diabetes": {"status": "unloaded"}
        }
    }

@app.post("/v1/modules/diabetes/evaluate")
def evaluate_diabetes(context: HealthContext):
    return {
        "moduleId": "diabetes-screening",
        "moduleVersion": "unassigned",
        "status": "model-unavailable",
        "resultType": "screening-signal",
        "source": "research-model",
        "evidenceSupport": "insufficient",
        "reasonCodes": ["APPROVED_MODEL_NOT_INSTALLED"],
        "usedEvidence": [],
        "missingEvidence": [],
        "limitations": [
            "NO_APPROVED_MODEL_ARTIFACT",
            "RESEARCH_PIPELINE_PENDING"
        ],
        "nextSteps": [
            "CONTINUE_WITH_NON_ML_EVIDENCE_MODULES"
        ]
    }
