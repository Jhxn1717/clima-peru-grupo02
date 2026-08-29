from pydantic import BaseModel
from typing import List
from app.schemas.weather import CurrentWeather

class CityComparisonItem(BaseModel):
    city_id: int
    city_name: str
    department_name: str
    region_natural: str
    altitude: int
    temperature: float
    apparent_temperature: float
    relative_humidity: int
    precipitation: float
    wind_speed: float
    uv_index: float
    temp_max: float
    temp_min: float
    weather_description: str
    weather_icon: str
    surface_pressure: float

class CompareResponse(BaseModel):
    count: int
    cities: List[CityComparisonItem]
