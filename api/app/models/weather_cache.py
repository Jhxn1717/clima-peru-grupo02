from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), unique=True, index=True, nullable=False) # e.g. current_-12.04_-77.04
    data_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
