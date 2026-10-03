import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.schemas.stats import (
    DashboardKPICards,
    StatusDistributionItem,
    ClassroomUtilizationItem,
    OccupancyOverTimeItem,
    AIInsightItem,
    ModelEvaluationResponse,
    ModelEvaluationSample,
    ClassroomAllocationItem
)
from app.services.energy_service import get_energy_params
from app.services.occupancy_service import calculate_occupancy_and_status


def get_dashboard_kpis(db: Session) -> DashboardKPICards:
    total_classrooms = db.query(Classroom).filter(Classroom.is_active == True).count()
    classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()

    occupied_count = 0
    empty_count = 0
    total_detected = 0
    total_capacity = 0
    occupancy_pct_sum = 0.0

    energy_params = get_energy_params(db)
    potential_kw_savings = 0.0
    active_power_kw = 0.0
    wasted_power_kw = 0.0

    for cr in classrooms:
        latest = (
            db.query(OccupancyRecord)
            .filter(OccupancyRecord.classroom_id == cr.id)
            .order_by(OccupancyRecord.timestamp.desc())
            .first()
        )

        detected = latest.detected_count if latest else 0
        pct = latest.occupancy_percentage if latest else 0.0
        status = latest.status if latest else "EMPTY"

        total_detected += detected
        total_capacity += cr.capacity
        occupancy_pct_sum += pct

        if status == "EMPTY" or detected == 0:
            empty_count += 1
            wasted_power_kw += energy_params["total_room_kw"]
            potential_kw_savings += energy_params["total_room_kw"]
        else:
            occupied_count += 1
            active_power_kw += energy_params["total_room_kw"]
            if status == "LOW OCCUPANCY":
                potential_kw_savings += energy_params["hvac_kw"] * 0.4

    avg_occupancy = round(occupancy_pct_sum / total_classrooms, 1) if total_classrooms > 0 else 0.0

    energy_opp_str = (
        f"{empty_count} Empty ({round(potential_kw_savings, 1)} kW potential)"
        if empty_count > 0
        else "Optimal (All rooms utilized)"
    )

    return DashboardKPICards(
        total_classrooms=total_classrooms,
        occupied_classrooms=occupied_count,
        empty_classrooms=empty_count,
        total_students_detected=total_detected,
        average_occupancy_percentage=avg_occupancy,
        energy_saving_opportunity=energy_opp_str,
        estimated_active_power_kw=round(active_power_kw, 2),
        estimated_wasted_power_kw=round(wasted_power_kw, 2)
    )

def get_status_distribution(db: Session) -> List[StatusDistributionItem]:
    classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
    total = len(classrooms)
    counts = {"EMPTY": 0, "LOW OCCUPANCY": 0, "MODERATE OCCUPANCY": 0, "FULL": 0}

    for cr in classrooms:
        latest = (
            db.query(OccupancyRecord)
            .filter(OccupancyRecord.classroom_id == cr.id)
            .order_by(OccupancyRecord.timestamp.desc())
            .first()
        )
        st = latest.status if latest else "EMPTY"
        if st in counts:
            counts[st] += 1
        else:
            counts["EMPTY"] += 1

    colors = {
        "EMPTY": "#94a3b8",            # Gray / Slate
        "LOW OCCUPANCY": "#f59e0b",     # Amber
        "MODERATE OCCUPANCY": "#10b981", # Green / Emerald
        "FULL": "#ef4444"              # Red
    }

    results = []
    for name, cnt in counts.items():
        pct = round((cnt / total * 100), 1) if total > 0 else 0.0
        results.append(StatusDistributionItem(
            name=name,
            count=cnt,
            percentage=pct,
            color=colors[name]
        ))
    return results

def get_classroom_utilization(db: Session) -> List[ClassroomUtilizationItem]:
    classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
    items = []

    for cr in classrooms:
        latest = (
            db.query(OccupancyRecord)
            .filter(OccupancyRecord.classroom_id == cr.id)
            .order_by(OccupancyRecord.timestamp.desc())
            .first()
        )

        detected = latest.detected_count if latest else 0
        pct = latest.occupancy_percentage if latest else 0.0
        status = latest.status if latest else "EMPTY"
        last_updated = latest.timestamp.strftime("%Y-%m-%d %H:%M:%S") if latest else None

        items.append(ClassroomUtilizationItem(
            id=cr.id,
            name=cr.name,
            capacity=cr.capacity,
            current_occupancy=detected,
            occupancy_percentage=pct,
            status=status,
            last_updated=last_updated
        ))

    # Sort descending by occupancy %
    items.sort(key=lambda x: x.occupancy_percentage, reverse=True)
    return items

