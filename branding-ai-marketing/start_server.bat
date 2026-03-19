@echo off
echo Starting API Server...
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
pause
