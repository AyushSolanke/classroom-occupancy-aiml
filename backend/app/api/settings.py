from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.config import settings
from app.models.setting import SystemSetting
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.schemas.settings import SystemSettingsSchema

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SystemSettingsSchema)
def get_system_settings(db: Session = Depends(get_db)):
    """Fetch current system configuration."""
    db_settings = {s.key: s.value for s in db.query(SystemSetting).all()}

    def get_val(key: str, default, cast_fn):
        if key in db_settings:
            try:
                return cast_fn(db_settings[key])
            except Exception:
                pass
        return default

    return SystemSettingsSchema(
        confidence_threshold=get_val("confidence_threshold", settings.CONFIDENCE_THRESHOLD, float),
        iou_threshold=get_val("iou_threshold", settings.IOU_THRESHOLD, float),
        process_every_n_frames=get_val("process_every_n_frames", settings.PROCESS_EVERY_N_FRAMES, int),
        low_occupancy_threshold=get_val("low_occupancy_threshold", settings.LOW_OCCUPANCY_THRESHOLD, float),
        moderate_occupancy_threshold=get_val("moderate_occupancy_threshold", settings.MODERATE_OCCUPANCY_THRESHOLD, float),
        full_occupancy_threshold=get_val("full_occupancy_threshold", settings.FULL_OCCUPANCY_THRESHOLD, float),
        energy_lighting_kw_per_room=get_val("energy_lighting_kw_per_room", settings.ENERGY_LIGHTING_KW_PER_ROOM, float),
        energy_hvac_kw_per_room=get_val("energy_hvac_kw_per_room", settings.ENERGY_HVAC_KW_PER_ROOM, float),
        energy_cost_per_kwh=get_val("energy_cost_per_kwh", settings.ENERGY_COST_PER_KWH, float),
        realtime_update_interval_ms=get_val("realtime_update_interval_ms", settings.REALTIME_UPDATE_INTERVAL_MS, int),
        demo_mode=get_val("demo_mode", settings.DEMO_MODE, lambda v: str(v).lower() in ["true", "1"])
    )

@router.put("", response_model=SystemSettingsSchema)
def update_system_settings(new_settings: SystemSettingsSchema, db: Session = Depends(get_db)):
    """Update system thresholds and energy parameters in database."""
    items = new_settings.model_dump()
    for k, v in items.items():
        record = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if not record:
            record = SystemSetting(key=k, value=str(v))
            db.add(record)
        else:
            record.value = str(v)

    db.commit()
    return new_settings

@router.post("/demo-mode")
def toggle_demo_mode(
    enable: bool = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Toggle Demo Mode.
    When enabled, clearly labeled DEMO DATA records are populated for demonstration purposes.
    When disabled, DEMO records are removed so actual production data is preserved.
    """
    # Save setting
    s_demo = db.query(SystemSetting).filter(SystemSetting.key == "demo_mode").first()
    if not s_demo:
        s_demo = SystemSetting(key="demo_mode", value=str(enable))
        db.add(s_demo)
    else:
        s_demo.value = str(enable)
    db.commit()

    if enable:
        # Seed realistic sample data tagged with source="DEMO"
        classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
        if not classrooms:
            raise HTTPException(status_code=400, detail="Please create at least one classroom first.")

        # Remove previous demo records first
        db.query(OccupancyRecord).filter(OccupancyRecord.source == "DEMO").delete()

        # Generate sample logs over the last 5 days
        now = datetime.utcnow()
        sample_records = []
        for cr in classrooms:
            # Create a sequence of 6 time snapshots per classroom
            for hour_offset in range(0, 36, 6):
                log_time = now - timedelta(hours=hour_offset)
                # Determine realistic student count based on room capacity
                pct_sim = random.choice([0.0, 18.0, 45.0, 68.0, 85.0, 92.0])
                count = int(round((pct_sim / 100.0) * cr.capacity))
                actual_pct = round((count / cr.capacity) * 100, 1)

                if count == 0:
                    status = "EMPTY"
                elif actual_pct < settings.LOW_OCCUPANCY_THRESHOLD:
                    status = "LOW OCCUPANCY"
                elif actual_pct <= settings.MODERATE_OCCUPANCY_THRESHOLD:
                    status = "MODERATE OCCUPANCY"
                else:
                    status = "FULL"

                sample_records.append(
                    OccupancyRecord(
                        classroom_id=cr.id,
                        detected_count=count,
                        capacity=cr.capacity,
                        occupancy_percentage=actual_pct,
                        status=status,
                        source="DEMO",
                        confidence_avg=0.88,
                        timestamp=log_time
                    )
                )

        db.bulk_save_objects(sample_records)
        db.commit()
        return {"status": "Demo mode activated", "demo_mode": True, "records_generated": len(sample_records)}
    else:
        # Clear demo records
        deleted = db.query(OccupancyRecord).filter(OccupancyRecord.source == "DEMO").delete()
        db.commit()
        return {"status": "Demo mode deactivated", "demo_mode": False, "demo_records_cleared": deleted}
