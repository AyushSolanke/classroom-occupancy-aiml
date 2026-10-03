# Project 37: Smart Classroom Occupancy Detection

**Domain:** Computer Vision  
**Academic Context:** Applied Machine Learning for Industry Solutions (PECO311C)  
**Core Technologies:** Ultralytics YOLOv8, Python FastAPI, SQLite + SQLAlchemy, React 19 + Vite, Tailwind CSS, Recharts

---

## 1. Project Specifications & Requirements

### Problem Statement
Develop an AI-based occupancy monitoring system that counts students in classrooms using CCTV images and predicts occupancy levels for efficient classroom utilization and energy management.

### Core Objectives
1. **Count Occupants Automatically:** Real-time extraction of `person` class detections using YOLOv8 deep learning.
2. **Optimize Classroom Allocation:** Data-driven hall reallocation engine matching class size to appropriate venues.
3. **Improve Energy Savings:** Automated HVAC and lighting shutdown recommendations for vacant rooms with estimated kW and cost savings clearly labeled.
4. **Develop Occupancy Dashboard:** Real-time campus telemetry, live webcam stream, status distribution, and time-series utilization curves.

### Real-World Applications
- **Smart Campus:** Automated spatial auditing, bottleneck detection, and student density heatmaps.
- **Educational Institutions:** Optimized timetable scheduling, exam seat allotment, and lab capacity compliance.
- **Building Management:** Facility operations, emergency evacuation headcounts, and cleaning schedules.
- **Smart Energy Systems:** Occupancy-driven HVAC airflow modulation and automated lighting relays.

