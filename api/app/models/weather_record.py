from sqlalchemy import Column, Integer, String, Float, Date, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class WeatherRecord(Base):
    """Registro meteorológico real cargado desde dataset CSV (SENAMHI/catálogo)."""

    __tablename__ = "weather_records"
    __table_args__ = (
        UniqueConstraint(
            "city_id", "record_date", "hour", name="uq_weather_records_city_date_hour"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    hour = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    temp_min = Column(Float, nullable=True)
    temp_max = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True, default=0.0)
    wind_speed = Column(Float, nullable=True)
    uv_index = Column(Float, nullable=True)
    condition = Column(String(200), nullable=True)
    source = Column(String(50), nullable=True, default="csv")
    created_at = Column(DateTime(timezone=True), server_default=func.now())