def get_occupancy_over_time(db: Session, days: int = 7) -> List[OccupancyOverTimeItem]:
    """Retrieve actual occupancy timeline from database records."""
    since = datetime.utcnow() - timedelta(days=days)
    records = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.timestamp >= since)
        .order_by(OccupancyRecord.timestamp.asc())
        .all()
    )

    if not records:
        return []

    # Group by timestamp (date or hour string)
    grouped: Dict[str, List[OccupancyRecord]] = {}
    for r in records:
        key = r.timestamp.strftime("%b %d, %H:00" if days <= 2 else "%b %d")
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(r)

    timeline = []
    for key, group in grouped.items():
        avg_pct = round(sum(r.occupancy_percentage for r in group) / len(group), 1)
        total_st = sum(r.detected_count for r in group)
        timeline.append(OccupancyOverTimeItem(
            time=key,
            timestamp=group[-1].timestamp.isoformat(),
            average_occupancy=avg_pct,
            total_detected=total_st
        ))

    return timeline

def get_ai_insights(db: Session) -> List[AIInsightItem]:
    """
    Computes analytical insights from genuine historical occupancy records.
    Displays informative message if data points are insufficient.
    """
    total_records = db.query(OccupancyRecord).count()
    if total_records < 3:
        return [
            AIInsightItem(
                title="Historical Data Collection In Progress",
                category="utilization",
                summary="Insufficient historical data to generate deep AI trends.",
                detail=f"Only {total_records} record(s) recorded in the database so far. Run detections on uploaded classroom photos or live camera streams to unlock pattern recognition.",
                recommendation="Perform at least 3-5 image or video analyses across classrooms to generate predictive scheduling and energy insights.",
                impact_level="Low"
            )
        ]

    insights: List[AIInsightItem] = []

    # 1. Frequently Under-utilized Classrooms
    underutilized = (
        db.query(
            OccupancyRecord.classroom_id,
            func.avg(OccupancyRecord.occupancy_percentage).label("avg_pct"),
            func.count(OccupancyRecord.id).label("cnt")
        )
        .group_by(OccupancyRecord.classroom_id)
        .having(func.avg(OccupancyRecord.occupancy_percentage) < 30.0)
        .all()
    )

    if underutilized:
        cr_ids = [u.classroom_id for u in underutilized]
        names = [c.name for c in db.query(Classroom).filter(Classroom.id.in_(cr_ids)).all()]
        insights.append(AIInsightItem(
            title="Under-Utilized Classroom Alert",
            category="utilization",
            summary=f"{len(underutilized)} classroom(s) operate at under 30% average capacity.",
            detail=f"Classrooms ({', '.join(names)}) consistently register low occupancy in recorded sessions.",
            recommendation="Consider merging small batch tutorials or reallocating smaller seminar rooms to optimize space.",
            impact_level="High"
        ))

    # 2. Peak Occupancy Analysis
    peak_rec = (
        db.query(OccupancyRecord)
        .order_by(OccupancyRecord.occupancy_percentage.desc())
        .first()
    )
    if peak_rec and peak_rec.occupancy_percentage >= 75.0:
        cr = db.query(Classroom).filter(Classroom.id == peak_rec.classroom_id).first()
        cr_name = cr.name if cr else f"Classroom #{peak_rec.classroom_id}"
        insights.append(AIInsightItem(
            title="High Demand Peak Detected",
            category="scheduling",
            summary=f"Peak occupancy reached {peak_rec.occupancy_percentage}% in {cr_name}.",
            detail=f"Detected {peak_rec.detected_count} students against a total room capacity of {peak_rec.capacity}.",
            recommendation="Ensure ventilation and cooling systems are pre-activated 10 minutes prior to scheduled session start.",
            impact_level="Medium"
        ))

    # 3. Energy Saving Opportunity Insight
    empty_records = db.query(OccupancyRecord).filter(OccupancyRecord.status == "EMPTY").count()
    if empty_records > 0:
        pct_empty = round((empty_records / total_records) * 100, 1)
        insights.append(AIInsightItem(
            title="Automated Lighting & HVAC Shutdown Potential",
            category="energy",
            summary=f"{pct_empty}% of monitored sessions recorded zero occupants.",
            detail=f"Out of {total_records} logged sessions, {empty_records} detected zero students.",
            recommendation="Integrate IoT smart relay automation to instantly kill idle HVAC and lighting loads when status is EMPTY.",
            impact_level="High"
        ))

    return insights

