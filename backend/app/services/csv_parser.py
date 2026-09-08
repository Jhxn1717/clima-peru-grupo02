import io
import csv
import re
from typing import List, Dict, Any, Optional, Tuple


def _split_date_hour(value: Any) -> Tuple[Any, Optional[int]]:
    """Separa una fecha (YYYY-MM-DD) de una parte horaria si viene incluida (T o espacio)."""
    if value is None:
        return value, None
    v = str(value).strip()
    if "T" in v:
        date_part, time_part = v.split("T", 1)
    elif " " in v:
        date_part, time_part = v.split(" ", 1)
    else:
        return v, None
    m = re.match(r"^(\d{1,2})", time_part)
    if m:
        h = int(m.group(1))
        return date_part, h if 0 <= h <= 23 else None
    return date_part, None


def parse_weather_csv(content: bytes, filename: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Parsea el 100% de las filas de un CSV meteorológico del Perú y calcula sus stats.

    Devuelve (parsed_rows, stats). parsed_rows conserva todas las filas (pueden ser
    decenas de miles); el llamador decide cómo limitar el preview.
    """
    # Intenta decodificar con UTF-8 BOM (utf-8-sig), luego UTF-8 y finalmente Latin-1
    try:
        content_str = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            content_str = content.decode("utf-8")
        except UnicodeDecodeError:
            content_str = content.decode("latin-1", errors="replace")

    # Detecta delimitador
    first_lines = content_str[:2000]
    delimiter = ";" if first_lines.count(";") > first_lines.count(",") else ","

    reader = csv.reader(io.StringIO(content_str), delimiter=delimiter)
    raw_rows = list(reader)

    if not raw_rows:
        raise ValueError("El archivo CSV no contiene registros.")

    # Busca encabezado en las primeras 15 filas
    header_index = -1
    header_keys = []

    for idx, row in enumerate(raw_rows[:15]):
        cleaned_row = [str(col).strip().lower() for col in row if str(col).strip()]
        if any(k in " ".join(cleaned_row) for k in ["fecha", "date", "hora", "time", "temp", "temperatura", "ciudad", "city", "departamento"]):
            header_index = idx
            header_keys = [str(col).strip().lower() for col in row]
            break

    if header_index == -1:
        header_index = 0
        header_keys = [str(col).strip().lower() for col in raw_rows[0]]

    # Mapea índices de columnas
    col_map: Dict[str, int] = {}
    for col_idx, col_name in enumerate(header_keys):
        norm_name = re.sub(r'[^a-z0-9_]', '', col_name)
        if any(x in norm_name for x in ["fecha", "date", "dia"]):
            col_map.setdefault("date", col_idx)
        elif any(x in norm_name for x in ["hora", "hour", "time"]):
            col_map.setdefault("hour", col_idx)
            col_map.setdefault("date", col_idx)
        elif any(x in norm_name for x in ["ciudad", "city", "estacion", "location"]):
            col_map.setdefault("city", col_idx)
        elif any(x in norm_name for x in ["departamento", "department", "region"]):
            col_map.setdefault("department", col_idx)
        elif any(x in norm_name for x in ["provincia", "province"]):
            col_map.setdefault("province", col_idx)
        elif any(x in norm_name for x in ["temp_max", "maxima", "tmax"]):
            col_map.setdefault("temp_max", col_idx)
        elif any(x in norm_name for x in ["temp_min", "minima", "tmin"]):
            col_map.setdefault("temp_min", col_idx)
        elif any(x in norm_name for x in ["temp_mean", "media", "tmean", "temp", "temperatura"]):
            col_map.setdefault("temperature", col_idx)
        elif any(x in norm_name for x in ["hum", "humedad", "relative_humidity"]):
            col_map.setdefault("humidity", col_idx)
        elif any(x in norm_name for x in ["precip", "precipitacion", "lluvia", "rain"]):
            col_map.setdefault("precipitation", col_idx)
        elif any(x in norm_name for x in ["viento", "wind", "speed", "velocidad"]):
            col_map.setdefault("wind_speed", col_idx)
        elif any(x in norm_name for x in ["uv", "indice_uv"]):
            col_map.setdefault("uv_index", col_idx)
        elif any(x in norm_name for x in ["condicion", "condition", "descripcion", "clima", "weather"]):
            col_map.setdefault("condition", col_idx)

    parsed_rows: List[Dict[str, Any]] = []
    temps: List[float] = []
    precips: List[float] = []
    winds: List[float] = []
    uvs: List[float] = []
    cities_found = set()
    dates_found = []

    def clean_float(val: Any) -> Optional[float]:
        if val is None:
            return None
        val_str = str(val).strip().replace("°C", "").replace("°", "").replace("km/h", "").replace("%", "").replace("mm", "").replace(",", ".").strip()
        try:
            return round(float(val_str), 2)
        except ValueError:
            return None

    for row_idx in range(header_index + 1, len(raw_rows)):
        row = raw_rows[row_idx]
        if not row or not any(str(c).strip() for c in row):
            continue

        row_str = " ".join([str(c) for c in row]).lower()
        if "---" in row_str or "reporte de" in row_str:
            continue

        date_raw = str(row[col_map["date"]]).strip() if "date" in col_map and col_map["date"] < len(row) else ""
        date_val, hour_val = _split_date_hour(date_raw)
        if not date_val:
            date_val = f"Fila {row_idx}"

        hour_col = str(row[col_map["hour"]]).strip() if "hour" in col_map and col_map["hour"] < len(row) else ""
        if hour_val is None and hour_col:
            m = re.match(r"^(\d{1,2})", hour_col)
            if m:
                h = int(m.group(1))
                if 0 <= h <= 23:
                    hour_val = h

        city_val = str(row[col_map["city"]]).strip() if "city" in col_map and col_map["city"] < len(row) else "Perú"
        dept_val = str(row[col_map["department"]]).strip() if "department" in col_map and col_map["department"] < len(row) else ""
        prov_val = str(row[col_map["province"]]).strip() if "province" in col_map and col_map["province"] < len(row) else ""
        cond_val = str(row[col_map["condition"]]).strip() if "condition" in col_map and col_map["condition"] < len(row) else "Reporte Cargado"

        temp_val = clean_float(row[col_map["temperature"]]) if "temperature" in col_map and col_map["temperature"] < len(row) else None
        temp_max = clean_float(row[col_map["temp_max"]]) if "temp_max" in col_map and col_map["temp_max"] < len(row) else temp_val
        temp_min = clean_float(row[col_map["temp_min"]]) if "temp_min" in col_map and col_map["temp_min"] < len(row) else temp_val
        humidity_val = clean_float(row[col_map["humidity"]]) if "humidity" in col_map and col_map["humidity"] < len(row) else None
        precip_val = clean_float(row[col_map["precipitation"]]) if "precipitation" in col_map and col_map["precipitation"] < len(row) else 0.0
        wind_val = clean_float(row[col_map["wind_speed"]]) if "wind_speed" in col_map and col_map["wind_speed"] < len(row) else None
        uv_val = clean_float(row[col_map["uv_index"]]) if "uv_index" in col_map and col_map["uv_index"] < len(row) else None

        if temp_val is None and temp_max is not None and temp_min is not None:
            temp_val = round((temp_max + temp_min) / 2, 1)

        if temp_val is not None:
            temps.append(temp_val)
        if precip_val is not None:
            precips.append(precip_val)
        if wind_val is not None:
            winds.append(wind_val)
        if uv_val is not None:
            uvs.append(uv_val)

        if city_val and city_val != "Perú":
            cities_found.add(city_val)
        if date_val:
            dates_found.append(date_val)

        parsed_rows.append({
            "id": len(parsed_rows) + 1,
            "date": date_val,
            "hour": hour_val,
            "city": city_val,
            "department": dept_val,
            "province": prov_val,
            "temperature": temp_val,
            "temp_max": temp_max,
            "temp_min": temp_min,
            "humidity": humidity_val,
            "precipitation": precip_val or 0.0,
            "wind_speed": wind_val,
            "uv_index": uv_val,
            "condition": cond_val,
        })

    if not parsed_rows:
        raise ValueError("No se pudieron extraer filas de datos válidas del archivo CSV.")

    stats = {
        "total_records": len(parsed_rows),
        "detected_city": list(cities_found)[0] if cities_found else "Perú (Archivo Subido)",
        "all_cities": list(cities_found),
        "start_date": dates_found[0] if dates_found else "-",
        "end_date": dates_found[-1] if dates_found else "-",
        "temperature": {
            "average": round(sum(temps) / len(temps), 1) if temps else 0.0,
            "max": max(temps) if temps else 0.0,
            "min": min(temps) if temps else 0.0,
        },
        "precipitation": {
            "total": round(sum(precips), 1) if precips else 0.0,
            "max_single_day": max(precips) if precips else 0.0,
            "rainy_days": sum(1 for p in precips if p > 0.1),
        },
        "wind": {
            "average": round(sum(winds) / len(winds), 1) if winds else 0.0,
            "max": max(winds) if winds else 0.0,
        },
        "uv": {
            "average": round(sum(uvs) / len(uvs), 1) if uvs else 0.0,
            "max": max(uvs) if uvs else 0.0,
        },
    }

    return parsed_rows, stats