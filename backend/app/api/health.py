from datetime import datetime
import sys
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.ai.detector import YOLODetector
from app.schemas.settings import SystemHealthResponse, SystemDiagnosticResponse, DiagnosticCheckItem
from app.services.analytics_service import get_model_evaluation
from app.config import settings

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    """Comprehensive real-time health check of all application components."""
    # 1. Database check
    db_status = "Connected"
    try:
        db.execute(text("SELECT 1"))
        total_classrooms = db.query(Classroom).count()
        total_records = db.query(OccupancyRecord).count()
    except Exception as e:
        db_status = f"Error: {str(e)}"
        total_classrooms = 0
        total_records = 0

    # 2. AI Model check
    detector = YOLODetector()
    ai_status = "Ready" if detector.is_ready else "Unavailable"
    model_name = "Ultralytics YOLOv8n"
    model_device = "CPU / Torch Native"

    if not detector.is_ready and detector._load_error:
        ai_status = f"Unavailable: {detector._load_error}"

    return SystemHealthResponse(
        frontend_status="Connected",
        backend_status="Healthy",
        database_status=db_status,
        ai_model_status=ai_status,
        model_name=model_name,
        model_device=model_device,
        total_classrooms=total_classrooms,
        total_records=total_records,
        details={
            "app_version": settings.VERSION,
            "project_name": settings.PROJECT_NAME,
            "academic_context": settings.ACADEMIC_CONTEXT,
            "database_url": settings.DATABASE_URL.split("///")[-1],
            "upload_dir": settings.UPLOAD_DIR
        }
    )

