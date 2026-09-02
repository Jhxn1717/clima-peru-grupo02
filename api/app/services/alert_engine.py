from datetime import datetime
from typing import List
from app.schemas.alert import WeatherAlert, AlertsResponse
from app.schemas.weather import CurrentWeather

class AlertEngine:
    @staticmethod
    def evaluate_weather_alerts(current: CurrentWeather) -> List[WeatherAlert]:
        alerts: List[WeatherAlert] = []
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

        # 1. Radiación UV Extrema / Alta
        if current.uv_index >= 11.0:
            alerts.append(WeatherAlert(
                id=f"uv_extreme_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Radiación UV en Nivel Extremo",
                severity="danger",
                severity_label="Peligro",
                category="uv",
                icon="SunAlert",
                description=f"Se registra un índice UV de {current.uv_index}, nivel considerado extremadamente peligroso para la piel y la vista.",
                recommendation="Evite la exposición directa al sol entre las 10:00 y 16:00. Use protector solar FPS 50+, sombrero de ala ancha, gafas con filtro UV y ropa de manga larga.",
                trigger_value=f"{current.uv_index} UV",
                threshold=">= 11.0 UV",
                timestamp=now_str
            ))
        elif current.uv_index >= 8.0:
            alerts.append(WeatherAlert(
                id=f"uv_high_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Radiación UV Muy Alta",
                severity="warning",
                severity_label="Advertencia",
                category="uv",
                icon="Sun",
                description=f"Índice UV elevado de {current.uv_index}. Requiere medidas de protección solar obligatorias.",
                recommendation="Use protector solar, sombrilla y busque zonas de sombra. Mantenga hidratación constante.",
                trigger_value=f"{current.uv_index} UV",
                threshold=">= 8.0 UV",
                timestamp=now_str
            ))

        # 2. Ola de Calor / Temperaturas Extremas Altas
        if current.temperature >= 35.0:
            alerts.append(WeatherAlert(
                id=f"heat_danger_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Alerta Roja por Calor Extremo",
                severity="danger",
                severity_label="Peligro",
                category="temperature",
                icon="Flame",
                description=f"Temperatura extrema de {current.temperature}°C con sensación térmica de {current.apparent_temperature}°C.",
                recommendation="Riesgo de golpe de calor y deshidratación severa. Consuma abundantes líquidos frescos y proteja a niños y adultos mayores.",
                trigger_value=f"{current.temperature}°C",
                threshold=">= 35.0°C",
                timestamp=now_str
            ))
        elif current.temperature >= 31.0:
            alerts.append(WeatherAlert(
                id=f"heat_warning_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Temperaturas Elevadas",
                severity="warning",
                severity_label="Advertencia",
                category="temperature",
                icon="ThermometerSun",
                description=f"Temperatura alta de {current.temperature}°C en la zona.",
                recommendation="Mantenerse en lugares ventilados e hidratarse adecuadamente.",
                trigger_value=f"{current.temperature}°C",
                threshold=">= 31.0°C",
                timestamp=now_str
            ))

        # 3. Heladas Meteorológicas / Bajas Temperaturas (Común en la Sierra peruana)
        if current.temp_min <= 0.0 or current.temperature <= 2.0:
            sev = "danger" if current.temperature <= 0.0 else "warning"
            alerts.append(WeatherAlert(
                id=f"frost_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Aviso de Heladas y Bajas Temperaturas",
                severity=sev,
                severity_label="Peligro" if sev == "danger" else "Advertencia",
                category="frost",
                icon="Snowflake",
                description=f"Temperatura mínima proyectada de {current.temp_min}°C (actual {current.temperature}°C) propensa a heladas y escarcha.",
                recommendation="Abrigarse adecuadamente con prendas térmicas, proteger animales de granja y cultivos sensibles a heladas nocturnas.",
                trigger_value=f"{current.temperature}°C (Mín: {current.temp_min}°C)",
                threshold="<= 2.0°C",
                timestamp=now_str
            ))
        elif current.temperature <= 8.0 and current.region_natural == "Sierra":
            alerts.append(WeatherAlert(
                id=f"cold_caution_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Descenso Térmico Nocturno",
                severity="caution",
                severity_label="Precaución",
                category="frost",
                icon="ThermometerSnowflake",
                description=f"Ambiente frío con temperatura de {current.temperature}°C.",
                recommendation="Vestir ropa abrigadora durante la noche y madrugada.",
                trigger_value=f"{current.temperature}°C",
                threshold="<= 8.0°C",
                timestamp=now_str
            ))

        # 4. Precipitaciones Fuertes / Lluvias Torrenciales
        if current.precipitation >= 10.0:
            alerts.append(WeatherAlert(
                id=f"rain_danger_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Precipitaciones Intensas / Riesgo Pluvial",
                severity="danger",
                severity_label="Peligro",
                category="rain",
                icon="CloudRainWind",
                description=f"Tasa de precipitación activa de {current.precipitation} mm. Posibilidad de anegamientos o activación de quebradas.",
                recommendation="Evite transitar cerca de laderas inestables o cauces de ríos. Conduzca con extrema precaución y limpie canaletas.",
                trigger_value=f"{current.precipitation} mm",
                threshold=">= 10.0 mm/h",
                timestamp=now_str
            ))
        elif current.precipitation >= 3.0:
            alerts.append(WeatherAlert(
                id=f"rain_warning_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Lluvias Moderadas a Fuertes",
                severity="warning",
                severity_label="Advertencia",
                category="rain",
                icon="CloudRain",
                description=f"Lluvia constante de {current.precipitation} mm en el sector.",
                recommendation="Portar paraguas o impermeable. Pavimento resbaladizo.",
                trigger_value=f"{current.precipitation} mm",
                threshold=">= 3.0 mm/h",
                timestamp=now_str
            ))
        elif (current.precipitation_probability or 0) >= 70:
            alerts.append(WeatherAlert(
                id=f"rain_pop_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Alta Probabilidad de Lluvia",
                severity="caution",
                severity_label="Precaución",
                category="rain",
                icon="CloudSunRain",
                description=f"Probabilidad de lluvia estimada en {current.precipitation_probability}%.",
                recommendation="Considere llevar paraguas o prendas impermeables para sus traslados.",
                trigger_value=f"{current.precipitation_probability}% prob.",
                threshold=">= 70%",
                timestamp=now_str
            ))

        # 5. Vientos Fuertes (e.g. Vientos Paracas o ráfagas andinas)
        if current.wind_speed >= 40.0:
            alerts.append(WeatherAlert(
                id=f"wind_danger_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Vientos Fuertes / Ráfagas Peligrosas",
                severity="danger",
                severity_label="Peligro",
                category="wind",
                icon="Wind",
                description=f"Velocidad de viento sostenida de {current.wind_speed} km/h{' con ráfagas de ' + str(current.wind_gusts) + ' km/h' if current.wind_gusts else ''}.",
                recommendation="Asegure techos de calaminas y objetos ligeros. Aléjese de árboles grandes, postes y letreros publicitarios.",
                trigger_value=f"{current.wind_speed} km/h",
                threshold=">= 40.0 km/h",
                timestamp=now_str
            ))
        elif current.wind_speed >= 25.0:
            alerts.append(WeatherAlert(
                id=f"wind_caution_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Viento Moderado a Fuerte",
                severity="caution",
                severity_label="Precaución",
                category="wind",
                icon="Wind",
                description=f"Viento registrado de {current.wind_speed} km/h.",
                recommendation="Precaución en actividades al aire libre y navegación costera.",
                trigger_value=f"{current.wind_speed} km/h",
                threshold=">= 25.0 km/h",
                timestamp=now_str
            ))

        # 6. Alerta Informativa si las condiciones son estables y óptimas
        if not alerts:
            alerts.append(WeatherAlert(
                id=f"info_normal_{current.city_id or 'geo'}",
                city_id=current.city_id,
                city_name=current.city_name,
                department_name=current.department_name,
                region_natural=current.region_natural,
                title="Condiciones Meteorológicas Favorables",
                severity="info",
                severity_label="Informativo",
                category="info",
                icon="CheckCircle2",
                description="No se detectan fenómenos meteorológicos adversos en esta ubicación.",
                recommendation="Disfrute de la jornada manteniendo hidratación y fotoprotección regular.",
                trigger_value="Valores dentro de rangos normales",
                threshold="Normal",
                timestamp=now_str
            ))

        return alerts

    @classmethod
    def create_alerts_response(cls, alerts: List[WeatherAlert]) -> AlertsResponse:
        d_cnt = sum(1 for a in alerts if a.severity == "danger")
        w_cnt = sum(1 for a in alerts if a.severity == "warning")
        c_cnt = sum(1 for a in alerts if a.severity == "caution")
        i_cnt = sum(1 for a in alerts if a.severity == "info")

        return AlertsResponse(
            total_alerts=len(alerts),
            danger_count=d_cnt,
            warning_count=w_cnt,
            caution_count=c_cnt,
            info_count=i_cnt,
            alerts=alerts
        )
