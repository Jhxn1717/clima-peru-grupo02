from pydantic import BaseModel
from typing import List, Optional

class HistoryDataPoint(BaseModel):
    date: str # "2026-08-01"
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    temp_mean: Optional[float] = None
    precipitation_sum: Optional[float] = None
    wind_speed_max: Optional[float] = None
    relative_humidity_mean: Optional[float] = None
    weather_code: Optional[int] = None

class HistoryStats(BaseModel):
    average: float
    maximum: float
    minimum: float
    trend: str # "ascendente", "descendente", "estable"
    total_precipitation: Optional[float] = None
    days_analyzed: int

class HistoryResponse(BaseModel):
    city_id: int
    city_name: str
    department_name: str
    variable: str
    start_date: str
    end_date: str
    stats: HistoryStats
    data: List[HistoryDataPoint]
