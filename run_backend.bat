@echo off
title Smart Classroom - Backend API
echo Starting FastAPI Backend with YOLOv8...
cd /d "c:\aiml.project\backend"
call .venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
