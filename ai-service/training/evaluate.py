import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
metrics = json.loads((ROOT / "models" / "metrics.json").read_text(encoding="utf-8"))
metadata = json.loads((ROOT / "models" / "metadata.json").read_text(encoding="utf-8"))
print(json.dumps({"model": metadata["selected_model"], "version": metadata["model_version"], "test": metrics["selected_model_test_metrics"]}, indent=2))
