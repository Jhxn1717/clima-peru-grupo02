import json
import httpx
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.config import settings
from app.models.weather_cache import WeatherCache
from app.models.peru_geo import City, Department
from app.models.weather_record import WeatherRecord
from app.schemas.weather import (
    CurrentWeather, HourlyForecastItem, DailyForecastItem,
    FullForecastResponse, DepartmentWeatherSummary
)
from app.schemas.history import HistoryResponse, HistoryStats, HistoryDataPoint

# WMO Weather interpretation codes (WW)
WMO_CODES: Dict[int, Dict[str, str]] = {
    0: {"desc": "Cielo despejado", "icon": "Sun"},
    1: {"desc": "Mayormente despejado", "icon": "SunMedium"},
    2: {"desc": "Parcialmente nublado", "icon": "CloudSun"},
    3: {"desc": "Nublado", "icon": "Cloud"},
    45: {"desc": "Neblina", "icon": "CloudFog"},
    48: {"desc": "Neblina con escarcha", "icon": "CloudFog"},
    51: {"desc": "Llovizna ligera", "icon": "CloudDrizzle"},
    53: {"desc": "Llovizna moderada", "icon": "CloudDrizzle"},
    55: {"desc": "Llovizna densa", "icon": "CloudDrizzle"},
    56: {"desc": "Llovizna helada ligera", "icon": "CloudSnow"},
    57: {"desc": "Llovizna helada densa", "icon": "CloudSnow"},
    61: {"desc": "Lluvia ligera", "icon": "CloudRain"},
    63: {"desc": "Lluvia moderada", "icon": "CloudRain"},
    65: {"desc": "Lluvia fuerte", "icon": "CloudRainWind"},
    66: {"desc": "Lluvia helada ligera", "icon": "CloudSnow"},
    67: {"desc": "Lluvia helada fuerte", "icon": "CloudSnow"},
    71: {"desc": "Nevada ligera", "icon": "Snowflake"},
    73: {"desc": "Nevada moderada", "icon": "Snowflake"},
    75: {"desc": "Nevada intensa", "icon": "Snowflake"},
    77: {"desc": "Granizo menudo", "icon": "CloudHail"},
    80: {"desc": "Chubascos ligeros", "icon": "CloudSunRain"},
    81: {"desc": "Chubascos moderados", "icon": "CloudRain"},
    82: {"desc": "Chubascos violentos", "icon": "CloudRainWind"},
    85: {"desc": "Chubascos de nieve ligeros", "icon": "CloudSnow"},
    86: {"desc": "Chubascos de nieve fuertes", "icon": "CloudSnow"},
    95: {"desc": "Tormenta eléctrica", "icon": "CloudLightning"},
    96: {"desc": "Tormenta con granizo ligero", "icon": "CloudHail"},
    99: {"desc": "Tormenta con granizo fuerte", "icon": "CloudHail"}
}

SPANISH_DAYS = {
    0: "Lunes", 1: "Martes", 2: "Miercoles", 3: "Jueves",
    4: "Viernes", 5: "Sabado", 6: "Domingo"
}

SPANISH_DAYS_SHORT = {
    0: "Lun", 1: "Mar", 2: "Mie", 3: "Jue",
    4: "Vie", 5: "Sab", 6: "Dom"
}

def get_uv_category(uv: float) -> str:
    if uv < 3.0:
        return "Bajo"
    elif uv < 6.0:
        return "Moderado"
    elif uv < 8.0:
        return "Alto"
    elif uv < 11.0:
        return "Muy Alto"
    return "Extremo"

def get_weather_meta(code: int, is_day: bool = True) -> tuple[str, str]:
    meta = WMO_CODES.get(code, {"desc": "Despejado", "icon": "Sun"})
    icon = meta["icon"]
    if not is_day:
        if icon in ["Sun", "SunMedium"]:
            icon = "Moon"
        elif icon == "CloudSun":
            icon = "CloudMoon"
        elif icon == "CloudSunRain":
            icon = "CloudMoonRain"
    return meta["desc"], icon

