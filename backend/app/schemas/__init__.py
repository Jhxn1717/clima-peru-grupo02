from app.schemas.city import CityBase, DepartmentBase, CityResponse, DepartmentResponse, CitySearchQuery
from app.schemas.weather import CurrentWeather, HourlyForecastItem, DailyForecastItem, FullForecastResponse, DepartmentWeatherSummary
from app.schemas.alert import WeatherAlert, AlertsResponse
from app.schemas.history import HistoryDataPoint, HistoryStats, HistoryResponse
from app.schemas.compare import CityComparisonItem, CompareResponse
from app.schemas.auth import (
    UserRegister,
    EmailVerificationRequest,
    ResendCodeRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    MessageResponse,
    UpdateUserRoleRequest,
    UpdateUserPermissionsRequest,
)

__all__ = [
    "CityBase", "DepartmentBase", "CityResponse", "DepartmentResponse", "CitySearchQuery",
    "CurrentWeather", "HourlyForecastItem", "DailyForecastItem", "FullForecastResponse", "DepartmentWeatherSummary",
    "WeatherAlert", "AlertsResponse",
    "HistoryDataPoint", "HistoryStats", "HistoryResponse",
    "CityComparisonItem", "CompareResponse",
    "UserRegister", "EmailVerificationRequest", "ResendCodeRequest", "LoginRequest",
    "UserResponse", "TokenResponse", "MessageResponse",
    "UpdateUserRoleRequest", "UpdateUserPermissionsRequest",
]
