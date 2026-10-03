from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class OccupancyRecord(Base):
    __tablename__ = "occupancy_records"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    detected_count = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    occupancy_percentage = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)  # EMPTY, LOW OCCUPANCY, MODERATE OCCUPANCY, FULL
    source = Column(String(50), nullable=False)  # IMAGE, VIDEO, LIVE CAMERA, MANUAL
    confidence_avg = Column(Float, default=0.0)
    detections_json = Column(Text, nullable=True)  # JSON-serialized bounding boxes & labels
    image_path = Column(String(255), nullable=True)  # Saved annotated image path or relative URL
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    classroom = relationship("Classroom", back_populates="occupancy_records")