def _condition_to_code(condition: Optional[str]) -> int:
    c = (condition or "").lower()
    if "despejado" in c or "cielo claro" in c:
        return 0
    if "parcialmente nublado" in c or "nubosidad parcial" in c:
        return 2
    if "nublado" in c:
        return 3
    if "llovizna" in c:
        return 51
    if "lluvia" in c or "chubasco" in c:
        return 61
    if "neblina" in c or "bruma" in c:
        return 45
    if "tormenta" in c:
        return 95
    if "nieve" in c:
        return 73
    if "granizo" in c:
        return 96
    return 1

# In-memory fast cache
_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}

class WeatherService:
    @staticmethod
    async def fetch_open_meteo_raw(lat: float, lon: float) -> Dict[str, Any]:
        cache_key = f"weather_{round(lat, 2)}_{round(lon, 2)}"
        now = datetime.now()

        if cache_key in _MEMORY_CACHE:
            cached = _MEMORY_CACHE[cache_key]
            if (now - cached["timestamp"]).total_seconds() < settings.CACHE_TTL_MINUTES * 60:
                return cached["data"]

        url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m", "relative_humidity_2m", "apparent_temperature",
                "is_day", "precipitation", "rain", "weather_code", "cloud_cover",
                "surface_pressure", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"
            ],
            "hourly": [
                "temperature_2m", "relative_humidity_2m", "apparent_temperature",
                "precipitation_probability", "precipitation", "weather_code",
                "surface_pressure", "cloud_cover", "wind_speed_10m", "uv_index", "is_day"
            ],
            "daily": [
                "weather_code", "temperature_2m_max", "temperature_2m_min",
                "sunrise", "sunset", "uv_index_max", "precipitation_sum",
                "precipitation_probability_max", "wind_speed_10m_max"
            ],
            "timezone": "America/Lima",
            "forecast_days": 8
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params)
                res.raise_for_status()
                data = res.json()
                _MEMORY_CACHE[cache_key] = {"timestamp": now, "data": data}
                return data
        except Exception as e:
            print(f"Error llamando a Open-Meteo ({lat}, {lon}): {e}")
            if cache_key in _MEMORY_CACHE:
                return _MEMORY_CACHE[cache_key]["data"]
            raise e

    @classmethod
    async def get_forecast(
        cls,
        lat: float,
        lon: float,
        city_id: Optional[int] = None,
        city_name: Optional[str] = None,
        department_name: Optional[str] = None,
        region_natural: Optional[str] = None,
        altitude: Optional[int] = None,
        db: Optional[Session] = None
    ) -> FullForecastResponse:
        # Resolve city details if city_id provided
        if city_id and db:
            city_obj = db.query(City).filter(City.id == city_id).first()
            if city_obj:
                lat = city_obj.latitude
                lon = city_obj.longitude
                city_name = city_obj.name
                department_name = city_obj.department.name if city_obj.department else ""
                region_natural = city_obj.department.region_natural if city_obj.department else ""
                altitude = city_obj.altitude

        if city_id and db:
            real_records = (
                db.query(WeatherRecord)
                .filter(WeatherRecord.city_id == city_id)
                .order_by(WeatherRecord.record_date.desc(), WeatherRecord.id.desc())
                .limit(200)
                .all()
            )
            if real_records:
                return cls._build_forecast_from_records(
                    real_records,
                    city_name,
                    department_name,
                    region_natural,
                    altitude,
                    city_id,
                    lat,
                    lon,
                )

        raw = await cls.fetch_open_meteo_raw(lat, lon)
        current_raw = raw.get("current", {})
        hourly_raw = raw.get("hourly", {})
        daily_raw = raw.get("daily", {})

        weather_code = current_raw.get("weather_code", 0)
        is_day = bool(current_raw.get("is_day", 1))
        weather_desc, weather_icon = get_weather_meta(weather_code, is_day)

        # Get current hour UV and precipitation prob from hourly
        times = hourly_raw.get("time", [])
        current_time_str = current_raw.get("time", "")
        curr_idx = 0
        if current_time_str in times:
            curr_idx = times.index(current_time_str)

        uv_list = hourly_raw.get("uv_index", [0])
        curr_uv = uv_list[curr_idx] if curr_idx < len(uv_list) else 0.0
        pop_list = hourly_raw.get("precipitation_probability", [0])
        curr_pop = pop_list[curr_idx] if curr_idx < len(pop_list) else 0

        # Min/Max for today from daily
        d_max = daily_raw.get("temperature_2m_max", [current_raw.get("temperature_2m", 20)])[0]
        d_min = daily_raw.get("temperature_2m_min", [current_raw.get("temperature_2m", 15)])[0]
        sunrise = daily_raw.get("sunrise", ["06:00"])[0]
        sunset = daily_raw.get("sunset", ["18:00"])[0]

        current = CurrentWeather(
            temperature=round(float(current_raw.get("temperature_2m", 0.0)), 1),
            apparent_temperature=round(float(current_raw.get("apparent_temperature", 0.0)), 1),
            relative_humidity=int(current_raw.get("relative_humidity_2m", 0)),
            wind_speed=round(float(current_raw.get("wind_speed_10m", 0.0)), 1),
            wind_direction=int(current_raw.get("wind_direction_10m", 0)),
            wind_gusts=round(float(current_raw.get("wind_gusts_10m", 0.0)), 1) if current_raw.get("wind_gusts_10m") else None,
            surface_pressure=round(float(current_raw.get("surface_pressure", 1013.25)), 1),
            precipitation=round(float(current_raw.get("precipitation", 0.0)), 1),
            precipitation_probability=curr_pop,
            cloud_cover=int(current_raw.get("cloud_cover", 0)),
            uv_index=round(float(curr_uv), 1),
            uv_category=get_uv_category(curr_uv),
            weather_code=weather_code,
            weather_description=weather_desc,
            weather_icon=weather_icon,
            is_day=is_day,
            temp_max=round(float(d_max), 1),
            temp_min=round(float(d_min), 1),
            sunrise=sunrise.split("T")[-1] if "T" in sunrise else sunrise,
            sunset=sunset.split("T")[-1] if "T" in sunset else sunset,
            updated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            city_id=city_id,
            city_name=city_name or "Ubicación en Perú",
            department_name=department_name,
            region_natural=region_natural,
            altitude=altitude,
            latitude=lat,
            longitude=lon,
            data_source="simulado"
        )

        # Parse next 24-36 hourly items
        hourly_items: List[HourlyForecastItem] = []
        # Find current hour index
        start_h = max(0, curr_idx)
        end_h = min(len(times), start_h + 24)

        for i in range(start_h, end_h):
            t_str = times[i]
            hour_part = t_str.split("T")[-1] if "T" in t_str else t_str
            h_code = hourly_raw.get("weather_code", [0])[i]
            h_day = bool(hourly_raw.get("is_day", [1])[i])
            h_desc, h_icon = get_weather_meta(h_code, h_day)

            hourly_items.append(HourlyForecastItem(
                time=t_str,
                hour_label=hour_part[:5],
                temperature=round(float(hourly_raw.get("temperature_2m", [0])[i]), 1),
                apparent_temperature=round(float(hourly_raw.get("apparent_temperature", [0])[i]), 1),
                relative_humidity=int(hourly_raw.get("relative_humidity_2m", [0])[i]),
                precipitation_probability=int(hourly_raw.get("precipitation_probability", [0])[i]),
                precipitation=round(float(hourly_raw.get("precipitation", [0])[i]), 1),
                weather_code=h_code,
                weather_description=h_desc,
                weather_icon=h_icon,
                wind_speed=round(float(hourly_raw.get("wind_speed_10m", [0])[i]), 1),
                uv_index=round(float(hourly_raw.get("uv_index", [0])[i]), 1),
                is_day=h_day
            ))

        # Parse daily items (7 days)
        daily_items: List[DailyForecastItem] = []
        daily_times = daily_raw.get("time", [])
        for i in range(min(7, len(daily_times))):
            d_date_str = daily_times[i]
            d_code = daily_raw.get("weather_code", [0])[i]
            d_desc, d_icon = get_weather_meta(d_code, True)
            try:
                dt_obj = datetime.strptime(d_date_str, "%Y-%m-%d")
                day_name = SPANISH_DAYS[dt_obj.weekday()]
                day_short = SPANISH_DAYS_SHORT[dt_obj.weekday()]
            except:
                day_name = d_date_str
                day_short = d_date_str

            daily_items.append(DailyForecastItem(
                date=d_date_str,
                day_name=day_name,
                day_short=day_short,
                temp_max=round(float(daily_raw.get("temperature_2m_max", [0])[i]), 1),
                temp_min=round(float(daily_raw.get("temperature_2m_min", [0])[i]), 1),
                weather_code=d_code,
                weather_description=d_desc,
                weather_icon=d_icon,
                precipitation_sum=round(float(daily_raw.get("precipitation_sum", [0])[i]), 1),
                precipitation_probability_max=int(daily_raw.get("precipitation_probability_max", [0])[i] or 0),
                uv_index_max=round(float(daily_raw.get("uv_index_max", [0])[i] or 0), 1),
                wind_speed_max=round(float(daily_raw.get("wind_speed_10m_max", [0])[i] or 0), 1),
                sunrise=daily_raw.get("sunrise", [""])[i].split("T")[-1] if i < len(daily_raw.get("sunrise", [])) else "",
                sunset=daily_raw.get("sunset", [""])[i].split("T")[-1] if i < len(daily_raw.get("sunset", [])) else ""
            ))

        return FullForecastResponse(
            current=current,
            hourly=hourly_items,
            daily=daily_items
        )

    @classmethod
    def _build_forecast_from_records(
        cls,
        records: List[WeatherRecord],
        city_name: Optional[str],
        department_name: Optional[str],
        region_natural: Optional[str],
        altitude: Optional[int],
        city_id: Optional[int],
        lat: float,
        lon: float,
    ) -> FullForecastResponse:
        """Construye el pronóstico completo a partir de los registros reales del dataset."""
        latest_date = records[0].record_date
        day_rows = [r for r in records if r.record_date == latest_date]

        temps = [r.temperature for r in day_rows if r.temperature is not None]
        mean_t = round(sum(temps) / len(temps), 1) if temps else 20.0
        temp_max = round(
            max((r.temp_max for r in day_rows if r.temp_max is not None), default=mean_t + 3), 1
        )
        temp_min = round(
            min((r.temp_min for r in day_rows if r.temp_min is not None), default=mean_t - 3), 1
        )
        hums = [r.humidity for r in day_rows if r.humidity is not None]
        humidity = int(sum(hums) / len(hums)) if hums else 75
        precip = round(sum((r.precipitation or 0.0) for r in day_rows), 1)
        winds = [r.wind_speed for r in day_rows if r.wind_speed is not None]
        wind = round(sum(winds) / len(winds), 1) if winds else round(10.0 + (lat % 5), 1)
        uvs = [r.uv_index for r in day_rows if r.uv_index is not None]
        uv = round(max(uvs), 1) if uvs else round(max(0.0, mean_t - 14.0), 1)

        condition = next((r.condition for r in day_rows if r.condition), "Reporte Cargado")
        weather_code = _condition_to_code(condition)
        desc, icon = get_weather_meta(weather_code, True)

        current = CurrentWeather(
            temperature=mean_t,
            apparent_temperature=mean_t,
            relative_humidity=humidity,
            wind_speed=wind,
            wind_direction=0,
            wind_gusts=None,
            surface_pressure=1013.25,
            precipitation=precip,
            precipitation_probability=85 if precip > 0.1 else 10,
            cloud_cover=70 if weather_code == 3 else 20,
            uv_index=max(0.0, uv),
            uv_category=get_uv_category(uv),
            weather_code=weather_code,
            weather_description=desc,
            weather_icon=icon,
            is_day=True,
            temp_max=temp_max,
            temp_min=temp_min,
            sunrise="06:00",
            sunset="18:00",
            updated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            city_id=city_id,
            city_name=city_name or "Ubicación en Perú",
            department_name=department_name,
            region_natural=region_natural,
            altitude=altitude,
            latitude=lat,
            longitude=lon,
            data_source="real",
        )

        daily_items: List[DailyForecastItem] = []
        seen: set = set()
        for r in records:
            d = r.record_date
            if d in seen or len(daily_items) >= 7:
                continue
            seen.add(d)
            group = [x for x in records if x.record_date == d]
            gm = [x.temperature for x in group if x.temperature is not None]
            gmean = round(sum(gm) / len(gm), 1) if gm else mean_t
            d_max = round(
                max((x.temp_max for x in group if x.temp_max is not None), default=gmean + 3), 1
            )
            d_min = round(
                min((x.temp_min for x in group if x.temp_min is not None), default=gmean - 3), 1
            )
            d_precip = round(sum((x.precipitation or 0.0) for x in group), 1)
            d_wind = round(
                max((x.wind_speed for x in group if x.wind_speed is not None), default=10.0), 1
            )
            d_uv = round(
                max((x.uv_index for x in group if x.uv_index is not None), default=max(0.0, gmean - 14.0)), 1
            )
            d_cond = next((x.condition for x in group if x.condition), condition)
            d_code = _condition_to_code(d_cond)
            d_desc, d_icon = get_weather_meta(d_code, True)
            dt_obj = datetime.strptime(str(d), "%Y-%m-%d")
            daily_items.append(
                DailyForecastItem(
                    date=str(d),
                    day_name=SPANISH_DAYS[dt_obj.weekday()],
                    day_short=SPANISH_DAYS_SHORT[dt_obj.weekday()],
                    temp_max=d_max,
                    temp_min=d_min,
                    weather_code=d_code,
                    weather_description=d_desc,
                    weather_icon=d_icon,
                    precipitation_sum=d_precip,
                    precipitation_probability_max=85 if d_precip > 0.1 else 10,
                    uv_index_max=d_uv,
                    wind_speed_max=d_wind,
                    sunrise="06:00",
                    sunset="18:00",
                )
            )

        hourly_items: List[HourlyForecastItem] = []
        hour_rows = [r for r in day_rows if r.hour]
        if len(hour_rows) >= 6:
            hour_rows.sort(key=lambda x: x.hour)
            for r in hour_rows[:24]:
                h_code = _condition_to_code(r.condition)
                h_desc, h_icon = get_weather_meta(h_code, True)
                hourly_items.append(
                    HourlyForecastItem(
                        time=f"{r.record_date}T{r.hour:02d}:00",
                        hour_label=f"{r.hour:02d}:00",
                        temperature=round(r.temperature or mean_t, 1),
                        apparent_temperature=round(r.temperature or mean_t, 1),
                        relative_humidity=int(r.humidity or humidity),
                        precipitation_probability=85 if (r.precipitation or 0.0) > 0.1 else 10,
                        precipitation=round(r.precipitation or 0.0, 1),
                        weather_code=h_code,
                        weather_description=h_desc,
                        weather_icon=h_icon,
                        wind_speed=round(r.wind_speed or wind, 1),
                        uv_index=round(r.uv_index or uv, 1),
                        is_day=6 <= (r.hour or 12) <= 18,
                    )
                )

        if not hourly_items:
            import math

            for h in range(24):
                period = math.sin(((h - 6) / 18.0) * math.pi)
                t = temp_min + (temp_max - temp_min) * period
                hourly_items.append(
                    HourlyForecastItem(
                        time=f"{latest_date}T{h:02d}:00",
                        hour_label=f"{h:02d}:00",
                        temperature=round(t, 1),
                        apparent_temperature=round(t, 1),
                        relative_humidity=int(humidity + (10 if h < 6 else -5)),
                        precipitation_probability=85 if precip > 0.1 else 10,
                        precipitation=round(precip / 24, 2),
                        weather_code=weather_code,
                        weather_description=desc,
                        weather_icon=icon,
                        wind_speed=wind,
                        uv_index=max(0.0, round(uv, 1)),
                        is_day=6 <= h <= 18,
                    )
                )

        return FullForecastResponse(current=current, hourly=hourly_items, daily=daily_items)

    @classmethod
    async def get_departments_summary(cls, db: Session) -> List[DepartmentWeatherSummary]:
        departments = db.query(Department).all()
        summaries: List[DepartmentWeatherSummary] = []

        for dept in departments:
            real_row = (
                db.query(WeatherRecord)
                .join(City, City.id == WeatherRecord.city_id)
                .filter(City.department_id == dept.id)
                .order_by(WeatherRecord.record_date.desc(), WeatherRecord.id.desc())
                .first()
            )
            if real_row:
                t_val = real_row.temperature
                cond_str = real_row.condition or "Reporte Cargado"
                rc = _condition_to_code(cond_str)
                r_desc, r_icon = get_weather_meta(rc, True)
                summaries.append(DepartmentWeatherSummary(
                    department_id=dept.id,
                    department_name=dept.name,
                    capital=dept.capital,
                    latitude=dept.latitude,
                    longitude=dept.longitude,
                    region_natural=dept.region_natural,
                    temperature=round(t_val or 0.0, 1),
                    weather_description=r_desc,
                    weather_icon=r_icon,
                    relative_humidity=int(real_row.humidity or 0),
                    precipitation=round(real_row.precipitation or 0.0, 1),
                    uv_index=round(real_row.uv_index or 0.0, 1),
                    wind_speed=round(real_row.wind_speed or 0.0, 1),
                    data_source="real",
                ))
                continue

            try:
                raw = await cls.fetch_open_meteo_raw(dept.latitude, dept.longitude)
                curr = raw.get("current", {})
                w_code = curr.get("weather_code", 0)
                is_day = bool(curr.get("is_day", 1))
                w_desc, w_icon = get_weather_meta(w_code, is_day)

                # Get UV from hourly
                times = raw.get("hourly", {}).get("time", [])
                curr_time = curr.get("time", "")
                idx = times.index(curr_time) if curr_time in times else 0
                uv_val = raw.get("hourly", {}).get("uv_index", [0])[idx] if idx < len(raw.get("hourly", {}).get("uv_index", [])) else 0

                summaries.append(DepartmentWeatherSummary(
                    department_id=dept.id,
                    department_name=dept.name,
                    capital=dept.capital,
                    latitude=dept.latitude,
                    longitude=dept.longitude,
                    region_natural=dept.region_natural,
                    temperature=round(float(curr.get("temperature_2m", 0.0)), 1),
                    weather_description=w_desc,
                    weather_icon=w_icon,
                    relative_humidity=int(curr.get("relative_humidity_2m", 0)),
                    precipitation=round(float(curr.get("precipitation", 0.0)), 1),
                    uv_index=round(float(uv_val), 1),
                    wind_speed=round(float(curr.get("wind_speed_10m", 0.0)), 1),
                    data_source="simulado"
                ))
            except Exception as e:
                print(f"Error fetching summary for {dept.name}: {e}")

        return summaries

    @classmethod
    async def get_history(
        cls,
        city_id: int,
        start_date: str,
        end_date: str,
        variable: str,
        db: Session
    ) -> HistoryResponse:
        city = db.query(City).filter(City.id == city_id).first()
        if not city:
            raise ValueError(f"Ciudad con ID {city_id} no encontrada.")

        real_rows = (
            db.query(WeatherRecord)
            .filter(
                WeatherRecord.city_id == city_id,
                WeatherRecord.record_date >= datetime.strptime(start_date, "%Y-%m-%d").date(),
                WeatherRecord.record_date <= datetime.strptime(end_date, "%Y-%m-%d").date(),
            )
            .all()
        )
        if real_rows:
            return cls._history_from_records(city, real_rows, start_date, end_date, variable)

        url = f"{settings.OPEN_METEO_HISTORICAL_URL}/archive"
        params = {
            "latitude": city.latitude,
            "longitude": city.longitude,
            "start_date": start_date,
            "end_date": end_date,
            "daily": [
                "weather_code", "temperature_2m_max", "temperature_2m_min", "temperature_2m_mean",
                "precipitation_sum", "wind_speed_10m_max"
            ],
            "hourly": ["relative_humidity_2m"],
            "timezone": "America/Lima"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, params=params)
                res.raise_for_status()
                data = res.json()
        except Exception as e:
            print(f"Historical API fallback for {city.name}: {e}")
            # Generate simulated realistic historical data based on city's real climate profile
            return cls._generate_fallback_history(city, start_date, end_date, variable)

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        t_max_list = daily.get("temperature_2m_max", [])
        t_min_list = daily.get("temperature_2m_min", [])
        t_mean_list = daily.get("temperature_2m_mean", [])
        precip_list = daily.get("precipitation_sum", [])
        wind_list = daily.get("wind_speed_10m_max", [])
        w_codes = daily.get("weather_code", [])

        data_points: List[HistoryDataPoint] = []
        val_for_stats: List[float] = []

        for i in range(len(dates)):
            t_mean = t_mean_list[i] if i < len(t_mean_list) and t_mean_list[i] is not None else (t_max_list[i] + t_min_list[i]) / 2 if i < len(t_max_list) else 20.0
            p_sum = precip_list[i] if i < len(precip_list) and precip_list[i] is not None else 0.0
            w_max = wind_list[i] if i < len(wind_list) and wind_list[i] is not None else 10.0
            t_mx = t_max_list[i] if i < len(t_max_list) else 22.0
            t_mn = t_min_list[i] if i < len(t_min_list) else 15.0

            dp = HistoryDataPoint(
                date=dates[i],
                temp_max=round(float(t_mx), 1),
                temp_min=round(float(t_mn), 1),
                temp_mean=round(float(t_mean), 1),
                precipitation_sum=round(float(p_sum), 1),
                wind_speed_max=round(float(w_max), 1),
                relative_humidity_mean=75.0,
                weather_code=w_codes[i] if i < len(w_codes) else 0
            )
            data_points.append(dp)

            if variable == "temperature":
                val_for_stats.append(dp.temp_mean)
            elif variable == "precipitation":
                val_for_stats.append(dp.precipitation_sum)
            elif variable == "wind":
                val_for_stats.append(dp.wind_speed_max)
            else:
                val_for_stats.append(dp.temp_mean)

        if not val_for_stats:
            val_for_stats = [20.0]

        avg_val = sum(val_for_stats) / len(val_for_stats)
        max_val = max(val_for_stats)
        min_val = min(val_for_stats)

        # Calculate trend
        trend = "estable"
        if len(val_for_stats) > 3:
            first_half = sum(val_for_stats[:len(val_for_stats)//2]) / (len(val_for_stats)//2)
            second_half = sum(val_for_stats[len(val_for_stats)//2:]) / (len(val_for_stats) - len(val_for_stats)//2)
            if second_half - first_half > 0.8:
                trend = "ascendente"
            elif first_half - second_half > 0.8:
                trend = "descendente"

        stats = HistoryStats(
            average=round(avg_val, 2),
            maximum=round(max_val, 2),
            minimum=round(min_val, 2),
            trend=trend,
            total_precipitation=round(sum(precip_list), 1) if precip_list else 0.0,
            days_analyzed=len(data_points)
        )

        return HistoryResponse(
            city_id=city.id,
            city_name=city.name,
            department_name=city.department.name,
            variable=variable,
            start_date=start_date,
            end_date=end_date,
            stats=stats,
            data=data_points,
            data_source="simulado"
        )

    @classmethod
    def _history_from_records(
        cls,
        city: City,
        records: List[WeatherRecord],
        start_date: str,
        end_date: str,
        variable: str,
    ) -> HistoryResponse:
        """Construye el histórico agregando por día los registros reales del dataset."""
        grouped: Dict[Any, List[WeatherRecord]] = {}
        for r in records:
            grouped.setdefault(r.record_date, []).append(r)

        data_points: List[HistoryDataPoint] = []
        val_for_stats: List[float] = []

        for d in sorted(grouped.keys()):
            group = grouped[d]
            t_mean = round(sum((x.temperature or 0.0) for x in group) / len(group), 1)
            t_max = round(max((x.temp_max for x in group if x.temp_max is not None), default=t_mean + 3), 1)
            t_min = round(min((x.temp_min for x in group if x.temp_min is not None), default=t_mean - 3), 1)
            p_sum = round(sum((x.precipitation or 0.0) for x in group), 1)
            w_max = round(max((x.wind_speed for x in group if x.wind_speed is not None), default=10.0), 1)
            hum_mean = int(sum((x.humidity or 0.0) for x in group) / len(group))
            cond_val = next((x.condition for x in group if x.condition), "Reporte Cargado")

            data_points.append(HistoryDataPoint(
                date=str(d),
                temp_max=t_max,
                temp_min=t_min,
                temp_mean=t_mean,
                precipitation_sum=p_sum,
                wind_speed_max=w_max,
                relative_humidity_mean=hum_mean,
                weather_code=_condition_to_code(cond_val),
            ))

            if variable == "temperature":
                val_for_stats.append(t_mean)
            elif variable == "precipitation":
                val_for_stats.append(p_sum)
            elif variable == "wind":
                val_for_stats.append(w_max)
            else:
                val_for_stats.append(t_mean)

        if not val_for_stats:
            val_for_stats = [20.0]

        avg_val = sum(val_for_stats) / len(val_for_stats)
        trend = "estable"
        if len(val_for_stats) > 3:
            mid = len(val_for_stats) // 2
            first_half = sum(val_for_stats[:mid]) / mid
            second_half = sum(val_for_stats[mid:]) / (len(val_for_stats) - mid)
            if second_half - first_half > 0.8:
                trend = "ascendente"
            elif first_half - second_half > 0.8:
                trend = "descendente"

        return HistoryResponse(
            city_id=city.id,
            city_name=city.name,
            department_name=city.department.name,
            variable=variable,
            start_date=start_date,
            end_date=end_date,
            stats=HistoryStats(
                average=round(avg_val, 2),
                maximum=round(max(val_for_stats), 2),
                minimum=round(min(val_for_stats), 2),
                trend=trend,
                total_precipitation=round(sum(dp.precipitation_sum or 0.0 for dp in data_points), 1),
                days_analyzed=len(data_points),
            ),
            data=data_points,
            data_source="real",
        )

    @classmethod
    def _generate_fallback_history(cls, city: City, start_date: str, end_date: str, variable: str) -> HistoryResponse:
        import math
        try:
            d_start = datetime.strptime(start_date, "%Y-%m-%d")
            d_end = datetime.strptime(end_date, "%Y-%m-%d")
        except:
            d_start = datetime.now() - timedelta(days=30)
            d_end = datetime.now()

        days = (d_end - d_start).days + 1
        data_points = []
        base_temp = 21.0 if city.department.region_natural == "Costa" else 14.0 if city.department.region_natural == "Sierra" else 28.0
        val_for_stats = []

        for i in range(days):
            cur_d = d_start + timedelta(days=i)
            cur_d_str = cur_d.strftime("%Y-%m-%d")
            # subtle sinusoidal variation
            variation = math.sin(i * 0.4) * 2.5 + ((i % 5) - 2) * 0.5
            t_mean = base_temp + variation
            t_max = t_mean + 4.5
            t_min = t_mean - 4.5
            p_sum = max(0.0, round((math.cos(i * 0.7) * 3.0) if city.department.region_natural != "Costa" else 0.2, 1))
            w_max = max(5.0, round(12.0 + math.sin(i * 0.3) * 4.0, 1))

            dp = HistoryDataPoint(
                date=cur_d_str,
                temp_max=round(t_max, 1),
                temp_min=round(t_min, 1),
                temp_mean=round(t_mean, 1),
                precipitation_sum=p_sum,
                wind_speed_max=w_max,
                relative_humidity_mean=78.0,
                weather_code=1 if p_sum == 0 else 61
            )
            data_points.append(dp)
            if variable == "temperature":
                val_for_stats.append(dp.temp_mean)
            elif variable == "precipitation":
                val_for_stats.append(dp.precipitation_sum)
            elif variable == "wind":
                val_for_stats.append(dp.wind_speed_max)
            else:
                val_for_stats.append(dp.temp_mean)

        avg_val = sum(val_for_stats) / len(val_for_stats)
        return HistoryResponse(
            city_id=city.id,
            city_name=city.name,
            department_name=city.department.name,
            variable=variable,
            start_date=start_date,
            end_date=end_date,
            stats=HistoryStats(
                average=round(avg_val, 2),
                maximum=round(max(val_for_stats), 2),
                minimum=round(min(val_for_stats), 2),
                trend="estable",
                total_precipitation=round(sum(dp.precipitation_sum for dp in data_points), 1),
                days_analyzed=len(data_points)
            ),
            data=data_points,
            data_source="simulado"
        )
