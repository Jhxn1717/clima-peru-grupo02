from pydantic import BaseModel
from typing import List, Optional

class WeatherAlert(BaseModel):
    id: str
    city_id: Optional[int] = None
    city_name: str
    department_name: Optional[str] = None
    region_natural: Optional[str] = None
    title: str
    severity: str # "info", "caution", "warning", "danger" (Informativo, Precaución, Advertencia, Peligro)
    severity_label: str
    category: str # "temperature", "uv", "rain", "wind", "frost"
    icon: str
    description: str
    recommendation: str
    trigger_value: str
    threshold: str
    timestamp: str

class AlertsResponse(BaseModel):
    total_alerts: int
    danger_count: int
    warning_count: int
    caution_count: int
    info_count: int
    alerts: List[WeatherAlert]