def get_model_evaluation(db: Session) -> ModelEvaluationResponse:
    """
    Computes real MAE (Mean Absolute Error), RMSE (Root Mean Square Error),
    and Accuracy by pairing manual ground-truth verifications with AI detections.
    Never fabricates metrics. If no pairs exist, clearly reports data unavailable.
    """
    manual_records = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.source == "MANUAL")
        .order_by(OccupancyRecord.timestamp.desc())
        .all()
    )

    pairs: List[ModelEvaluationSample] = []

    for m in manual_records:
        # Find closest AI detection within 12 hours on the same classroom
        ai_match = (
            db.query(OccupancyRecord)
            .filter(
                OccupancyRecord.classroom_id == m.classroom_id,
                OccupancyRecord.source.in_(["IMAGE", "VIDEO", "LIVE CAMERA"]),
                OccupancyRecord.timestamp <= m.timestamp + timedelta(hours=12),
                OccupancyRecord.timestamp >= m.timestamp - timedelta(hours=12)
            )
            .order_by(func.abs(func.julianday(OccupancyRecord.timestamp) - func.julianday(m.timestamp)))
            .first()
        )

        if ai_match:
            cr = db.query(Classroom).filter(Classroom.id == m.classroom_id).first()
            cr_name = cr.name if cr else f"Classroom #{m.classroom_id}"
            err = ai_match.detected_count - m.detected_count
            cap = cr.capacity if cr else m.capacity
            _, actual_st = calculate_occupancy_and_status(m.detected_count, cap, db)
            _, pred_st = calculate_occupancy_and_status(ai_match.detected_count, cap, db)
            pairs.append(
                ModelEvaluationSample(
                    classroom_name=cr_name,
                    predicted_count=ai_match.detected_count,
                    actual_count=m.detected_count,
                    error=err,
                    timestamp=m.timestamp.strftime("%Y-%m-%d %H:%M"),
                    actual_status=actual_st,
                    predicted_status=pred_st
                )
            )

    if not pairs:
        return ModelEvaluationResponse(
            evaluated=False,
            sample_size=0,
            active_model="YOLOv8",
            primary_metric="MAE (Counting)",
            mae=None,
            rmse=None,
            accuracy=None,
            samples=[],
            message="Evaluation requires labelled ground-truth data."
        )

    n = len(pairs)
    abs_errors = [abs(p.error) for p in pairs]
    sq_errors = [p.error ** 2 for p in pairs]

    mae = round(sum(abs_errors) / n, 2)
    rmse = round(math.sqrt(sum(sq_errors) / n), 2)
    # Accuracy: percentage of predictions where classified status matches ground-truth status
    correct_status_count = sum(1 for p in pairs if p.actual_status == p.predicted_status)
    accuracy_pct = round((correct_status_count / n) * 100, 1)

    return ModelEvaluationResponse(
        evaluated=True,
        sample_size=n,
        active_model="YOLOv8",
        primary_metric="MAE (Counting)",
        mae=mae,
        rmse=rmse,
        accuracy=accuracy_pct,
        samples=pairs,
        message=f"Evaluation successfully computed across {n} paired ground-truth validation sample(s)."
    )

def get_classroom_allocation(db: Session) -> List[ClassroomAllocationItem]:
    """
    Computes data-driven classroom allocation optimization recommendations
    based on current real occupancy, room capacity, and room status.
    """
    classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
    allocations: List[ClassroomAllocationItem] = []

    for cr in classrooms:
        latest = (
            db.query(OccupancyRecord)
            .filter(OccupancyRecord.classroom_id == cr.id)
            .order_by(OccupancyRecord.timestamp.desc())
            .first()
        )

        detected = latest.detected_count if latest else 0
        pct = latest.occupancy_percentage if latest else 0.0
        status = latest.status if latest else "EMPTY"

        if status == "EMPTY":
            action = "Available for Allocation"
            suggested_type = "Any scheduled lecture or exam"
            reason = "Classroom is completely unoccupied. Ideal for immediate room booking or emergency rescheduling."
        elif status == "LOW OCCUPANCY":
            if cr.capacity >= 50:
                action = "Reallocate to Seminar Room"
                suggested_type = "Seminar Hall / Tutorial Room (Cap: 25-35)"
                reason = f"Only {detected} students in a {cr.capacity}-capacity hall ({pct}% utilization). Relocating to a smaller room frees this large lecture hall."
            else:
                action = "Maintain or Combine"
                suggested_type = "Compact Lab"
                reason = f"Low occupancy ({pct}%). Consider merging with another small batch if space is required."
        elif status == "FULL":
            action = "Upgrade to Larger Hall"
            suggested_type = "Auditorium / Tiered Lecture Hall (Cap: 80+)"
            reason = f"Hall is at peak capacity ({pct}%). Higher ventilation demand; consider upgrading venue for future batches."
        else:  # MODERATE OCCUPANCY
            action = "Optimal Space Match"
            suggested_type = f"Standard Classroom (Cap: {cr.capacity})"
            reason = f"Current cohort size of {detected} students appropriately fits room capacity ({pct}% utilization)."

        allocations.append(
            ClassroomAllocationItem(
                classroom_id=cr.id,
                classroom_name=cr.name,
                capacity=cr.capacity,
                current_occupancy=detected,
                utilization_percentage=pct,
                status=status,
                recommended_action=action,
                suggested_room_type=suggested_type,
                reason=reason
            )
        )

    return allocations

