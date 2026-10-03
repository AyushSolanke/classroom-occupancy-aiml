@echo off
title Smart Classroom Launcher
echo ====================================================
echo Starting Smart Classroom Occupancy System
echo ====================================================

echo [1/2] Launching Backend API (Port 8000)...
start "Smart Classroom - Backend API" cmd /k "cd /d c:\aiml.project\backend && .venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Frontend Dashboard (Port 5173)...
start "Smart Classroom - Frontend" cmd /k "cd /d c:\aiml.project\frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo Waiting for servers to initialize...
timeout /t 3 >nul

echo Opening browser at http://127.0.0.1:5173...
start http://127.0.0.1:5173

echo Done! Both servers are running in separate windows.
pause
