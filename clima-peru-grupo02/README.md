# 🇵🇪 SISTEMA WEB DE CLIMA Y DATOS METEOROLÓGICOS DEL PERÚ
### **Proyecto Académico — Grupo 02**

![Status](https://img.shields.io/badge/Estado-Producci%C3%B3n%20%2F%20Acad%C3%A9mico-success)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2F%20Python%203.11-009688)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript%20%2B%20Vite-61DAFB)
![TailwindCSS](https://img.shields.io/badge/Estilos-Tailwind%20CSS%203.4-38B2AC)
![Base de Datos](https://img.shields.io/badge/Base%20de%20Datos-SQLite%20%2F%20PostgreSQL-336791)
![API Meteorológica](https://img.shields.io/badge/API-Open--Meteo%20%2B%20SENAMHI%20Ref-FF6B6B)

Plataforma meteorológica integral para la consulta, visualización interactiva y análisis estadístico del clima en los **25 departamentos y más de 35 ciudades del territorio peruano**. Integra modelos meteorológicos globales de alta resolución (ECMWF 9km / GFS 13km), un mapa interactivo con Leaflet, motor de alertas climáticas en tiempo real, comparador multiciudad, series temporales históricas y exportación de reportes a formato CSV.

---

## 🏛️ 1. Arquitectura del Sistema

El sistema implementa una **arquitectura por capas desacoplada** (*Layered Architecture / Adapter Pattern*):

```mermaid
graph TD
    subgraph Frontend["Capa de Presentación (Frontend - React 18 + TypeScript + Vite)"]
        UI[Dashboard Principal]
        Map[Mapa Interactivo del Perú - Leaflet]
        Comp[Comparador Multiciudad]
        Hist[Análisis Climático e Historial]
        AlertsUI[Sistema de Alertas y Notificaciones]
        Rank[Rankings de Extremos Nacionales]
        ApiClient[Servicio API Axios/Fetch]
    end

    subgraph Backend["Capa de Negocio (Backend - FastAPI)"]
        Routers[Endpoints REST: /weather, /cities, /departments, /alerts, /compare, /history, /rankings, /export]
        WeatherService[Weather Service Layer + Data Normalizer en Español]
        AlertEngine[Motor de Reglas de Alertas Meteorológicas]
        CacheLayer[Sistema de Caché In-Memory / TTL]
    end

    subgraph Storage["Capa de Datos y Servicios Externos"]
        DB[(Base de Datos Relacional: SQLite / PostgreSQL - 25 Dptos, 40+ Ciudades, Coordenadas, Altitudes)]
        OpenMeteo[API Meteorológica Global Open-Meteo - Modelos ECMWF / GFS]
    end

    UI --> ApiClient
    Map --> ApiClient
    Comp --> ApiClient
    Hist --> ApiClient
    AlertsUI --> ApiClient
    Rank --> ApiClient

    ApiClient -->|HTTP REST / JSON| Routers
    Routers --> WeatherService
    Routers --> AlertEngine
    WeatherService --> CacheLayer
    WeatherService --> DB
    WeatherService --> OpenMeteo
```

---

## ✨ 2. Funcionalidades Principales

### 1. Dashboard Meteorológico
- **Hero Card**: Ciudad activa, departamento, hora oficial del Perú (UTC-5), estado del cielo, temperatura actual, sensación térmica, máxima y mínima, horas de salida y puesta del sol.
- **6 Tarjetas de Indicadores Clave**:
  - 💧 **Humedad**: Porcentaje relativo con indicador de confort térmico.
  - 💨 **Viento**: Velocidad en km/h, dirección cardinal (N, S, E, O) y ráfagas.
  - 🌧️ **Precipitación**: Tasa en mm y probabilidad de lluvia en %.
  - ☀️ **Índice UV**: Escala de radiación ultravioleta según recomendaciones de la OMS.
  - 🟣 **Presión Atmosférica**: En hPa a nivel de superficie.
  - ☁️ **Nubosidad**: Cobertura porcentual del cielo.

### 2. Pronóstico Meteorológico
- **Pronóstico Horario (24h)**: Carrusel horizontal con hora, icono dinámico, temperatura, probabilidad de precipitación y velocidad del viento.
- **Pronóstico Extendido (7 Días)**: Tarjetas diarias con barras de rango térmico proporcional (mín-máx) y acumulado de lluvia.

### 3. Centro de Gráficos Analíticos
- Gráficos interactivos con **Recharts** con áreas degradadas y tooltips:
  - Curva de Temperatura y Sensación Térmica.
  - Gráfico de Precipitaciones y Probabilidad.
  - Curva de Humedad Relativa.
  - Velocidad del Viento.

### 4. Mapa Interactivo del Perú
- Mapa basado en **Leaflet** con centrado geográfico en el Perú (`-9.19, -75.01`).
- Marcadores de los **25 departamentos** con cambio de capas de datos:
  - 🌡️ **Temperatura** (Azul = Frío, Verde = Templado, Rojo = Cálido).
  - 🌧️ **Precipitación** (Gris = Seco, Celeste/Azul = Lluvia, Violeta = Torrencial).
  - ☀️ **Índice UV** (Verde = Bajo, Amarillo = Moderado, Naranja = Alto, Púrpura = Extremo).
- Inspector departamental y selección directa de capitales hacia el dashboard.

### 5. Comparador de Ciudades
- Permite seleccionar de **2 a 4 ciudades peruanas** en simultáneo.
- Ficha técnica comparativa lado a lado + Gráfico de barras comparativo directo.

### 6. Análisis Climático e Historial
- Selector de ciudad, variable (temperatura, precipitación, viento) y rango temporal (7, 15, 30 días).
- Cálculo en tiempo real de: **Promedio**, **Máximo**, **Mínimo**, **Tendencia** (ascendente, descendente, estable) y **Días analizados**.
- Botón de **Exportación Directa a CSV**.

### 7. Motor de Alertas Meteorológicas del Perú
- Detección de umbrales físicos reales:
  - 🔴 **Peligro (Rojo)**: UV $\ge 11.0$, Temperatura $\ge 35^\circ\text{C}$, Heladas $\le 0^\circ\text{C}$, Lluvias $\ge 10\text{ mm/h}$, Vientos $\ge 40\text{ km/h}$.
  - 🟠 **Advertencia (Naranja)**: UV $\ge 8.0$, Calor $\ge 31^\circ\text{C}$, Bajas temp $\le 2^\circ\text{C}$, Lluvia $\ge 3\text{ mm/h}$.
  - 🟡 **Precaución (Amarillo)**: Probabilidad de lluvia $\ge 70\%$, Viento $\ge 25\text{ km/h}$.
  - 🔵 **Informativo (Azul)**: Condiciones estables en el territorio nacional.
- Recomendaciones de protección civil y fotoprotección.

### 8. Rankings y Extremos Nacionales
- Top 5 Ciudades más calurosas del Perú.
- Top 5 Ciudades más frías (zonas altoandinas).
- Top 5 Ciudades con mayor radiación UV.
- Top 5 Ciudades con mayor precipitación acumulada.
- Top 5 Ciudades más ventosas.

---

## 🚀 3. Instalación y Ejecución Local

### Prerrequisitos
- **Python 3.11+**
- **Node.js 18+ / 20+** y **npm**

### Paso 1: Clonar e instalar Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
```

### Paso 2: Ejecutar Backend
```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> El backend inicializará automáticamente la base de datos `clima_peru.db` y sembrará los 25 departamentos y 40+ ciudades del Perú.
> Documentación interactiva Swagger en: **http://127.0.0.1:8000/docs**

### Paso 3: Instalar y Ejecutar Frontend (React + Vite)
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```
> Abrir la aplicación web en el navegador: **http://localhost:5173**

---

## 📡 4. Catálogo de Endpoints de la API REST

| Método | Endpoint | Descripción | Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cities` | Listar catálogo de ciudades peruanas | `query`, `department_id`, `region`, `featured_only` |
| `GET` | `/api/departments` | Listar los 25 departamentos con sus ciudades | - |
| `GET` | `/api/weather/forecast` | Pronóstico completo (actual, 24h y 7d) | `city_id`, `lat`, `lon` |
| `GET` | `/api/weather/current` | Clima actual detallado | `city_id`, `lat`, `lon` |
| `GET` | `/api/weather/overview` | Resumen nacional de los 25 departamentos | - |
| `GET` | `/api/alerts` | Alertas meteorológicas calculadas | `city_id` (opcional) |
| `GET` | `/api/compare` | Comparativa de 2 a 4 ciudades | `city_ids=1,7,10` |
| `GET` | `/api/history` | Histórico y estadísticas climáticas | `city_id`, `start_date`, `end_date`, `variable` |
| `GET` | `/api/rankings` | Top extremos climáticos de ciudades peruanas | - |
| `GET` | `/api/export/csv` | Descarga de reporte en formato CSV | `city_id`, `export_type`, `days` |
| `GET` | `/api/favorites` | Listar ciudades favoritas | - |

---

## 🧪 5. Pruebas Automatizadas

Para ejecutar la suite de pruebas unitarias y de integración de endpoints:
```bash
cd backend
python -m pytest tests -v
```

---

## 👥 6. Créditos y Autoría

- **Institución / Curso**: Proyecto Académico de Tecnologías Web y Sistemas Distribuidos
- **Equipo de Desarrollo**: Grupo 02
- **Año**: 2026
