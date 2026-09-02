import io
import csv
import re
from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models.peru_geo import City
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/export", tags=["Exportación e Importación de Datos"])

@router.get("/csv")
async def export_weather_csv(
    city_id: int = Query(..., description="ID de la ciudad"),
    export_type: str = Query("forecast", description="Tipo de exportación: forecast o history"),
    days: int = Query(30, description="Días históricos si export_type=history"),
    db: Session = Depends(get_db)
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada")

    output = io.StringIO()
    writer = csv.writer(output)

    dept_name = city.department.name if city.department else ""

    if export_type == "history":
        end_d = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        start_d = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        history = await WeatherService.get_history(city_id, start_d, end_d, "all", db)

        writer.writerow(["SISTEMA DE CLIMA Y DATOS METEOROLOGICOS DEL PERU"])
        writer.writerow(["Reporte Historico de", city.name, f"({dept_name})"])
        writer.writerow(["Periodo", start_d, "al", end_d])
        writer.writerow(["Promedio", f"{history.stats.average}°C", "Maximo", f"{history.stats.maximum}°C", "Minimo", f"{history.stats.minimum}°C"])
        writer.writerow([])
        writer.writerow(["Fecha", "Temp Max (°C)", "Temp Min (°C)", "Temp Media (°C)", "Precipitacion (mm)", "Viento Max (km/h)"])

        for dp in history.data:
            writer.writerow([
                dp.date,
                dp.temp_max,
                dp.temp_min,
                dp.temp_mean,
                dp.precipitation_sum,
                dp.wind_speed_max
            ])

        filename = f"clima_historico_{city.name.lower().replace(' ', '_')}_{start_d}_{end_d}.csv"

    else:
        # Forecast CSV
        forecast = await WeatherService.get_forecast(lat=city.latitude, lon=city.longitude, city_id=city.id, db=db)

        writer.writerow(["SISTEMA DE CLIMA Y DATOS METEOROLOGICOS DEL PERU"])
        writer.writerow(["Reporte de Pronostico", city.name, f"({dept_name})"])
        writer.writerow(["Fecha Emision", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow(["Clima Actual", f"{forecast.current.temperature}°C", forecast.current.weather_description])
        writer.writerow(["Humedad", f"{forecast.current.relative_humidity}%", "Viento", f"{forecast.current.wind_speed} km/h", "Indice UV", forecast.current.uv_index])
        writer.writerow([])
        writer.writerow(["--- PRONOSTICO HORARIO (PROXIMAS 24 HORAS) ---"])
        writer.writerow(["Hora", "Temperatura (°C)", "Sensacion (°C)", "Humedad (%)", "Prob. Lluvia (%)", "Precipitacion (mm)", "Viento (km/h)", "UV", "Condicion"])

        for h in forecast.hourly:
            writer.writerow([
                h.time,
                h.temperature,
                h.apparent_temperature,
                h.relative_humidity,
                h.precipitation_probability,
                h.precipitation,
                h.wind_speed,
                h.uv_index,
                h.weather_description
            ])

        writer.writerow([])
        writer.writerow(["--- PRONOSTICO DIARIO (PROXIMOS 7 DIAS) ---"])
        writer.writerow(["Fecha", "Dia", "Temp Max (°C)", "Temp Min (°C)", "Lluvia (mm)", "Prob. Lluvia (%)", "UV Max", "Viento Max (km/h)", "Condicion"])

        for d in forecast.daily:
            writer.writerow([
                d.date,
                d.day_name,
                d.temp_max,
                d.temp_min,
                d.precipitation_sum,
                d.precipitation_probability_max,
                d.uv_index_max,
                d.wind_speed_max,
                d.weather_description
            ])

        filename = f"pronostico_{city.name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/template")
async def get_csv_template():
    """Descarga una plantilla modelo de archivo CSV para registro de datos meteorológicos"""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Fecha", "Ciudad", "Departamento", "Temperatura", "Temp_Min", "Temp_Max", "Humedad", "Precipitacion", "Viento", "UV", "Condicion"])
    sample_rows = [
        ["2026-08-25", "Lima", "Lima", 20.5, 17.2, 22.8, 78, 0.0, 14.5, 7, "Parcialmente nublado"],
        ["2026-08-26", "Lima", "Lima", 21.0, 16.9, 23.4, 76, 0.0, 15.2, 8, "Soleado con cielo despejado"],
        ["2026-08-27", "Lima", "Lima", 19.8, 17.0, 21.5, 82, 0.2, 16.0, 6, "Nublado con llovizna dispersa"],
        ["2026-08-28", "Lima", "Lima", 20.2, 16.8, 22.1, 80, 0.0, 13.8, 7, "Parcialmente nublado"],
        ["2026-08-29", "Lima", "Lima", 21.5, 17.5, 24.0, 75, 0.0, 14.0, 8, "Cielo claro y despejado"],
    ]
    for row in sample_rows:
        writer.writerow(row)

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=plantilla_meteorologica_peru.csv",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.post("/import-csv")
async def import_weather_csv(
    file: UploadFile = File(..., description="Archivo CSV con datos meteorológicos")
):
    """Procesa y valida un archivo CSV con series de tiempo o mediciones climáticas del Perú"""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="El archivo subido debe tener extensión .csv")

    try:
        content_bytes = await file.read()
        if len(content_bytes) == 0:
            raise HTTPException(status_code=400, detail="El archivo CSV está vacío.")

        # Try decoding with UTF-8 BOM (utf-8-sig), then UTF-8, then fallback to Latin-1
        try:
            content_str = content_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                content_str = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content_str = content_bytes.decode("latin-1", errors="replace")

        # Detect delimiter
        first_lines = content_str[:2000]
        delimiter = ";" if first_lines.count(";") > first_lines.count(",") else ","

        reader = csv.reader(io.StringIO(content_str), delimiter=delimiter)
        raw_rows = list(reader)

        if not raw_rows:
            raise HTTPException(status_code=400, detail="El archivo CSV no contiene registros.")

        # Find header index (look for words like fecha, temp, date, hora, etc.)
        header_index = -1
        header_keys = []
        
        for idx, row in enumerate(raw_rows[:15]): # Check first 15 rows for header
            cleaned_row = [str(col).strip().lower() for col in row if str(col).strip()]
            if any(k in " ".join(cleaned_row) for k in ["fecha", "date", "hora", "time", "temp", "temperatura", "ciudad", "city", "departamento"]):
                header_index = idx
                header_keys = [str(col).strip().lower() for col in row]
                break

        if header_index == -1:
            header_index = 0
            header_keys = [str(col).strip().lower() for col in raw_rows[0]]

        # Map column indices
        col_map = {}
        for col_idx, col_name in enumerate(header_keys):
            norm_name = re.sub(r'[^a-z0-9_]', '', col_name)
            if any(x in norm_name for x in ["fecha", "date", "time", "hora", "dia"]):
                col_map.setdefault("date", col_idx)
            elif any(x in norm_name for x in ["ciudad", "city", "estacion", "location"]):
                col_map.setdefault("city", col_idx)
            elif any(x in norm_name for x in ["departamento", "department", "region"]):
                col_map.setdefault("department", col_idx)
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

        # Process 100% of rows in the CSV file
        for row_idx in range(header_index + 1, len(raw_rows)):
            row = raw_rows[row_idx]
            if not row or not any(str(c).strip() for c in row):
                continue

            row_str = " ".join([str(c) for c in row]).lower()
            if "---" in row_str or "reporte de" in row_str:
                continue

            date_val = str(row[col_map["date"]]).strip() if "date" in col_map and col_map["date"] < len(row) else f"Fila {row_idx}"
            city_val = str(row[col_map["city"]]).strip() if "city" in col_map and col_map["city"] < len(row) else "Perú"
            dept_val = str(row[col_map["department"]]).strip() if "department" in col_map and col_map["department"] < len(row) else ""
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

            parsed_item = {
                "id": len(parsed_rows) + 1,
                "date": date_val,
                "city": city_val,
                "department": dept_val,
                "temperature": temp_val,
                "temp_max": temp_max,
                "temp_min": temp_min,
                "humidity": humidity_val,
                "precipitation": precip_val or 0.0,
                "wind_speed": wind_val,
                "uv_index": uv_val,
                "condition": cond_val
            }
            parsed_rows.append(parsed_item)

        if not parsed_rows:
            raise HTTPException(status_code=400, detail="No se pudieron extraer filas de datos válidas del archivo CSV.")

        stats = {
            "total_records": len(parsed_rows),
            "filename": file.filename,
            "detected_city": list(cities_found)[0] if cities_found else "Perú (Archivo Subido)",
            "all_cities": list(cities_found),
            "start_date": dates_found[0] if dates_found else "-",
            "end_date": dates_found[-1] if dates_found else "-",
            "temperature": {
                "average": round(sum(temps) / len(temps), 1) if temps else 0.0,
                "max": max(temps) if temps else 0.0,
                "min": min(temps) if temps else 0.0
            },
            "precipitation": {
                "total": round(sum(precips), 1) if precips else 0.0,
                "max_single_day": max(precips) if precips else 0.0,
                "rainy_days": sum(1 for p in precips if p > 0.1)
            },
            "wind": {
                "average": round(sum(winds) / len(winds), 1) if winds else 0.0,
                "max": max(winds) if winds else 0.0
            },
            "uv": {
                "average": round(sum(uvs) / len(uvs), 1) if uvs else 0.0,
                "max": max(uvs) if uvs else 0.0
            }
        }

        return {
            "success": True,
            "message": f"Se procesaron con éxito {len(parsed_rows)} registros del archivo {file.filename}",
            "stats": stats,
            "data": parsed_rows
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo CSV: {str(e)}")

