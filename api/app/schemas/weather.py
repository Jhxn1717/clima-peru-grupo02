from pydantic import BaseModel
from typing import Optional, List

class WeatherCondition(BaseModel):
    code: int
    description: str
    icon: str # icon code or name e.g. "sun", "cloud-rain", "cloud-lightning"

class CurrentWeather(BaseModel):
    temperature: float
    apparent_temperature: float
    relative_humidity: int
    wind_speed: float
    wind_direction: int
    wind_gusts: Optional[float] = None
    surface_pressure: float
    precipitation: float
    precipitation_probability: Optional[int] = None
    cloud_cover: int
    uv_index: float
    uv_category: str # "Bajo", "Moderado", "Alto", "Muy Alto", "Extremo"
    weather_code: int
    weather_description: str
    weather_icon: str
    is_day: bool
    temp_max: float
    temp_min: float
    sunrise: Optional[str] = None
    sunset: Optional[str] = None
    updated_at: str
    city_id: Optional[int] = None
    city_name: str
    department_name: Optional[str] = None
    region_natural: Optional[str] = None
    altitude: Optional[int] = None
    latitude: float
    longitude: float

class HourlyForecastItem(BaseModel):
    time: str # "2026-08-24T14:00"
    hour_label: str # "14:00"
    temperature: float
    apparent_temperature: float
    relative_humidity: int
    precipitation_probability: int
    precipitation: float
    weather_code: int
    weather_description: str
    weather_icon: str
    wind_speed: float
    uv_index: float
    is_day: bool

class DailyForecastItem(BaseModel):
    date: str # "2026-08-24"
    day_name: str # "Lunes", "Martes"
    day_short: str # "Lun", "Mar"
    temp_max: float
    temp_min: float
    weather_code: int
    weather_description: str
    weather_icon: str
    precipitation_sum: float
    precipitation_probability_max: int
    uv_index_max: float
    wind_speed_max: float
    sunrise: str
    sunset: str

class FullForecastResponse(BaseModel):
    current: CurrentWeather
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]

class DepartmentWeatherSummary(BaseModel):
    department_id: int
    department_name: str
    capital: str
    latitude: float
    longitude: float
    region_natural: str
    temperature: float
    weather_description: str
    weather_icon: str
    relative_humidity: int
    precipitation: float
    uv_index: float
    wind_speed: float
