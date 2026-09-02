from typing import Dict, Optional
from pydantic import BaseModel, ConfigDict, Field

class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    symptoms: Dict[str, bool]
    severity: str = Field(pattern="^(MILD|MODERATE|SEVERE)$")
    durationDays: Optional[int] = Field(default=None, ge=0, le=365)
    temperature: Optional[float] = Field(default=None, ge=25, le=45)
    heartRate: Optional[float] = Field(default=None, ge=1, le=350)
    oxygenSaturation: Optional[float] = Field(default=None, ge=0, le=100)

class Prediction(BaseModel):
    condition: str
    score: float
    departmentCategory: str

class PredictResponse(BaseModel):
    assessmentMethod: str
    modelVersion: str
    predictions: list[Prediction]
    lowConfidence: bool
    confidenceThreshold: float
    message: Optional[str] = None
