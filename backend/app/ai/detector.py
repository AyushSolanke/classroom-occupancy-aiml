import os
import time
import base64
import logging
from typing import Dict, Any, List, Tuple, Optional
import cv2
import numpy as np
from PIL import Image
import io

from app.config import settings

logger = logging.getLogger(__name__)

class YOLODetector:
    _instance = None
    _model = None
    _is_loaded = False
    _load_error = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLODetector, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Load YOLO model once on startup."""
        try:
            from ultralytics import YOLO
            model_path = settings.MODEL_PATH

            # If weights do not exist locally, Ultralytics YOLO('yolov8n.pt') automatically downloads it!
            # If specified path doesn't exist, we can use 'yolov8n.pt' directly or the custom path.
            logger.info(f"Loading YOLO model from: {model_path}...")
            
            # Use 'yolov8n.pt' directly if file doesn't exist yet, it will auto-download safely
            if not os.path.exists(model_path):
                # We can load 'yolov8n.pt' which downloads to cwd/cache
                self._model = YOLO("yolov8n.pt")
                # Save or copy to model_path if possible
                try:
                    self._model.save(model_path)
                except Exception:
                    pass
            else:
                self._model = YOLO(model_path)

            self._is_loaded = True
            self._load_error = None
            logger.info("YOLO model successfully loaded and ready for inference.")
        except Exception as e:
            self._is_loaded = False
            self._load_error = str(e)
            logger.error(f"Failed to load YOLO model: {e}")

    @property
    def is_ready(self) -> bool:
        return self._is_loaded and self._model is not None

    @property
    def status_info(self) -> Dict[str, Any]:
        return {
            "loaded": self._is_loaded,
            "error": self._load_error,
            "model_path": settings.MODEL_PATH,
            "model_type": "Ultralytics YOLOv8 (person detector)",
            "device": "CPU / GPU (Auto)" if self._is_loaded else "Unavailable"
        }

    def detect_image(
        self,
        image_bytes: bytes,
        confidence_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Run inference on image bytes, count people, and return annotated image.
        Strictly detects class 0 ('person').
        """
        if not self.is_ready:
            raise RuntimeError("AI model could not be loaded.")

        conf = confidence_threshold or settings.CONFIDENCE_THRESHOLD
        iou = iou_threshold or settings.IOU_THRESHOLD

        # Decode image using OpenCV
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Image/video processing is currently unavailable.")

        start_time = time.time()

        # Run YOLO inference
        # Classes=[0] restricts detection solely to 'person' in COCO dataset
        results = self._model.predict(
            source=img,
            conf=conf,
            iou=iou,
            classes=[0],
            verbose=False
        )

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        detections: List[Dict[str, Any]] = []
        annotated_img = img.copy()

        h, w, _ = img.shape

        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy()
                score = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                cls_name = results[0].names.get(cls_id, "person")

                x1, y1, x2, y2 = map(int, xyxy)
                detections.append({
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "confidence": round(score, 3),
                    "class_id": cls_id,
                    "class_name": cls_name
                })

                # Draw high-visibility modern bounding box
                # Primary theme green for bounding box
                cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (46, 178, 85), 2)

                # Label tag with background
                label_text = f"Student {score:.2f}"
                (txt_w, txt_h), baseline = cv2.getTextSize(
                    label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                )
                cv2.rectangle(
                    annotated_img,
                    (x1, max(0, y1 - txt_h - 6)),
                    (x1 + txt_w + 6, y1),
                    (46, 178, 85),
                    -1
                )
                cv2.putText(
                    annotated_img,
                    label_text,
                    (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA
                )

        person_count = len(detections)
        avg_confidence = (
            round(sum(d["confidence"] for d in detections) / person_count, 3)
            if person_count > 0 else 0.0
        )

        # Add top summary banner on image
        banner_h = 40
        banner = np.zeros((banner_h, w, 3), dtype=np.uint8)
        banner[:] = (20, 30, 25)  # Dark green-gray
        cv2.putText(
            banner,
            f"Detected Students: {person_count} | Conf: {conf} | Inference: {inference_time_ms}ms",
            (15, 26),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )
        combined_img = np.vstack([banner, annotated_img])

        # Encode back to JPEG
        _, buffer = cv2.imencode(".jpg", combined_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        annotated_base64 = base64.b64encode(buffer).decode("utf-8")

        return {
            "person_count": person_count,
            "detections": detections,
            "confidence_avg": avg_confidence,
            "inference_time_ms": inference_time_ms,
            "model_used": "Ultralytics YOLOv8n (Person Class 0)",
            "confidence_threshold": conf,
            "annotated_base64": f"data:image/jpeg;base64,{annotated_base64}",
            "raw_annotated_bytes": buffer.tobytes(),
            "dimensions": {"width": w, "height": h}
        }

    def detect_frame(self, frame_bgr: np.ndarray, conf: float = 0.35) -> Tuple[int, np.ndarray, List[Dict[str, Any]]]:
        """Fast frame detection for live streams / video frames."""
        if not self.is_ready:
            return 0, frame_bgr, []

        results = self._model.predict(
            source=frame_bgr,
            conf=conf,
            classes=[0],
            verbose=False
        )

        detections = []
        annotated = frame_bgr.copy()

        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy()
                score = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                x1, y1, x2, y2 = map(int, xyxy)
                detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": round(score, 3)
                })
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (46, 178, 85), 2)
                cv2.putText(
                    annotated,
                    f"Student {score:.2f}",
                    (x1, max(15, y1 - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (46, 178, 85),
                    2
                )

        return len(detections), annotated, detections
