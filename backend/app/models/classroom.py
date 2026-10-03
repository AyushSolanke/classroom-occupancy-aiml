from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    building = Column(String(100), nullable=False)
    floor = Column(Integer, default=1)
    room_number = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    camera_id = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    occupancy_records = relationship(
        "OccupancyRecord",
        back_populates="classroom",
        cascade="all, delete-orphan",
        order_by="desc(OccupancyRecord.timestamp)"
    )
