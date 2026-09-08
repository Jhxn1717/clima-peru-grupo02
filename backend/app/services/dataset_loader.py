from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.peru_geo import City
from app.models.weather_record import WeatherRecord

BATCH_SIZE = 2000


def _norm(value: str) -> str:
    """Normaliza un nombre de estación/ciudad para comparación aproximada."""
    s = (
        str(value)
        .lower()
        .replace("estación", " ")
        .replace("estacion", " ")
        .replace("senamhi", " ")
        .replace("del", " ")
        .replace("-", " ")
        .replace("_", " ")
        .strip()
    )
    return re.sub(r"\s+", " ", s).strip()


def _norm_dept(value: str) -> str:
    s = str(value).lower().replace("-", " ").replace("_", " ").strip()
    return re.sub(r"\s+", " ", s).replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ñ", "n").strip()


def build_city_lookup(db: Session) -> Tuple[Dict[str, City], Dict[str, List[City]], Dict[str, City]]:
    """Índices para resolver estaciones del CSV a ciudades conocidas."""
    cities = db.query(City).all()
    by_name: Dict[str, City] = {}
    by_dept: Dict[str, List[City]] = {}
    by_province: Dict[str, City] = {}
    for city in cities:
        by_name[_norm(city.name)] = city
        dept = city.department.name if city.department else str(city.department_id)
        by_dept.setdefault(_norm_dept(dept), []).append(city)
        if city.province:
            by_province.setdefault(_norm(city.province), city)
    return by_name, by_dept, by_province


def resolve_city(
    station: str,
    department: str,
    by_name: Dict[str, City],
    by_dept: Dict[str, List[City]],
    by_province: Optional[Dict[str, City]] = None,
    province: Optional[str] = None,
) -> Tuple[Optional[City], str]:
    """Resuelve una estación del CSV a una ciudad del sistema.

    Orden de resolución:
      1. Nombre de estación idéntico a una ciudad conocida.
      2. Provincia (columna 'provincia' o 'city.province') indexada a una ciudad.
      3. Substring del nombre de estación dentro de las ciudades del departamento.
      4. Substring de la provincia dentro de las ciudades del departamento.
      5. Fallback a la capital del departamento.

    Devuelve (ciudad o None, método usado) para poder reportar asignaciones.
    """
    norm_station = _norm(station)

    if norm_station in by_name:
        return by_name[norm_station], "exact"

    dept_key = _norm_dept(department) if department else ""
    candidates = by_dept.get(dept_key, []) if dept_key else []

    if province:
        province_key = _norm(province)
        if by_province and province_key in by_province:
            p = by_province[province_key]
            p_dept = p.department.name if p.department else ""
            if not dept_key or not candidates or _norm_dept(p_dept) == dept_key:
                return p, "province"

    for city in candidates:
        norm_city = _norm(city.name)
        if norm_city and (norm_city in norm_station or norm_station in norm_city):
            return city, "dept_substring"

    if province:
        province_key = _norm(province)
        for city in candidates:
            norm_city = _norm(city.name)
            if norm_city and (province_key in norm_city or norm_city in province_key):
                return city, "province_substring"

    for city in candidates:
        if getattr(city, "is_capital", False):
            return city, "capital_fallback"

    return None, ""


def upsert_weather_records(db: Session, records: List[WeatherRecord]) -> Tuple[int, int]:
    """Inserta o actualiza registros por lotes (upsert en (city_id, record_date, hour))."""
    inserted = 0
    updated = 0

    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]

        if db.bind.dialect.name == "postgresql":
            values = [
                {
                    col.key: getattr(rec, col.key)
                    for col in WeatherRecord.__table__.columns
                    if col.key != "id"
                }
                for rec in batch
            ]
            stmt = pg_insert(WeatherRecord).values(values)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_weather_records_city_date_hour",
                set_={
                    "temperature": stmt.excluded.temperature,
                    "temp_min": stmt.excluded.temp_min,
                    "temp_max": stmt.excluded.temp_max,
                    "humidity": stmt.excluded.humidity,
                    "precipitation": stmt.excluded.precipitation,
                    "wind_speed": stmt.excluded.wind_speed,
                    "uv_index": stmt.excluded.uv_index,
                    "condition": stmt.excluded.condition,
                    "source": stmt.excluded.source,
                },
            )
            result = db.execute(stmt)
            inserted += result.rowcount
        else:
            db.bulk_save_objects(batch)
            inserted += len(batch)

    db.commit()
    return inserted, updated