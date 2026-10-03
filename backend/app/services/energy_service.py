from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.config import settings
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.models.setting import SystemSetting
from app.schemas.stats import EnergyRecommendation

def get_energy_params(db: Session) -> Dict[str, float]:
    lighting_kw = settings.ENERGY_LIGHTING_KW_PER_ROOM
    hvac_kw = settings.ENERGY_HVAC_KW_PER_ROOM
    cost_per_kwh = settings.ENERGY_COST_PER_KWH

    try:
        s_light = db.query(SystemSetting).filter(SystemSetting.key == "energy_lighting_kw_per_room").first()
        if s_light and s_light.value:
            lighting_kw = float(s_light.value)

        s_hvac = db.query(SystemSetting).filter(SystemSetting.key == "energy_hvac_kw_per_room").first()
        if s_hvac and s_hvac.value:
            hvac_kw = float(s_hvac.value)

        s_cost = db.query(SystemSetting).filter(SystemSetting.key == "energy_cost_per_kwh").first()
        if s_cost and s_cost.value:
            cost_per_kwh = float(s_cost.value)
    except Exception:
        pass

    return {
        "lighting_kw": lighting_kw,
        "hvac_kw": hvac_kw,
        "cost_per_kwh": cost_per_kwh,
        "total_room_kw": lighting_kw + hvac_kw
    }

def generate_energy_recommendations(db: Session) -> List[EnergyRecommendation]:
    """Generate energy-saving recommendations based strictly on latest classroom occupancy data."""
    params = get_energy_params(db)
    lighting_kw = params["lighting_kw"]
    hvac_kw = params["hvac_kw"]
    cost_per_kwh = params["cost_per_kwh"]
    total_room_kw = params["total_room_kw"]

    classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
    recommendations: List[EnergyRecommendation] = []

    for cr in classrooms:
        # Get latest occupancy record
        latest_rec = (
            db.query(OccupancyRecord)
            .filter(OccupancyRecord.classroom_id == cr.id)
            .order_by(OccupancyRecord.timestamp.desc())
            .first()
        )

        detected = latest_rec.detected_count if latest_rec else 0
        occupancy_pct = latest_rec.occupancy_percentage if latest_rec else 0.0
        status = latest_rec.status if latest_rec else "EMPTY"

        if status == "EMPTY":
            rec_text = "Classroom is currently empty. Consider switching off lights, projectors, and HVAC units to prevent idle power consumption."
            severity = "warning"
            action = "SHUTDOWN_ALL"
            potential_kw = total_room_kw
            hourly_cost_saving = round(potential_kw * cost_per_kwh, 2)
        elif status == "LOW OCCUPANCY":
            rec_text = f"Classroom has low occupancy ({occupancy_pct}%). Consider consolidating this session with another hall or setting HVAC to eco-mode."
            severity = "info"
            action = "POWER_REDUCE"
            potential_kw = round(hvac_kw * 0.4, 2)  # partial eco saving
            hourly_cost_saving = round(potential_kw * cost_per_kwh, 2)
        elif status == "MODERATE OCCUPANCY":
            rec_text = f"Classroom is moderately occupied ({occupancy_pct}%). Maintain standard lighting and ambient ventilation."
            severity = "success"
            action = "NORMAL_OPERATION"
            potential_kw = 0.0
            hourly_cost_saving = 0.0
        else:  # FULL
            rec_text = f"Classroom is at high capacity ({occupancy_pct}%). Ensure active fresh air ventilation and full HVAC cooling for student comfort."
            severity = "alert"
            action = "MAX_VENTILATION"
            potential_kw = 0.0
            hourly_cost_saving = 0.0

        recommendations.append(
            EnergyRecommendation(
                id=f"rec-{cr.id}",
                classroom_id=cr.id,
                classroom_name=cr.name,
                status=status,
                occupancy_percentage=occupancy_pct,
                detected_count=detected,
                capacity=cr.capacity,
                recommendation=rec_text,
                severity=severity,
                action_type=action,
                estimated_savings_kw=potential_kw,
                estimated_savings_cost_per_hour=hourly_cost_saving
            )
        )

    return recommendations