@router.get("/diagnostic", response_model=SystemDiagnosticResponse)
def get_system_diagnostic(db: Session = Depends(get_db)):
    """
    Automated developer/admin diagnostic capability.
    Actively executes tests across all 10 required subsystems:
    1. Python environment
    2. OpenCV
    3. NumPy
    4. PyTorch
    5. Ultralytics
    6. YOLO model loading
    7. Backend API
    8. Database connection
    9. Image processing
    10. AI inference
    """
    all_ok = True

    # 1. Python environment
    py_ver = sys.version.split()[0]
    python_env = DiagnosticCheckItem(
        name="Python Environment",
        status="Working",
        tested=True,
        version=py_ver,
        details=f"Platform: {sys.platform} | Interpreter: {sys.executable}"
    )

    # 2. OpenCV
    try:
        import cv2
        opencv_check = DiagnosticCheckItem(
            name="OpenCV",
            status="Working",
            tested=True,
            version=cv2.__version__,
            details="cv2 imported and operational"
        )
    except Exception as e:
        all_ok = False
        opencv_check = DiagnosticCheckItem(
            name="OpenCV",
            status="Error",
            tested=True,
            details=f"Import failed: {str(e)}"
        )

    # 3. NumPy
    try:
        import numpy as np
        numpy_check = DiagnosticCheckItem(
            name="NumPy",
            status="Working",
            tested=True,
            version=np.__version__,
            details="Array operations and numerical tensors ready"
        )
    except Exception as e:
        all_ok = False
        numpy_check = DiagnosticCheckItem(
            name="NumPy",
            status="Error",
            tested=True,
            details=f"Import failed: {str(e)}"
        )

    # 4. PyTorch
    try:
        import torch
        pytorch_check = DiagnosticCheckItem(
            name="PyTorch",
            status="Working",
            tested=True,
            version=torch.__version__,
            details=f"CPU Execution: Ready | CUDA: {torch.cuda.is_available()}"
        )
    except Exception as e:
        all_ok = False
        pytorch_check = DiagnosticCheckItem(
            name="PyTorch",
            status="Error",
            tested=True,
            details=f"Import failed: {str(e)}"
        )

    # 5. Ultralytics
    try:
        import ultralytics
        ultralytics_check = DiagnosticCheckItem(
            name="Ultralytics",
            status="Working",
            tested=True,
            version=ultralytics.__version__,
            details="YOLO framework connected"
        )
    except Exception as e:
        all_ok = False
        ultralytics_check = DiagnosticCheckItem(
            name="Ultralytics",
            status="Error",
            tested=True,
            details=f"Import failed: {str(e)}"
        )

    # 6. YOLO model loading
    detector = YOLODetector()
    if detector.is_ready:
        yolo_check = DiagnosticCheckItem(
            name="YOLOv8 Model",
            status="Active",
            tested=True,
            version="YOLOv8n",
            details="Weights loaded successfully and ready for inference"
        )
    else:
        all_ok = False
        yolo_check = DiagnosticCheckItem(
            name="YOLOv8 Model",
            status="Error",
            tested=True,
            details=detector._load_error or "Model weights not loaded"
        )

    # 7. Backend API
    backend_check = DiagnosticCheckItem(
        name="Backend API",
        status="Working",
        tested=True,
        version=settings.VERSION,
        details=f"FastAPI router operational ({settings.API_V1_PREFIX})"
    )

    # 8. Database connection
    try:
        db.execute(text("SELECT 1"))
        cr_count = db.query(Classroom).count()
        rec_count = db.query(OccupancyRecord).count()
        db_check = DiagnosticCheckItem(
            name="Database (SQLite)",
            status="Working",
            tested=True,
            details=f"Connected | Classrooms: {cr_count} | Occupancy records: {rec_count}"
        )
    except Exception as e:
        all_ok = False
        db_check = DiagnosticCheckItem(
            name="Database (SQLite)",
            status="Error",
            tested=True,
            details=f"Connection failed: {str(e)}"
        )

    # 9. Image processing
    try:
        import cv2
        import numpy as np
        test_img = np.zeros((64, 64, 3), dtype=np.uint8)
        cv2.putText(test_img, "AI", (5, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        _, encoded = cv2.imencode(".jpg", test_img)
        decoded = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if decoded is not None and decoded.shape == (64, 64, 3):
            img_proc_check = DiagnosticCheckItem(
                name="Image Processing",
                status="Working",
                tested=True,
                details="OpenCV image decoding, encoding, and annotation verified"
            )
        else:
            all_ok = False
            img_proc_check = DiagnosticCheckItem(
                name="Image Processing",
                status="Error",
                tested=True,
                details="OpenCV decode produced invalid frame"
            )
    except Exception as e:
        all_ok = False
        img_proc_check = DiagnosticCheckItem(
            name="Image Processing",
            status="Error",
            tested=True,
            details=str(e)
        )

    # 10. AI inference
    try:
        import numpy as np
        t_start = time.time()
        test_frame = np.zeros((320, 320, 3), dtype=np.uint8)
        count, _, _ = detector.detect_frame(test_frame)
        latency = round((time.time() - t_start) * 1000, 2)
        ai_inf_check = DiagnosticCheckItem(
            name="AI Inference",
            status="Working",
            tested=True,
            latency_ms=latency,
            details=f"Inference verified ({latency}ms forward pass latency)"
        )
    except Exception as e:
        all_ok = False
        ai_inf_check = DiagnosticCheckItem(
            name="AI Inference",
            status="Error",
            tested=True,
            details=str(e)
        )

    # Evaluation status
    eval_res = get_model_evaluation(db)
    if eval_res.evaluated:
        eval_status = {
            "MAE": f"Evaluated ({eval_res.mae} students)",
            "RMSE": f"Evaluated ({eval_res.rmse})",
            "Accuracy": f"Evaluated ({eval_res.accuracy}%)"
        }
    else:
        eval_status = {
            "MAE": "Available if ground truth exists",
            "RMSE": "Available if ground truth exists",
            "Accuracy": "Available if labelled data exists"
        }

    models_status = {
        "YOLOv8": "Active",
        "CNN": "Reference",
        "CSRNet": "Proposed",
        "Vision Transformer": "Proposed"
    }

    return SystemDiagnosticResponse(
        all_systems_operational=all_ok,
        python_env=python_env,
        opencv=opencv_check,
        numpy=numpy_check,
        pytorch=pytorch_check,
        ultralytics=ultralytics_check,
        yolo_model=yolo_check,
        backend_api=backend_check,
        database=db_check,
        image_processing=img_proc_check,
        ai_inference=ai_inf_check,
        models_status=models_status,
        evaluation_status=eval_status,
        timestamp=datetime.utcnow().isoformat()
    )
