import json
from pathlib import Path
import joblib
import pandas as pd
from training.feature_engineering import FEATURE_ORDER, LABEL_GROUPS, project_features, reverse_label_mapping
from training.train import load_dataset

ROOT = Path(__file__).resolve().parents[1]

def test_dataset_loader_and_required_target():
    prepared, stats = load_dataset()
    assert len(prepared) == stats["rows_used"]
    assert "category" in prepared

def test_required_features_and_order_are_stable():
    assert FEATURE_ORDER[0] == "fever"
    assert list(project_features(pd.DataFrame({column: [0] for columns in __import__('training.feature_engineering', fromlist=['FEATURE_SOURCES']).FEATURE_SOURCES.values() for column in columns})).columns) == FEATURE_ORDER

def test_missing_source_feature_is_rejected():
    try:
        project_features(pd.DataFrame({"fever": [1]}))
        assert False
    except ValueError as error:
        assert "missing required" in str(error)

def test_label_mapping_is_explicit_and_reversible():
    reverse = reverse_label_mapping()
    assert reverse["common cold"] == "viral_respiratory_illness"
    assert set(reverse.values()) == set(LABEL_GROUPS)

def test_projected_duplicates_are_removed():
    _, stats = load_dataset()
    assert stats["projected_duplicates_removed"] > 0

def test_model_metadata_and_metrics_are_generated():
    metadata = json.loads((ROOT / "models" / "metadata.json").read_text())
    metrics = json.loads((ROOT / "models" / "metrics.json").read_text())
    assert metadata["model_version"].startswith("ml-")
    assert metrics["selected_model_test_metrics"]["macro_f1"] >= 0

def test_model_artifact_contains_reproducible_feature_order():
    artifact = joblib.load(ROOT / "models" / "symptom_model.joblib")
    assert artifact["feature_order"] == FEATURE_ORDER
    assert artifact["model"].random_state == 42
