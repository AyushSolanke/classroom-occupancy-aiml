import logging
from sqlalchemy.orm import Session
from app.database.session import Base, engine, SessionLocal
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.models.setting import SystemSetting
from app.config import settings

logger = logging.getLogger(__name__)

INITIAL_CLASSROOMS = [
    {
        "name": "Lecture Hall 101 - CS Block",
        "building": "Aryabhatta Block",
        "floor": 1,
        "room_number": "LH-101",
        "capacity": 60,
        "camera_id": "CAM-LH101",
        "department": "Computer Science & Engineering"
    },
    {
        "name": "Seminar Room 204 - Electronics",
        "building": "Ramanujan Block",
        "floor": 2,
        "room_number": "SR-204",
        "capacity": 40,
        "camera_id": "CAM-SR204",
        "department": "Electronics & Comm. Engg"
    },
    {
        "name": "AI & Robotics Lab 302",
        "building": "Turing Complex",
        "floor": 3,
        "room_number": "LAB-302",
        "capacity": 35,
        "camera_id": "CAM-AI302",
        "department": "Artificial Intelligence & ML"
    },
    {
        "name": "Classroom 405 - Mechanical",
        "building": "Visvesvaraya Block",
        "floor": 4,
        "room_number": "CR-405",
        "capacity": 55,
        "camera_id": "CAM-ME405",
        "department": "Mechanical Engineering"
    },
    {
        "name": "Central Campus Auditorium",
        "building": "Main Administrative Complex",
        "floor": 0,
        "room_number": "AUD-01",
        "capacity": 150,
        "camera_id": "CAM-AUD01",
        "department": "University Central"
    }
]

DEFAULT_SETTINGS = [
    ("confidence_threshold", str(settings.CONFIDENCE_THRESHOLD), "Detection confidence threshold"),
    ("iou_threshold", str(settings.IOU_THRESHOLD), "IoU threshold for NMS"),
    ("process_every_n_frames", str(settings.PROCESS_EVERY_N_FRAMES), "Video frame sample interval"),
    ("low_occupancy_threshold", str(settings.LOW_OCCUPANCY_THRESHOLD), "Upper bound percentage for Low Occupancy"),
    ("moderate_occupancy_threshold", str(settings.MODERATE_OCCUPANCY_THRESHOLD), "Upper bound percentage for Moderate Occupancy"),
    ("full_occupancy_threshold", str(settings.FULL_OCCUPANCY_THRESHOLD), "Threshold percentage for Full Occupancy"),
    ("energy_lighting_kw_per_room", str(settings.ENERGY_LIGHTING_KW_PER_ROOM), "Estimated lighting power load (kW)"),
    ("energy_hvac_kw_per_room", str(settings.ENERGY_HVAC_KW_PER_ROOM), "Estimated HVAC power load (kW)"),
    ("energy_cost_per_kwh", str(settings.ENERGY_COST_PER_KWH), "Electricity tariff rate per kWh"),
    ("realtime_update_interval_ms", str(settings.REALTIME_UPDATE_INTERVAL_MS), "Dashboard live polling interval (ms)"),
    ("demo_mode", "false", "Demo mode status flag")
]

def init_db():
    """Create all tables and seed default classrooms and settings if database is new."""
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check classrooms
        cr_count = db.query(Classroom).count()
        if cr_count == 0:
            logger.info("Seeding initial campus classrooms...")
            for cr_data in INITIAL_CLASSROOMS:
                cr = Classroom(**cr_data)
                db.add(cr)
            db.commit()
            logger.info(f"Seeded {len(INITIAL_CLASSROOMS)} classrooms successfully.")

        # Check settings
        for key, val, desc in DEFAULT_SETTINGS:
            existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not existing:
                db.add(SystemSetting(key=key, value=val, description=desc))
        db.commit()
        logger.info("System settings initialized.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        db.rollback()
    finally:
        db.close()
