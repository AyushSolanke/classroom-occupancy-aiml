import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import numpy as np
import cv2

from app.main import app
from app.database.session import Base, get_db
from app.services.occupancy_service import calculate_occupancy_and_status
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.models.setting import SystemSetting

# StaticPool ensures in-memory SQLite preserves schema across all queries
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    test_cr = Classroom(
        name="Test Room 101",
        building="Test Block",
        floor=1,
        room_number="TR-101",
        capacity=50,
        camera_id="CAM-TEST",
        department="Computer Science"
    )
    db.add(test_cr)
    db.add(SystemSetting(key="low_occupancy_threshold", value="35.0"))
    db.add(SystemSetting(key="moderate_occupancy_threshold", value="80.0"))
    db.add(SystemSetting(key="full_occupancy_threshold", value="95.0"))
    db.commit()
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["backend_status"] == "Healthy"
    assert "Connected" in data["database_status"]

def test_classrooms_list():
    response = client.get("/api/classrooms")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Test Room 101"

def test_classroom_create():
    response = client.post(
        "/api/classrooms",
        json={
            "name": "Physics Lab",
            "building": "Science Block",
            "floor": 2,
            "room_number": "PL-201",
            "capacity": 30,
            "camera_id": "CAM-PL201",
            "department": "Physics"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Physics Lab"
    assert data["capacity"] == 30

def test_occupancy_calculation_logic():
    db = TestingSessionLocal()
    # Test Empty
    pct, status = calculate_occupancy_and_status(0, 50, db)
    assert pct == 0.0
    assert status == "EMPTY"

    # Test Low (10/50 = 20% < 35%)
    pct, status = calculate_occupancy_and_status(10, 50, db)
    assert pct == 20.0
    assert status == "LOW OCCUPANCY"

    # Test Moderate (30/50 = 60% <= 80%)
    pct, status = calculate_occupancy_and_status(30, 50, db)
    assert pct == 60.0
    assert status == "MODERATE OCCUPANCY"

    # Test Full (48/50 = 96% > 80%)
    pct, status = calculate_occupancy_and_status(48, 50, db)
    assert pct == 96.0
    assert status == "FULL"
    db.close()

def test_manual_occupancy_record():
    response = client.post(
        "/api/occupancy/manual?classroom_id=1&detected_count=25"
    )
    assert response.status_code == 201
    data = response.json()
    assert data["detected_count"] == 25
    assert data["capacity"] == 50
    assert data["occupancy_percentage"] == 50.0
    assert data["status"] == "MODERATE OCCUPANCY"

def test_analytics_kpis():
    response = client.get("/api/analytics/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "total_classrooms" in data
    assert "total_students_detected" in data
    assert "average_occupancy_percentage" in data

def test_energy_recommendations():
    response = client.get("/api/energy/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "recommendation" in data[0]
    assert "estimated_savings_kw" in data[0]

def test_image_analysis_endpoint_with_synthetic_image():
    img = np.zeros((300, 400, 3), dtype=np.uint8)
    img[:] = (200, 200, 200)
    _, buffer = cv2.imencode(".jpg", img)

    response = client.post(
        "/api/analyze/image",
        data={"classroom_id": 1, "save_record": "true"},
        files={"file": ("test_classroom.jpg", buffer.tobytes(), "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "detected_students" in data
    assert "occupancy_percentage" in data
    assert "annotated_image_base64" in data
    assert data["capacity"] == 50

def test_diagnostic_endpoint():
    response = client.get("/api/health/diagnostic")
    assert response.status_code == 200
    data = response.json()
    assert data["all_systems_operational"] is True
    assert data["python_env"]["status"] == "Working"
    assert data["opencv"]["status"] == "Working"
    assert data["numpy"]["status"] == "Working"
    assert data["pytorch"]["status"] == "Working"
    assert data["ultralytics"]["status"] == "Working"
    assert data["yolo_model"]["status"] == "Active"
    assert data["backend_api"]["status"] == "Working"
    assert data["database"]["status"] == "Working"
    assert data["image_processing"]["status"] == "Working"
    assert data["ai_inference"]["status"] == "Working"
    assert data["models_status"]["YOLOv8"] == "Active"
    assert data["models_status"]["CNN"] == "Reference"
    assert data["models_status"]["CSRNet"] == "Proposed"
    assert data["models_status"]["Vision Transformer"] == "Proposed"

def test_evaluation_endpoint_behavior():
    db = TestingSessionLocal()
    # Ensure clean state without manual records
    db.query(OccupancyRecord).filter(OccupancyRecord.source == "MANUAL").delete()
    db.commit()
    db.close()

    # 1. Without ground truth
    response = client.get("/api/analytics/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["evaluated"] is False
    assert data["mae"] is None
    assert data["rmse"] is None
    assert data["accuracy"] is None
    assert "Evaluation requires labelled ground-truth data." in data["message"]

    # 2. Add AI record and Manual Ground Truth record
    db = TestingSessionLocal()
    from datetime import datetime
    ai_rec = OccupancyRecord(
        classroom_id=1,
        detected_count=12,
        capacity=50,
        occupancy_percentage=24.0,
        status="LOW OCCUPANCY",
        source="IMAGE",
        confidence_avg=0.85,
        timestamp=datetime.utcnow()
    )
    manual_rec = OccupancyRecord(
        classroom_id=1,
        detected_count=10,
        capacity=50,
        occupancy_percentage=20.0,
        status="LOW OCCUPANCY",
        source="MANUAL",
        confidence_avg=1.0,
        timestamp=datetime.utcnow()
    )
    db.add(ai_rec)
    db.add(manual_rec)
    db.commit()

    response2 = client.get("/api/analytics/evaluation")
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["evaluated"] is True
    assert data2["sample_size"] == 1
    assert data2["mae"] == 2.0  # |12 - 10| = 2.0
    assert data2["rmse"] == 2.0  # sqrt((12-10)^2) = 2.0
    assert data2["accuracy"] == 100.0  # both LOW OCCUPANCY status
    assert len(data2["samples"]) == 1
    assert data2["samples"][0]["actual_status"] == "LOW OCCUPANCY"
    assert data2["samples"][0]["predicted_status"] == "LOW OCCUPANCY"

    # Clean up test records
    db.delete(ai_rec)
    db.delete(manual_rec)
    db.commit()
    db.close()

