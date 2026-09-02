from fastapi.testclient import TestClient
from app.inference import SymptomModel
from app.main import app
from app.schemas import PredictRequest

client = TestClient(app)

def payload(**changes):
    data = {"symptoms": {"fever": True, "headache": True, "weakness": True}, "severity": "MODERATE", "durationDays": 2, "temperature": 39.0}
    data.update(changes)
    return data

def test_health_reports_loaded_model():
    response = client.get("/health")
    assert response.status_code == 200 and response.json()["modelLoaded"] is True

def test_prediction_schema_and_top_n():
    body = client.post("/predict", json=payload()).json()
    assert body["assessmentMethod"] == "ML_MODEL"
    assert 1 <= len(body["predictions"]) <= 3
    assert "confirmedDiagnosis" not in body

def test_missing_features_are_treated_as_absent():
    request = PredictRequest(symptoms={"cough": True}, severity="MILD")
    assert SymptomModel().predict(request)["predictions"]

def test_temperature_adds_fever_feature_without_fabricating_other_vitals():
    result = SymptomModel().predict(PredictRequest(symptoms={}, severity="MODERATE", temperature=39.0))
    assert result["predictions"]

def test_low_confidence_contract_is_explicit():
    result = SymptomModel().predict(PredictRequest(symptoms={}, severity="MILD"))
    assert isinstance(result["lowConfidence"], bool)
    assert result["confidenceThreshold"] == 0.45

def test_invalid_vital_bounds_are_rejected():
    response = client.post("/predict", json=payload(oxygenSaturation=500))
    assert response.status_code == 422

def test_unknown_request_fields_are_rejected():
    response = client.post("/predict", json={**payload(), "patientId": "not-accepted"})
    assert response.status_code == 422
