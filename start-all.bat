@echo off
title Sesame ERP - Dev Launcher
echo ========================================================
echo Starting Sesame Factory ^& SUFALA ERP (Full Stack)
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ========================================================

start "Sesame ERP Backend" cmd /c "%~dp0start-backend.bat"

echo Launching Frontend...
cd /d "%~dp0frontend"
npm run dev
