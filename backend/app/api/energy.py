from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.energy_service import generate_energy_recommendations, get_energy_params
from app.schemas.stats import EnergyRecommendation

router = APIRouter(prefix="/energy", tags=["Energy Management"])

@router.get("/recommendations", response_model=List[EnergyRecommendation])
def get_recommendations(db: Session = Depends(get_db)):
    """Generate dynamic energy conservation recommendations based strictly on latest classroom occupancy."""
    return generate_energy_recommendations(db)

@router.get("/summary")
def get_energy_summary(db: Session = Depends(get_db)):
    """Summary of estimated power usage, idle wastage, and potential cost savings."""
    recs = generate_energy_recommendations(db)
    params = get_energy_params(db)

    total_potential_kw = sum(r.estimated_savings_kw for r in recs)
    total_hourly_savings = sum(r.estimated_savings_cost_per_hour for r in recs)
    empty_rooms = [r for r in recs if r.status == "EMPTY"]
    low_rooms = [r for r in recs if r.status == "LOW OCCUPANCY"]

    return {
        "parameters": params,
        "total_monitored_classrooms": len(recs),
        "empty_classrooms_count": len(empty_rooms),
        "low_occupancy_count": len(low_rooms),
        "estimated_potential_savings_kw": round(total_potential_kw, 2),
        "estimated_hourly_cost_savings": round(total_hourly_savings, 2),
        "estimated_monthly_savings_if_idle_4h_daily": round(total_hourly_savings * 4 * 22, 2),  # 22 working days
        "disclaimer": "All electrical wattage and financial figures are estimated based on configured room parameters."
    }
