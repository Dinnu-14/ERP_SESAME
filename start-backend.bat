@echo off
title Sesame ERP Backend (Port 8000)
echo ========================================================
echo Starting Sesame Factory ^& SUFALA ERP Backend Server
echo Port: http://127.0.0.1:8000
echo Docs: http://127.0.0.1:8000/docs
echo ========================================================

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    echo Using backend\venv virtual environment...
    venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
) else if exist "..\.venv\Scripts\python.exe" (
    echo Using root .venv virtual environment...
    ..\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    echo Using system Python...
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)

pause
