from sqlalchemy.orm import Session
from app.config import settings
from app.models.setting import SystemSetting
from typing import Tuple, Dict, Any

def get_thresholds(db: Session) -> Tuple[float, float, float]:
    """Retrieve dynamic occupancy thresholds from database or fall back to defaults."""
    low = settings.LOW_OCCUPANCY_THRESHOLD
    moderate = settings.MODERATE_OCCUPANCY_THRESHOLD
    full = settings.FULL_OCCUPANCY_THRESHOLD

    try:
        s_low = db.query(SystemSetting).filter(SystemSetting.key == "low_occupancy_threshold").first()
        if s_low and s_low.value:
            low = float(s_low.value)

        s_mod = db.query(SystemSetting).filter(SystemSetting.key == "moderate_occupancy_threshold").first()
        if s_mod and s_mod.value:
            moderate = float(s_mod.value)

        s_full = db.query(SystemSetting).filter(SystemSetting.key == "full_occupancy_threshold").first()
        if s_full and s_full.value:
            full = float(s_full.value)
    except Exception:
        pass

    return low, moderate, full

def calculate_occupancy_and_status(
    detected_count: int,
    capacity: int,
    db: Session
) -> Tuple[float, str]:
    """
    Calculates occupancy percentage and maps to exact standard classroom statuses:
    - EMPTY (detected_count == 0)
    - LOW OCCUPANCY (percentage < low_threshold)
    - MODERATE OCCUPANCY (percentage between low and moderate threshold)
    - FULL (percentage >= moderate_threshold / full_threshold)
    """
    if capacity <= 0:
        return 0.0, "EMPTY"

    if detected_count <= 0:
        return 0.0, "EMPTY"

    percentage = round((detected_count / capacity) * 100, 1)

    low_th, mod_th, full_th = get_thresholds(db)

    if percentage == 0.0:
        status = "EMPTY"
    elif percentage < low_th:
        status = "LOW OCCUPANCY"
    elif percentage <= mod_th:
        status = "MODERATE OCCUPANCY"
    else:
        status = "FULL"

    return percentage, status
