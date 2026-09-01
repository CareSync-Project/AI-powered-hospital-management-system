from pathlib import Path
import joblib
import numpy as np
from .preprocessing import prepare_input

MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "symptom_model.joblib"

class SymptomModel:
    def __init__(self, path=MODEL_PATH):
        artifact = joblib.load(path)
        self.model = artifact["model"]
        self.encoder = artifact["label_encoder"]
        self.features = artifact["feature_order"]
        self.departments = artifact["label_to_department"]
        self.version = artifact["model_version"]
        self.threshold = artifact["low_confidence_threshold"]

    def predict(self, payload, top_n=3):
        matrix = prepare_input(payload, self.features)
        scores = self.model.predict_proba(matrix)[0]
        ranked = np.argsort(scores)[::-1][:top_n]
        predictions = [{"condition": str(self.encoder.inverse_transform([index])[0]), "score": round(float(scores[index]), 6), "departmentCategory": self.departments[str(self.encoder.inverse_transform([index])[0])]} for index in ranked]
        low_confidence = not predictions or predictions[0]["score"] < self.threshold
        return {"assessmentMethod": "ML_MODEL", "modelVersion": self.version, "predictions": predictions, "lowConfidence": low_confidence, "confidenceThreshold": self.threshold, "message": "Symptoms are not specific enough for a reliable preliminary match." if low_confidence else None}
