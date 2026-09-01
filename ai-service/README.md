# CareSync AI Service

This isolated FastAPI process loads the trained symptom classifier once and exposes `/health` and `/predict`. It is not a second hospital backend: it has no PostgreSQL credentials, authentication, cards, appointments, or clinical-write access. React never calls it directly.

```powershell
python -m pip install -r requirements.txt
python training/train.py
python -m pytest
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The Node API performs authentication, red-flag screening, safe fallback, department resolution, persistence, auditing, and response serialization.
