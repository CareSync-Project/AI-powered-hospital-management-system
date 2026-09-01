from fastapi import FastAPI, HTTPException
from .inference import SymptomModel
from .schemas import PredictRequest, PredictResponse

app = FastAPI(title="CareSync Symptom Model", version="1.0.0")
model = None
load_error = None
try:
    model = SymptomModel()
except Exception as error:
    load_error = str(error)

@app.get("/health")
def health():
    return {"success": model is not None, "service": "CareSync symptom model", "modelLoaded": model is not None, "modelVersion": model.version if model else None}

@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is unavailable")
    return model.predict(payload)