### Suggested Datasets & Research References
1. **Crowd Counting Dataset (Kaggle):** [https://www.kaggle.com/search?q=crowd+counting](https://www.kaggle.com/search?q=crowd+counting) *(Role: Research Reference & Baseline)*
2. **ShanghaiTech Dataset (GitHub):** [https://github.com/desenzhou/ShanghaiTechDataset](https://github.com/desenzhou/ShanghaiTechDataset) *(Role: Density Estimation Research Benchmark)*
- *Runtime Note:* The implemented active model (YOLOv8) utilizes pre-trained weights tuned on the MS COCO dataset (isolating class `0: person`), while the Kaggle and ShanghaiTech datasets serve as research and benchmark references.

### Input Features & Expected Outputs
- **Input Features Supported:** CCTV Images (JPG, PNG, WEBP), Video Frames (MP4, AVI, Live Webcam), Occupancy History (SQLite logs).
- **Expected Outputs Provided:** Occupancy Count (dynamic), Utilization Percentage (dynamic), Classroom Status (`EMPTY`, `LOW OCCUPANCY`, `MODERATE OCCUPANCY`, `FULL`).

### Recommended Machine Learning Models
- **Baseline:** CNN *(Status: Reference / Baseline Model)*
- **Intermediate:** YOLOv8 *(Status: Implemented / Active Model - Real-time student detection)*
- **Advanced:** CSRNet *(Status: Proposed / Research Model)*, Vision Transformer (ViT) *(Status: Proposed / Research Model)*

### Model Evaluation Metrics
- **Primary Metric:** MAE (Mean Absolute Error) between predicted student count and actual ground truth: $\text{MAE} = \frac{1}{n} \sum |y - \hat{y}|$.
- **Additional Metrics:**
  - **Accuracy:** Correct prediction rate within acceptable threshold: $\frac{\text{Correct}}{\text{Total}}$.
  - **RMSE:** Root Mean Square Error penalizing large counting outliers: $\sqrt{\frac{1}{n} \sum (y - \hat{y})^2}$.
- *Dynamic Evaluation:* The system includes a live evaluation engine (`/api/analytics/evaluation`). When ground-truth manual counts are logged, real MAE, RMSE, and Accuracy are dynamically computed and plotted. If no ground truth exists, the system truthfully displays *"Evaluation data unavailable for current model"* without fabricating numbers.

### Development Tools & Libraries
- **Programming Environment:** Google Colab, Jupyter Notebook *(Model Development & Research)*
- **Core Libraries (In Use):** OpenCV, NumPy, PyTorch, Ultralytics *(Active Runtime AI Engine)*
- **Visualization:** Recharts *(Web Runtime)*, Matplotlib, Seaborn *(Offline Analysis)*

---


## 2. System Architecture

```
smart-classroom-occupancy/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   └── detector.py         # Ultralytics YOLOv8 singleton & OpenCV visualizer
│   │   ├── api/
│   │   │   ├── analyze.py          # /api/analyze (image, video, live frame)
│   │   │   ├── classrooms.py       # /api/classrooms (CRUD operations)
│   │   │   ├── occupancy.py        # /api/occupancy (latest, history, manual, CSV export)
│   │   │   ├── analytics.py        # /api/analytics (KPIs, distribution, trends, insights)
│   │   │   ├── energy.py           # /api/energy (conservation recommendations & savings)
│   │   │   ├── settings.py         # /api/settings (thresholds & demo mode)
│   │   │   └── health.py           # /api/health (system health check)
│   │   ├── database/
│   │   │   ├── session.py          # SQLAlchemy session & SQLite engine
│   │   │   └── init_db.py          # Schema creation & initial hall seeding
│   │   ├── models/                 # SQLAlchemy ORM models (Classroom, OccupancyRecord, SystemSetting)
│   │   ├── schemas/                # Pydantic v2 validation models
│   │   ├── services/               # Business logic (Occupancy, Energy, Analytics)
│   │   ├── config.py               # Pydantic BaseSettings configuration
│   │   └── main.py                 # FastAPI application & middleware
│   ├── models/
│   │   └── yolov8n.pt              # YOLOv8 pre-trained weights
│   ├── uploads/                    # Stores uploaded media & annotated bounding-box images
│   ├── tests/
│   │   └── test_api.py             # Pytest automated test suite
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Sample environment configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # StatCard, StatusBadge, LoadingSpinner, EmptyState, Modal
│   │   │   ├── layout/             # Sidebar, TopHeader, Layout
│   │   │   └── ai/                 # BoundingBoxViewer (side-by-side & explainability)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Overview, KPIs, real-time grid, charts
│   │   │   ├── LiveMonitoring.jsx  # Live webcam stream with real-time inference
│   │   │   ├── ClassroomAnalysis.jsx# Photo & video upload inference workbench
│   │   │   ├── Classrooms.jsx      # Classroom management CRUD
│   │   │   ├── OccupancyHistory.jsx# Paginated audit log & CSV export
│   │   │   ├── Analytics.jsx       # Utilization curves & historical charts
│   │   │   ├── EnergyManagement.jsx# Energy recommendations & cost estimations
│   │   │   ├── AIInsights.jsx      # Timetable & scheduling recommendations
│   │   │   └── Settings.jsx        # Configurable thresholds, tariffs, demo mode
│   │   ├── services/
│   │   │   └── api.js              # Centralized Axios API service
│   │   ├── App.jsx                 # Master router
│   │   ├── main.jsx                # React DOM entrypoint
│   │   └── index.css               # Tailwind CSS & Inter typography
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── sample_classroom.jpg            # High-resolution sample classroom for testing
└── README.md
```

---

## 3. Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Lucide React, Axios |
| **Backend** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy ORM |
| **AI / Computer Vision** | Ultralytics YOLOv8, PyTorch, OpenCV, Pillow, NumPy |
| **Database** | SQLite (`smart_classroom.db`) with relational foreign keys |
| **Testing** | Pytest, FastAPI TestClient, Starlette HTTPX |

---

## 4. Installation & Windows Setup Guide

### Prerequisites
- Python 3.10+ (Anaconda or standard Python)
- Node.js v18+ & npm

### Step 1: Clone or Navigate to the Project Directory
Open **Windows PowerShell**:
```powershell
cd c:\aiml.project
```

### Step 2: Set Up Backend Virtual Environment
```powershell
cd c:\aiml.project\backend
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
python -m pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
```powershell
Copy-Item .env.example .env
```

### Step 4: Set Up Frontend
Open a second PowerShell terminal:
```powershell
cd c:\aiml.project\frontend
npm install
Copy-Item .env.example .env
```

---

## 5. Running the Application

### Start the FastAPI Backend:
In the first PowerShell terminal (with `.venv` activated):
```powershell
cd c:\aiml.project\backend
.venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API Base:** `http://127.0.0.1:8000`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/health`

### Start the React Frontend:
In the second PowerShell terminal:
```powershell
cd c:\aiml.project\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- **Frontend Dashboard:** `http://127.0.0.1:5173`

---

## 6. How to Test the Project for Lab Evaluation

1. **Verify Dashboard:**
   - Open `http://127.0.0.1:5173` in any modern web browser.
   - Observe the initial 5 seeded lecture halls (`Lecture Hall 101 - CS Block`, `Seminar Room 204`, `AI Lab 302`, etc.).
   - Notice the real KPI metrics calculated dynamically from database records.

2. **Upload a Classroom Photo for AI Detection:**
   - Navigate to **"Upload & Analyze"** from the sidebar.
   - Select `sample_classroom.jpg` located in `c:\aiml.project\sample_classroom.jpg`.
   - Select target classroom: `Lecture Hall 101 - CS Block`.
   - Click **"Execute AI Detection"**.
   - Watch the YOLOv8 model execute person detection. The side-by-side view will show the original photo and the AI visualization with green bounding boxes around students, along with individual confidence scores and detection coordinates.

3. **Live Camera Monitoring:**
   - Navigate to **"Live Monitoring"**.
   - Click **"Start Camera"** and allow browser camera permissions.
   - The system extracts canvas frames every 2 seconds, runs YOLO inference, and provides live occupancy counts and status badges.

4. **Classroom Management:**
   - Navigate to **"Classrooms"**.
   - Click **"Add Classroom"** to create a custom hall with your preferred capacity, building, and room number.

5. **Occupancy History & CSV Audit:**
   - Navigate to **"Occupancy History"** to inspect all logged sessions with date/time stamps, student counts, and detection sources.
   - Click **"Export CSV"** to download the audited log.

6. **Energy Management:**
   - Navigate to **"Energy Management"** to see automated HVAC and lighting shutdown recommendations generated dynamically from occupancy status.

7. **Configuring Thresholds in Settings:**
   - Navigate to **"Settings"** to adjust Low/Moderate/Full occupancy percentage thresholds, AI confidence sliders, or electrical tariff assumptions.
   - Toggle **Demo Mode** if you wish to generate clearly flagged `DEMO DATA` records for presentation purposes without altering production data.

---

## 7. Running Backend Automated Tests

To run the complete automated test suite:
```powershell
cd c:\aiml.project\backend
.venv\Scripts\activate
pytest tests/test_api.py -v
```
All 8 test suites (Classroom CRUD, Occupancy Logic, AI Image Inference, KPI Calculations, Energy Recommendations, and Health Endpoints) pass with 100% success.

---

## 8. License & Attribution
Developed for **Applied Machine Learning for Industry Solutions (PECO311C)**. Built with Ultralytics YOLOv8 and FastAPI.
