import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_sample_weight
try:
    from .feature_engineering import FEATURE_ORDER, LABEL_TO_DEPARTMENT, project_features, reverse_label_mapping
except ImportError:
    from feature_engineering import FEATURE_ORDER, LABEL_TO_DEPARTMENT, project_features, reverse_label_mapping

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "Diseases_and_Symptoms_dataset.csv"
MODELS = ROOT / "models"
SEED = 42

def metrics_for(model, x, y, labels):
    prediction = model.predict(x)
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(y, prediction, average="macro", zero_division=0)
    precision_weighted, recall_weighted, f1_weighted, _ = precision_recall_fscore_support(y, prediction, average="weighted", zero_division=0)
    return {
        "accuracy": accuracy_score(y, prediction),
        "macro_precision": precision_macro,
        "macro_recall": recall_macro,
        "macro_f1": f1_macro,
        "weighted_precision": precision_weighted,
        "weighted_recall": recall_weighted,
        "weighted_f1": f1_weighted,
        "confusion_matrix": confusion_matrix(y, prediction, labels=range(len(labels))).tolist(),
        "classification_report": classification_report(y, prediction, target_names=labels, output_dict=True, zero_division=0),
    }

def load_dataset(path=DATASET):
    frame = pd.read_csv(path)
    if "diseases" not in frame.columns:
        raise ValueError("Dataset requires a diseases target column")
    source_rows = len(frame)
    reverse = reverse_label_mapping()
    selected = frame[frame["diseases"].isin(reverse)].copy()
    selected["category"] = selected["diseases"].map(reverse)
    features = project_features(selected)
    prepared = features.assign(category=selected["category"].values).drop_duplicates()
    return prepared, {"original_rows": source_rows, "selected_rows_before_projection_deduplication": len(selected), "rows_used": len(prepared), "missing_values_in_used_features": int(features.isna().sum().sum()), "projected_duplicates_removed": len(selected) - len(prepared)}

def train():
    MODELS.mkdir(parents=True, exist_ok=True)
    prepared, dataset_stats = load_dataset()
    encoder = LabelEncoder()
    x = prepared[FEATURE_ORDER]
    y = encoder.fit_transform(prepared["category"])
    x_train, x_temp, y_train, y_temp = train_test_split(x, y, test_size=0.30, random_state=SEED, stratify=y)
    x_validation, x_test, y_validation, y_test = train_test_split(x_temp, y_temp, test_size=0.50, random_state=SEED, stratify=y_temp)
    candidates = {
        "logistic_regression": LogisticRegression(max_iter=2500, class_weight="balanced", random_state=SEED),
        "random_forest": RandomForestClassifier(n_estimators=300, max_depth=18, min_samples_leaf=2, class_weight="balanced_subsample", random_state=SEED, n_jobs=-1),
        "gradient_boosting": GradientBoostingClassifier(n_estimators=150, max_depth=3, random_state=SEED),
    }
    validation = {}
    for name, model in candidates.items():
        weights = compute_sample_weight("balanced", y_train) if name == "gradient_boosting" else None
        model.fit(x_train, y_train, **({"sample_weight": weights} if weights is not None else {}))
        validation[name] = metrics_for(model, x_validation, y_validation, list(encoder.classes_))
    selected_name = max(validation, key=lambda name: (validation[name]["macro_f1"], validation[name]["weighted_f1"]))
    selected_model = candidates[selected_name]
    final_x = pd.concat([x_train, x_validation], ignore_index=True)
    final_y = np.concatenate([y_train, y_validation])
    final_weights = compute_sample_weight("balanced", final_y) if selected_name == "gradient_boosting" else None
    selected_model.fit(final_x, final_y, **({"sample_weight": final_weights} if final_weights is not None else {}))
    model_version = {"logistic_regression": "ml-logreg-v1.0", "random_forest": "ml-rf-v1.0", "gradient_boosting": "ml-gb-v1.0"}[selected_name]
    test_metrics = metrics_for(selected_model, x_test, y_test, list(encoder.classes_))
    artifact = {"model": selected_model, "label_encoder": encoder, "feature_order": FEATURE_ORDER, "label_to_department": LABEL_TO_DEPARTMENT, "model_version": model_version, "selected_model": selected_name, "low_confidence_threshold": 0.45}
    joblib.dump(artifact, MODELS / "symptom_model.joblib")
    metadata = {"model_version": model_version, "selected_model": selected_name, "random_seed": SEED, "split": {"train": len(x_train), "validation": len(x_validation), "test": len(x_test)}, "features": FEATURE_ORDER, "classes": list(encoder.classes_), "dataset": dataset_stats, "class_distribution": prepared["category"].value_counts().sort_index().to_dict(), "low_confidence_threshold": 0.45}
    (MODELS / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (MODELS / "metrics.json").write_text(json.dumps({"candidate_validation_metrics": validation, "selected_model_test_metrics": test_metrics}, indent=2), encoding="utf-8")
    print(json.dumps({"metadata": metadata, "test_metrics": test_metrics}, indent=2))

if __name__ == "__main__":
    train()
