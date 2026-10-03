import os
import json
import uuid
import tempfile
import base64
import cv2
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.config import settings
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.ai.detector import YOLODetector
from app.services.occupancy_service import calculate_occupancy_and_status
from app.schemas.occupancy import OccupancyRecordResponse

router = APIRouter(prefix="/analyze", tags=["AI Analysis"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".webm", ".mkv"}

@router.post("/image")
async def analyze_image(
    file: UploadFile = File(...),
    classroom_id: int = Form(...),
    save_record: bool = Form(True),
    confidence_threshold: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload a classroom photo, execute YOLOv8 person detection,
    compute occupancy statistics, and store result in database.
    """
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id, Classroom.is_active == True).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom with ID {classroom_id} not found."
        )

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds limit of {settings.MAX_IMAGE_SIZE_MB}MB."
        )

    detector = YOLODetector()
    if not detector.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model could not be loaded."
        )

    try:
        detection_result = detector.detect_image(
            content,
            confidence_threshold=confidence_threshold
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image/video processing is currently unavailable."
        )

    person_count = detection_result["person_count"]
    capacity = classroom.capacity

    # Compute occupancy & status
    occupancy_pct, room_status = calculate_occupancy_and_status(person_count, capacity, db)

    # Save original and annotated image to disk
    file_id = f"{uuid.uuid4().hex[:12]}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    saved_annotated_name = f"annotated_{file_id}.jpg"
    saved_annotated_path = os.path.join(settings.UPLOAD_DIR, saved_annotated_name)

    with open(saved_annotated_path, "wb") as f:
        f.write(detection_result["raw_annotated_bytes"])

    # Optionally persist in database
    record_id = None
    if save_record:
        record = OccupancyRecord(
            classroom_id=classroom.id,
            detected_count=person_count,
            capacity=capacity,
            occupancy_percentage=occupancy_pct,
            status=room_status,
            source="IMAGE",
            confidence_avg=detection_result["confidence_avg"],
            detections_json=json.dumps(detection_result["detections"]),
            image_path=f"/uploads/{saved_annotated_name}",
            timestamp=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        record_id = record.id

    return {
        "record_id": record_id,
        "classroom_id": classroom.id,
        "classroom_name": classroom.name,
        "capacity": capacity,
        "detected_students": person_count,
        "occupancy_percentage": occupancy_pct,
        "status": room_status,
        "confidence_avg": detection_result["confidence_avg"],
        "confidence_threshold": detection_result["confidence_threshold"],
        "inference_time_ms": detection_result["inference_time_ms"],
        "model_used": detection_result["model_used"],
        "detections": detection_result["detections"],
        "annotated_image_url": f"/uploads/{saved_annotated_name}",
        "annotated_image_base64": detection_result["annotated_base64"],
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/frame")
async def analyze_frame(
    classroom_id: int = Form(...),
    frame: UploadFile = File(...),
    save_record: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    High-frequency inference endpoint for live camera monitoring.
    Receives frame from browser web-cam or stream, runs inference,
    and returns real-time occupancy counts.
    """
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id, Classroom.is_active == True).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    content = await frame.read()
    detector = YOLODetector()
    if not detector.is_ready:
        raise HTTPException(status_code=503, detail="YOLO model unavailable")

    try:
        detection_result = detector.detect_image(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    person_count = detection_result["person_count"]
    capacity = classroom.capacity
    occupancy_pct, room_status = calculate_occupancy_and_status(person_count, capacity, db)

    if save_record:
        record = OccupancyRecord(
            classroom_id=classroom.id,
            detected_count=person_count,
            capacity=capacity,
            occupancy_percentage=occupancy_pct,
            status=room_status,
            source="LIVE CAMERA",
            confidence_avg=detection_result["confidence_avg"],
            detections_json=json.dumps(detection_result["detections"]),
            image_path=None,
            timestamp=datetime.utcnow()
        )
        db.add(record)
        db.commit()

    return {
        "classroom_id": classroom.id,
        "classroom_name": classroom.name,
        "capacity": capacity,
        "detected_students": person_count,
        "occupancy_percentage": occupancy_pct,
        "status": room_status,
        "confidence_avg": detection_result["confidence_avg"],
        "inference_time_ms": detection_result["inference_time_ms"],
        "detections": detection_result["detections"],
        "annotated_image_base64": detection_result["annotated_base64"],
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/video")
async def analyze_video(
    file: UploadFile = File(...),
    classroom_id: int = Form(...),
    process_every_n_frames: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Process an uploaded classroom video file by sampling frames.
    Computes peak, average, and final student counts across the footage.
    """
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id, Classroom.is_active == True).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{ext}'. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )

    sample_rate = process_every_n_frames or settings.PROCESS_EVERY_N_FRAMES

    detector = YOLODetector()
    if not detector.is_ready:
        raise HTTPException(status_code=503, detail="AI model could not be loaded.")

    # Save video temporarily to run OpenCV VideoCapture
    temp_suffix = ext
    with tempfile.NamedTemporaryFile(delete=False, suffix=temp_suffix) as tmp_file:
        tmp_path = tmp_file.name
        content = await file.read()
        tmp_file.write(content)

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Unable to process this video.")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0

        frame_idx = 0
        processed_count = 0
        counts_per_sampled_frame = []
        best_frame_b64 = None
        max_detected_so_far = -1

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_rate == 0:
                count, annotated_frame, detections = detector.detect_frame(frame)
                counts_per_sampled_frame.append(count)
                processed_count += 1

                if count > max_detected_so_far:
                    max_detected_so_far = count
                    # Encode best frame
                    _, buf = cv2.imencode(".jpg", annotated_frame)
                    best_frame_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"

            frame_idx += 1
            # Safety limit: max 120 sampled frames
            if processed_count >= 120:
                break

        cap.release()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not counts_per_sampled_frame:
        raise HTTPException(status_code=400, detail="Unable to process this video.")

    peak_students = max(counts_per_sampled_frame)
    avg_students = round(sum(counts_per_sampled_frame) / len(counts_per_sampled_frame))
    final_students = counts_per_sampled_frame[-1]

    # Calculate status from peak occupancy
    occupancy_pct, room_status = calculate_occupancy_and_status(peak_students, classroom.capacity, db)

    # Save summary record
    record = OccupancyRecord(
        classroom_id=classroom.id,
        detected_count=peak_students,
        capacity=classroom.capacity,
        occupancy_percentage=occupancy_pct,
        status=room_status,
        source="VIDEO",
        confidence_avg=0.0,
        timestamp=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "record_id": record.id,
        "classroom_id": classroom.id,
        "classroom_name": classroom.name,
        "capacity": classroom.capacity,
        "total_video_frames": total_frames,
        "sampled_frames_processed": processed_count,
        "frame_sample_rate": sample_rate,
        "peak_students_detected": peak_students,
        "average_students_detected": avg_students,
        "final_students_detected": final_students,
        "occupancy_percentage": occupancy_pct,
        "status": room_status,
        "frame_counts": counts_per_sampled_frame,
        "annotated_image_base64": best_frame_b64,
        "timestamp": datetime.utcnow().isoformat()
    }
