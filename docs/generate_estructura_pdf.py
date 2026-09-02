# -*- coding: utf-8 -*-
import subprocess
import os
import sys

html_content = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Estructura del Proyecto y Propósito de Archivos - Sistema Clima Perú (Grupo 02)</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

  @page {
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
    @bottom-center {
      content: "Página " counter(page);
      font-size: 8.5pt;
      font-family: 'Inter', sans-serif;
      color: #64748b;
    }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 9pt;
    line-height: 1.5;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Portada / Header */
  .header-card {
    border: 2px solid #0284c7;
    border-radius: 8px;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
    margin-bottom: 20px;
  }
  .header-card h1 {
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px 0;
  }
  .header-card .meta {
    font-size: 9pt;
    color: #475569;
    font-weight: 500;
  }

  h2.section-title {
    font-size: 12pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }

  h3.folder-title {
    font-size: 10pt;
    font-weight: 700;
    color: #0369a1;
    background: #f0f9ff;
    border-left: 4px solid #0284c7;
    padding: 4px 8px;
    margin-top: 12px;
    margin-bottom: 8px;
    border-radius: 0 4px 4px 0;
  }

  ul.item-list {
    list-style-type: none;
    margin: 0 0 10px 0;
    padding: 0;
  }
  ul.item-list li {
    margin-bottom: 6px;
    padding: 5px 8px;
    border-radius: 4px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
  }
  ul.item-list li strong {
    color: #0f172a;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
  }
  .badge-tag {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    color: #ffffff;
    margin-right: 6px;
  }
  .tag-backend { background: #059669; }
  .tag-frontend { background: #0891b2; }
  .tag-db { background: #4f46e5; }
  .tag-config { background: #d97706; }

  .page-break {
    page-break-after: always;
  }
</style>
</head>
<body>

<div class="header-card">
  <h1>🇵🇪 GUÍA DE ESTRUCTURA DEL PROYECTO — GRUPO 02</h1>
  <div class="meta">
    <strong>Sistema Web de Clima y Datos Meteorológicos del Perú</strong> &middot; Arquitectura por Capas &middot; 2026
  </div>
</div>

<!-- 1. RAIZ -->
<h2 class="section-title">1. Archivos en la Raíz del Proyecto (Configuración Global)</h2>
<ul class="item-list">
  <li>
    <span class="badge-tag tag-config">CONFIG</span>
    <strong>.env.example</strong>: Plantilla de variables de entorno (URL de base de datos, TTL de caché, URLs de APIs externas y CORS).
  </li>
  <li>
    <span class="badge-tag tag-config">CONFIG</span>
    <strong>vercel.json</strong>: Configuración de enrutamiento y despliegue serverless en la nube (Vercel) para frontend y backend.
  </li>
  <li>
    <span class="badge-tag tag-backend">BACKEND</span>
    <strong>requirements.txt</strong>: Declaración de librerías Python requeridas (FastAPI, Uvicorn, SQLAlchemy, Pydantic, HTTPX).
  </li>
  <li>
    <span class="badge-tag tag-backend">SERVERLESS</span>
    <strong>api/index.py</strong>: Punto de entrada (*handler serverless*) para desplegar la API FastAPI en Vercel.
  </li>
  <li>
    <span class="badge-tag tag-config">DOCS</span>
    <strong>README.md</strong>: Manual técnico del repositorio con descripción, catálogo de endpoints e instrucciones de ejecución.
  </li>
</ul>

<!-- 2. BACKEND -->
<h2 class="section-title">2. Estructura del Backend (FastAPI + Python)</h2>

<h3 class="folder-title">📁 backend/app/ (Núcleo del Servidor)</h3>
<ul class="item-list">
  <li>
    <span class="badge-tag tag-backend">CORE</span>
    <strong>main.py</strong>: Inicializador de FastAPI. Configura CORS, eventos de inicio (*startup* para crear tablas y sembrar datos) e incluye los routers.
  </li>
  <li>
    <span class="badge-tag tag-config">CONFIG</span>
    <strong>config.py</strong>: Carga las variables de entorno usando Pydantic Settings para configuración centralizada y segura.
  </li>
  <li>
    <span class="badge-tag tag-db">DATABASE</span>
    <strong>database.py</strong>: Crea el motor SQLAlchemy (<code style="font-size:8pt;">create_engine</code>), sesión y generador de dependencias <code style="font-size:8pt;">get_db()</code>.
  </li>
</ul>

<h3 class="folder-title">📁 backend/app/models/ (Modelos de Base de Datos - Tablas ORM)</h3>
<ul class="item-list">
  <li>
    <span class="badge-tag tag-db">TABLA</span>
    <strong>peru_geo.py</strong>: Define las tablas <code>departments</code> (25 dptos) y <code>cities</code> (40+ ciudades con altitud y coordenadas). Relación 1 a N.
  </li>
  <li>
    <span class="badge-tag tag-db">TABLA</span>
    <strong>weather_cache.py</strong>: Define la tabla <code>weather_cache</code> para almacenar respuestas JSON y otorgar resiliencia offline.
  </li>
  <li>
    <span class="badge-tag tag-db">TABLA</span>
    <strong>favorite.py</strong>: Define la tabla <code>favorite_cities</code> para marcar y persistir ciudades favoritas.
  </li>
</ul>

<h3 class="folder-title">📁 backend/app/routers/ (Controladores / Endpoints REST)</h3>
<ul class="item-list">
  <li><strong>weather.py</strong>: Endpoints <code>/forecast</code>, <code>/current</code> y <code>/overview</code> (resumen nacional de 25 departamentos).</li>
  <li><strong>cities.py</strong>: Endpoint <code>/cities</code> (búsqueda y filtrado por región Costa, Sierra, Selva).</li>
  <li><strong>departments.py</strong>: Endpoint <code>/departments</code> (lista de departamentos y capitales).</li>
  <li><strong>alerts.py</strong>: Endpoint <code>/alerts</code> (alertas calculadas por umbrales meteorológicos).</li>
  <li><strong>compare.py</strong>: Endpoint <code>/compare</code> (comparador de 2 a 4 ciudades simultáneas).</li>
  <li><strong>history.py</strong>: Endpoint <code>/history</code> (historial de 7, 15 o 30 días y estadísticas).</li>
  <li><strong>rankings.py</strong>: Endpoint <code>/rankings</code> (Top 5 ciudades más calurosas, frías, lluviosas y ventosas).</li>
  <li><strong>export.py</strong>: Endpoint <code>/export/csv</code> (generación y descarga de reportes en archivo CSV).</li>
  <li><strong>favorites.py</strong>: Endpoint <code>/favorites</code> (guardar y listar ciudades favoritas).</li>
</ul>

<div class="page-break"></div>

<h3 class="folder-title">📁 backend/app/services/ y seed/ (Lógica de Negocio y Datos)</h3>
<ul class="item-list">
  <li>
    <span class="badge-tag tag-backend">LOGIC</span>
    <strong>services/weather_service.py</strong>: Conexión con Open-Meteo vía HTTPX, lógica de caché en RAM, normalización de códigos WMO al español y cálculo de tendencias.
  </li>
  <li>
    <span class="badge-tag tag-backend">LOGIC</span>
    <strong>services/alert_engine.py</strong>: Motor de reglas físicas para emitir alertas (UV &ge; 11, heladas &le; 0&deg;C, vientos fuertes).
  </li>
  <li>
    <span class="badge-tag tag-db">SEED</span>
    <strong>seed/seed_peru.py</strong>: Sembrador de datos iniciales con la geografía completa de los 25 departamentos y ciudades peruanas.
  </li>
  <li>
    <span class="badge-tag tag-backend">TESTS</span>
    <strong>backend/tests/</strong>: Suite de pruebas automatizadas con <strong>Pytest</strong> para verificar el correcto funcionamiento de los endpoints.
  </li>
</ul>

<!-- 3. FRONTEND -->
<h2 class="section-title">3. Estructura del Frontend (React 19 + TypeScript + Vite)</h2>

<h3 class="folder-title">📁 frontend/ (Archivos de Configuración del Cliente)</h3>
<ul class="item-list">
  <li>
    <span class="badge-tag tag-frontend">CONFIG</span>
    <strong>package.json</strong>: Define las librerías frontend (React 19, Leaflet, Recharts, Lucide, Tailwind CSS) y scripts de ejecución.
  </li>
  <li>
    <span class="badge-tag tag-frontend">CONFIG</span>
    <strong>vite.config.ts</strong>: Configuración de Vite para compilación ultrarrápida y proxy de desarrollo.
  </li>
  <li>
    <span class="badge-tag tag-frontend">CONFIG</span>
    <strong>tailwind.config.js / postcss.config.js</strong>: Sistema de diseño, paleta de colores y clases utilitarias de Tailwind.
  </li>
</ul>

<h3 class="folder-title">📁 frontend/src/components/ (Componentes Visuales de la Interfaz)</h3>
<ul class="item-list">
  <li><strong>CurrentWeatherHero.tsx</strong>: Tarjeta principal del clima actual (temperatura, hora oficial UTC-5, amanecer/atardecer).</li>
  <li><strong>KeyMetricsGrid.tsx</strong>: Las 6 tarjetas métricas clave (Índice UV, Humedad, Viento, Presión, Precipitación, Nubosidad).</li>
  <li><strong>HourlyForecast.tsx</strong>: Carrusel horizontal con el pronóstico de las próximas 24 horas.</li>
  <li><strong>DailyForecast.tsx</strong>: Pronóstico extendido a 7 días con barras proporcionales de rango térmico (mín-máx).</li>
  <li><strong>WeatherCharts.tsx</strong>: Gráficos interactivos construidos con <strong>Recharts</strong> (temperatura, lluvia, viento).</li>
  <li><strong>WeatherMap.tsx</strong>: Mapa interactivo del Perú desarrollado en <strong>Leaflet</strong> con capas térmicas y de lluvia.</li>
  <li><strong>CompareSection.tsx</strong>: Módulo de comparación lado a lado de 2 a 4 ciudades peruanas.</li>
  <li><strong>HistorySection.tsx</strong>: Vista de tendencias climáticas históricas y botón de exportación CSV.</li>
  <li><strong>AlertsSection.tsx</strong>: Panel de notificaciones y alertas de protección civil.</li>
  <li><strong>RankingsSection.tsx</strong>: Tablas de posiciones con los extremos climáticos nacionales.</li>
  <li><strong>SkeletonLoader.tsx</strong>: Animaciones de carga (*skeletons*) para una experiencia de usuario fluida mientras se consultan los datos.</li>
</ul>

<h3 class="folder-title">📁 frontend/src/services/ y types/ (Comunicaciones y Tipos)</h3>
<ul class="item-list">
  <li>
    <span class="badge-tag tag-frontend">API</span>
    <strong>services/api.ts</strong>: Módulo cliente con llamadas <code style="font-size:8pt;">fetch()</code> tipadas hacia los endpoints del backend.
  </li>
  <li>
    <span class="badge-tag tag-frontend">TYPES</span>
    <strong>types/weather.ts</strong>: Definición de interfaces TypeScript para modelos de datos (Ciudad, Departamento, Pronóstico, Alertas).
  </li>
  <li>
    <span class="badge-tag tag-frontend">ENTRY</span>
    <strong>App.tsx &amp; main.tsx</strong>: Ensamblado principal de la aplicación, control de estado global y renderizado en el DOM.
  </li>
</ul>

</body>
</html>
"""

# Guardar HTML y compilar a PDF
html_path = os.path.abspath("estructura_proyecto_temp.html")
pdf_path = os.path.abspath("ESTRUCTURA_PROYECTO_CLIMA_GRUPO02.pdf")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generado en: {html_path}")

edge_cmd = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    f"file:///{html_path.replace(os.sep, '/')}"
]

print("Generando PDF de Estructura del Proyecto...")
result = subprocess.run(edge_cmd, capture_output=True, text=True)

if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
    print(f"PDF GENERADO EXITOSAMENTE: {pdf_path}")
    print(f"Tamaño: {os.path.getsize(pdf_path)} bytes")
else:
    print("Error generando PDF:")
    print(result.stderr)
    print(result.stdout)
