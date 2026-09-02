# -*- coding: utf-8 -*-
import subprocess
import os
import sys

html_content = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Guía Maestra de Exposición y Sustentación - Sistema Clima Perú (Grupo 02)</title>
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
    font-size: 9.5pt;
    line-height: 1.5;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Portada */
  .cover {
    height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    border: 2px solid #0284c7;
    border-radius: 12px;
    padding: 35px;
    box-sizing: border-box;
    background: linear-gradient(180deg, #f8fafc 0%, #f0f9ff 100%);
  }

  .cover-header {
    text-align: center;
  }
  .cover-header .inst {
    font-size: 13pt;
    font-weight: 800;
    letter-spacing: 2px;
    color: #0369a1;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .cover-header .sub {
    font-size: 10pt;
    color: #475569;
    font-weight: 500;
  }

  .cover-body {
    text-align: center;
    margin: 40px 0;
  }
  .cover-body .flag {
    font-size: 36pt;
    margin-bottom: 10px;
  }
  .cover-body h1 {
    font-size: 22pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
    margin: 0 0 12px 0;
  }
  .cover-body h2 {
    font-size: 13pt;
    font-weight: 600;
    color: #0284c7;
    margin: 0 0 20px 0;
  }
  .badge-container {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 15px;
  }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 8pt;
    font-weight: 700;
    color: #ffffff;
    background: #0284c7;
  }
  .badge-react { background: #0891b2; }
  .badge-fastapi { background: #059669; }
  .badge-db { background: #4f46e5; }
  .badge-api { background: #ea580c; }

  .cover-footer {
    border-top: 1px solid #cbd5e1;
    padding-top: 15px;
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    color: #334155;
  }

  /* Encabezados y Estructura */
  h2.section-title {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 4px;
    margin-top: 24px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }
  h3.subsection-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0369a1;
    margin-top: 14px;
    margin-bottom: 6px;
  }

  /* Tablas */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 8.5pt;
  }
  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #334155;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }
  tr:nth-child(even) {
    background-color: #f8fafc;
  }

  /* Cajas de Alerta y Destacados */
  .callout {
    background-color: #f0f9ff;
    border-left: 4px solid #0284c7;
    padding: 10px 12px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0;
    font-size: 9pt;
  }
  .callout-warning {
    background-color: #fffbeb;
    border-left-color: #d97706;
  }
  .callout-success {
    background-color: #f0fdf4;
    border-left-color: #16a34a;
  }
  .callout strong {
    color: #0f172a;
  }

  /* Código y Terminal */
  pre, code {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8pt;
  }
  pre {
    background-color: #0f172a;
    color: #e2e8f0;
    padding: 10px 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
    border: 1px solid #1e293b;
    line-height: 1.4;
  }
  code.inline {
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    font-weight: 600;
    border: 1px solid #e2e8f0;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  ul, ol {
    margin: 6px 0 10px 20px;
    padding: 0;
  }
  li {
    margin-bottom: 4px;
  }
  .page-break {
    page-break-after: always;
  }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  <div class="cover-header">
    <div class="inst">Proyecto Académico de Sustentación</div>
    <div class="sub">Tecnologías Web &middot; Sistemas Distribuidos &middot; Arquitectura de Software</div>
  </div>

  <div class="cover-body">
    <div class="flag">🇵🇪</div>
    <h1>SISTEMA WEB DE CLIMA Y DATOS METEOROLÓGICOS DEL PERÚ</h1>
    <h2>Dossier Técnico Integral y Guía Maestra de Exposición</h2>
    <div class="badge-container">
      <span class="badge badge-react">React 19 + Vite</span>
      <span class="badge badge-fastapi">FastAPI (Python 3.11)</span>
      <span class="badge badge-db">SQLite + SQLAlchemy</span>
      <span class="badge badge-api">Open-Meteo API</span>
    </div>
  </div>

  <div class="cover-footer">
    <div><strong>Equipo de Desarrollo:</strong> Grupo 02</div>
    <div><strong>Cobertura:</strong> 25 Departamentos / 40+ Ciudades</div>
    <div><strong>Año:</strong> 2026</div>
  </div>
</div>

<!-- SECCIÓN 1: FICHA TÉCNICA -->
<h2 class="section-title">1. Ficha Técnica Oficial del Proyecto</h2>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Componente</th>
      <th style="width: 35%;">Tecnología / Herramienta</th>
      <th style="width: 40%;">Función y Rol en el Sistema</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend Core</strong></td>
      <td>React 19 + TypeScript + Vite 5</td>
      <td>Interfaz de usuario reactiva, modular, fuertemente tipada y de carga instantánea.</td>
    </tr>
    <tr>
      <td><strong>Estilos y Diseño</strong></td>
      <td>Tailwind CSS 3.4 + Lucide React</td>
      <td>Diseño moderno (*glassmorphism*, modo oscuro/claro, responsive) e iconografía meteorológica.</td>
    </tr>
    <tr>
      <td><strong>Visualización Gráfica</strong></td>
      <td>Recharts 3</td>
      <td>Gráficos interactivos de temperatura, sensación térmica, lluvia y velocidad de viento.</td>
    </tr>
    <tr>
      <td><strong>Mapeo Geográfico</strong></td>
      <td>Leaflet 1.9</td>
      <td>Mapa interactivo centrado en Perú con capas dinámicas de temperatura, lluvia y radiación UV.</td>
    </tr>
    <tr>
      <td><strong>Backend Framework</strong></td>
      <td>FastAPI (Python 3.11+)</td>
      <td>Framework web asíncrono de alto rendimiento para exponer la API REST y procesar datos.</td>
    </tr>
    <tr>
      <td><strong>Servidor ASGI</strong></td>
      <td>Uvicorn 0.24</td>
      <td>Servidor web asíncrono para despachar las peticiones del backend.</td>
    </tr>
    <tr>
      <td><strong>Validación de Datos</strong></td>
      <td>Pydantic 2.5 + Pydantic-Settings</td>
      <td>Tipado estricto de entradas/salidas y gestión centralizada del archivo <code>.env</code>.</td>
    </tr>
    <tr>
      <td><strong>Cliente HTTP Backend</strong></td>
      <td>HTTPX 0.25 (Asíncrono)</td>
      <td>Conexión no bloqueante a la API externa de Open-Meteo.</td>
    </tr>
    <tr>
      <td><strong>Base de Datos</strong></td>
      <td>SQLite con SQLAlchemy 2.0 ORM</td>
      <td>BD relacional con 4 tablas para departamentos, ciudades, caché y favoritos.</td>
    </tr>
    <tr>
      <td><strong>Caché</strong></td>
      <td>In-Memory Cache (TTL 15m) + BD</td>
      <td>Optimización para responder en &lt; 50ms y prevenir sobrecarga de peticiones externas.</td>
    </tr>
    <tr>
      <td><strong>API Meteorológica</strong></td>
      <td>Open-Meteo (ECMWF 9km / GFS 13km)</td>
      <td>Modelos meteorológicos globales con interpretación de códigos WMO en español.</td>
    </tr>
    <tr>
      <td><strong>Zona Horaria</strong></td>
      <td><code>America/Lima</code> (UTC-5)</td>
      <td>Sincronización exacta con la hora oficial de la República del Perú.</td>
    </tr>
  </tbody>
</table>

<!-- SECCIÓN 2: ARQUITECTURA Y FLUJO -->
<h2 class="section-title">2. Arquitectura del Sistema y Flujo de Datos</h2>

<div class="callout">
  <strong>Patrón Arquitectónico:</strong> Arquitectura en Capas Desacoplada (<em>Layered Architecture / Client-Server</em>). El Frontend y Backend se comunican exclusivamente mediante protocolo <strong>HTTP REST</strong> intercambiando cargas útiles en formato <strong>JSON</strong>.
</div>

<div class="grid-2">
  <div class="card">
    <h3 class="subsection-title">1. Capa de Presentación (Frontend)</h3>
    <ul>
      <li><strong>Dashboard Hero:</strong> Clima actual y 6 métricas clave.</li>
      <li><strong>Pronóstico:</strong> Carrusel 24 horas y 7 días.</li>
      <li><strong>Mapa Leaflet:</strong> Visualización de los 25 departamentos.</li>
      <li><strong>Comparador:</strong> Comparación de 2 a 4 ciudades en paralelo.</li>
      <li><strong>Centro de Alertas:</strong> Alertas climáticas por severidad.</li>
      <li><strong>Exportación:</strong> Generación y descarga directa en CSV.</li>
    </ul>
  </div>
  <div class="card">
    <h3 class="subsection-title">2. Capa de Negocio y Datos (Backend)</h3>
    <ul>
      <li><strong>Routers REST:</strong> Endpoints modulares validados con Pydantic.</li>
      <li><strong>WeatherService:</strong> Capa de servicio y normalizador en español.</li>
      <li><strong>Motor de Alertas:</strong> Cálculo de umbrales críticos (UV &ge; 11, heladas &le; 0&deg;C).</li>
      <li><strong>Caché en Memoria:</strong> Almacén de respuestas con TTL de 15 minutos.</li>
      <li><strong>Base de Datos Relacional:</strong> SQLite con catálogo peruano.</li>
    </ul>
  </div>
</div>

<div class="page-break"></div>

<!-- SECCIÓN 3: BASE DE DATOS -->
<h2 class="section-title">3. Base de Datos: Estructura, Tablas y Relaciones</h2>

<div class="callout callout-success">
  <strong>Tipo de Base de Datos:</strong> Relacional (SQL / RDBMS) administrada con <strong>SQLAlchemy ORM</strong>. Se conecta vía <code class="inline">sqlite:///./clima_peru.db</code> (archivo local) y es 100% compatible con <strong>PostgreSQL</strong> para despliegues empresariales.
</div>

<h3>Detalle de las 4 Tablas Relacionales:</h3>

<table>
  <thead>
    <tr>
      <th>Tabla</th>
      <th>Descripción y Propósito</th>
      <th>Campos Principales</th>
      <th>Relaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong><code>departments</code></strong></td>
      <td>Almacena los 25 departamentos del Perú con datos geográficos y centroides.</td>
      <td><code>id</code> (PK), <code>name</code>, <code>code</code>, <code>capital</code>, <code>latitude</code>, <code>longitude</code>, <code>region_natural</code> (Costa/Sierra/Selva), <code>description</code>.</td>
      <td><strong>1 a N</strong> con <code>cities</code> (eliminación en cascada).</td>
    </tr>
    <tr>
      <td><strong><code>cities</code></strong></td>
      <td>Catálogo de más de 40 ciudades y provincias con altitud georreferenciada.</td>
      <td><code>id</code> (PK), <code>department_id</code> (FK), <code>name</code>, <code>province</code>, <code>latitude</code>, <code>longitude</code>, <code>altitude</code> (m.s.n.m.), <code>is_capital</code>, <code>is_featured</code>.</td>
      <td><strong>N a 1</strong> con <code>departments</code>.</td>
    </tr>
    <tr>
      <td><strong><code>weather_cache</code></strong></td>
      <td>Caché persistente para almacenar respuestas JSON y garantizar resiliencia offline.</td>
      <td><code>id</code> (PK), <code>cache_key</code> (String indexado, ej. <code>weather_-12.04_-77.04</code>), <code>data_json</code> (Text), <code>created_at</code> (DateTime).</td>
      <td>Tabla independiente de optimización.</td>
    </tr>
    <tr>
      <td><strong><code>favorite_cities</code></strong></td>
      <td>Almacena las ciudades marcadas como preferidas por el usuario.</td>
      <td><code>id</code> (PK), <code>city_id</code> (FK a <code>cities.id</code>), <code>created_at</code> (DateTime).</td>
      <td><strong>1 a 1</strong> con <code>cities</code>.</td>
    </tr>
  </tbody>
</table>

<!-- SECCIÓN 4: CONEXIONES Y API EXTERNA -->
<h2 class="section-title">4. Conexión de APIs y Gestión de Tiempo Real</h2>

<div class="grid-2">
  <div class="card">
    <h3 class="subsection-title">A. Conexión Backend ➔ Open-Meteo API</h3>
    <p>El backend invoca a Open-Meteo mediante <strong>HTTPX Asíncrono</strong>:</p>
    <ul>
      <li><strong>Parámetros enviados:</strong> Coordenadas (lat, lon), variables horarias/diarias y zona horaria <code class="inline">America/Lima</code>.</li>
      <li><strong>Interpretación WMO:</strong> Traduce códigos numéricos meteorológicos estándar a español comprensible (ej. <em>0 = Cielo despejado, 95 = Tormenta eléctrica</em>).</li>
      <li><strong>Resiliencia:</strong> Si la API externa no responde, el sistema lee la última captura válida en <code class="inline">weather_cache</code>.</li>
    </ul>
  </div>
  <div class="card">
    <h3 class="subsection-title">B. Conexión Frontend (React) ➔ Backend (FastAPI)</h3>
    <p>El cliente web consume los endpoints con <strong>Fetch API</strong>:</p>
    <ul>
      <li>Ubicado centralizadamente en <code class="inline">frontend/src/services/api.ts</code>.</li>
      <li>Soporta URL base configurable mediante variable de entorno <code class="inline">VITE_API_URL</code>.</li>
      <li>Tipado completo con interfaces TypeScript (<code class="inline">types/weather.ts</code>) garantizando cero errores de tipo en tiempo de ejecución.</li>
    </ul>
  </div>
</div>

<!-- SECCIÓN 5: ENDPOINTS DE LA API REST -->
<h2 class="section-title">5. Catálogo Completo de Endpoints REST</h2>

<table>
  <thead>
    <tr>
      <th style="width: 10%;">Método</th>
      <th style="width: 25%;">Endpoint</th>
      <th style="width: 40%;">Descripción</th>
      <th style="width: 25%;">Parámetros</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/cities</code></strong></td>
      <td>Lista ciudades peruanas con filtro por departamento o región.</td>
      <td><code>query</code>, <code>department_id</code>, <code>region</code></td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/departments</code></strong></td>
      <td>Lista los 25 departamentos y sus respectivas capitales.</td>
      <td>-</td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/weather/forecast</code></strong></td>
      <td><strong>Principal:</strong> Clima actual, 24 horas y pronóstico de 7 días.</td>
      <td><code>city_id</code>, <code>lat</code>, <code>lon</code></td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/weather/overview</code></strong></td>
      <td>Resumen climático de los 25 departamentos para el mapa.</td>
      <td>-</td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/alerts</code></strong></td>
      <td>Alertas meteorológicas calculadas por umbrales físicos.</td>
      <td><code>city_id</code> (opcional)</td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/compare</code></strong></td>
      <td>Comparativa simultánea de 2 a 4 ciudades peruanas.</td>
      <td><code>city_ids=1,5,10</code></td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/history</code></strong></td>
      <td>Series temporales históricas y tendencias calculadas.</td>
      <td><code>city_id</code>, <code>variable</code>, <code>days</code></td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/rankings</code></strong></td>
      <td>Top 5 nacional: más calurosas, frías, lluviosas y mayor UV.</td>
      <td>-</td>
    </tr>
    <tr>
      <td><code class="inline">GET</code></td>
      <td><strong><code>/api/export/csv</code></strong></td>
      <td>Descarga de reporte meteorológico en formato plano CSV.</td>
      <td><code>city_id</code>, <code>days</code></td>
    </tr>
    <tr>
      <td><code class="inline">GET/POST</code></td>
      <td><strong><code>/api/favorites</code></strong></td>
      <td>Gestión de ciudades favoritas del usuario.</td>
      <td><code>city_id</code></td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<!-- SECCIÓN 6: EXPLICACIÓN DE ARCHIVOS CLAVE -->
<h2 class="section-title">6. Explicación Línea por Línea de Dependencias y Archivos</h2>

<h3 class="subsection-title">A. Archivo <code>requirements.txt</code> (Backend en Python):</h3>
<pre>
1: fastapi>=0.104.0         # Framework web asíncrono para construir la API REST y routers.
2: uvicorn>=0.24.0         # Servidor web ASGI de alto rendimiento para ejecutar FastAPI.
3: httpx>=0.25.0           # Cliente HTTP asíncrono para consultar la API de Open-Meteo.
4: sqlalchemy>=2.0.0       # ORM para mapear objetos de Python a tablas en la base de datos.
5: pydantic>=2.5.0         # Validación estricta de esquemas de datos y tipado en tiempo de ejecución.
6: pydantic-settings>=2.0.0# Lectura y tipado seguro de variables de entorno (.env).
7: pytest>=7.4.0           # Framework para pruebas unitarias automatizadas de endpoints.
</pre>

<h3 class="subsection-title">B. ¿Qué hay en <code>node_modules</code>? (Frontend):</h3>
<div class="callout">
  <strong>Definición concisa:</strong> Es el directorio generado por <code class="inline">npm install</code> que contiene el código fuente compilado de todas las librerías de JavaScript y TypeScript que necesita React para funcionar (React 19, Leaflet para mapas, Recharts para gráficos y Tailwind CSS).
</div>

<!-- SECCIÓN 7: COMANDOS PARA CORRER EL PROYECTO -->
<h2 class="section-title">7. Comandos de Instalación y Ejecución</h2>

<div class="grid-2">
  <div class="card">
    <h3 class="subsection-title">🔹 Terminal 1: Backend (FastAPI)</h3>
    <pre>
# 1. Ingresar a la carpeta backend
cd backend

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Iniciar servidor con recarga en vivo
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
    </pre>
    <p style="font-size: 8pt; margin: 4px 0;"><strong>Swagger Docs:</strong> <code>http://127.0.0.1:8000/docs</code></p>
  </div>
  <div class="card">
    <h3 class="subsection-title">🔹 Terminal 2: Frontend (React + Vite)</h3>
    <pre>
# 1. Ingresar a la carpeta frontend
cd frontend

# 2. Instalar módulos de node
npm install

# 3. Iniciar entorno de desarrollo
npm run dev
    </pre>
    <p style="font-size: 8pt; margin: 4px 0;"><strong>App Web:</strong> <code>http://localhost:5173</code></p>
  </div>
</div>

<!-- SECCIÓN 8: GUÍA DE SUSTENTACIÓN Y PREGUNTAS -->
<h2 class="section-title">8. Guía de Sustentación: Discurso, Demo y Preguntas del Jurado</h2>

<div class="callout callout-success">
  <strong>Discurso de Apertura (30 Segundos):</strong><br>
  <em>"Buenas tardes, nuestro proyecto es el <strong>Sistema Meteorológico del Perú</strong>, desarrollado por el <strong>Grupo 02</strong>. Es una plataforma web integral para consultar el clima en tiempo real, pronósticos horarios y alertas en los <strong>25 departamentos y más de 40 ciudades del Perú</strong>, combinando modelos meteorológicos globales, mapas interactivos con Leaflet y gráficos analíticos con Recharts."</em>
</div>

<h3 class="subsection-title">Preguntas Típicas del Jurado y Respuestas Maestras:</h3>

<ol>
  <li>
    <strong>¿Por qué usaron FastAPI y no Flask o Django?</strong><br>
    <em>"FastAPI es nativamente asíncrono (async/await), lo que permite manejar múltiples peticiones concurrentes a la API meteorológica con bajísima latencia. Además, genera automáticamente la documentación interactiva Swagger y valida tipos con Pydantic."</em>
  </li>
  <li>
    <strong>¿Cómo aseguran que el sistema no falle si se cae internet o la API externa?</strong><br>
    <em>"Diseñamos un mecanismo de resiliencia de 2 niveles: primero revisa la memoria RAM (TTL 15 min); si la API de Open-Meteo no responde, el backend rescata la última captura meteorológica válida almacenada en la tabla <code>weather_cache</code> de SQLite."</em>
  </li>
  <li>
    <strong>¿Cómo se conectan el Frontend y Backend si están en puertos distintos?</strong><br>
    <em>"FastAPI implementa <code>CORSMiddleware</code>, permitiendo solicitudes HTTP REST seguras desde el origen de React (puerto 5173 o dominio de producción) sin bloqueos por políticas de origen cruzado."</em>
  </li>
  <li>
    <strong>¿Cómo se calculan las alertas meteorológicas?</strong><br>
    <em>"Mediante un motor de reglas propio (<code>AlertEngine</code>) que evalúa en tiempo real umbrales físicos del SENAMHI y la OMS: Radiación UV &ge; 11 (Extremo), temperaturas &ge; 35&deg;C (Ola de calor), heladas &le; 0&deg;C y vientos &ge; 40 km/h."</em>
  </li>
</ol>

</body>
</html>
"""

# Guardar HTML y convertir a PDF
html_path = os.path.abspath("guia_exposicion_temp.html")
pdf_path = os.path.abspath("GUIA_EXPOSICION_SISTEMA_CLIMA_GRUPO02.pdf")

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

print("Generando PDF profesional...")
result = subprocess.run(edge_cmd, capture_output=True, text=True)

if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
    print(f"PDF GENERADO EXITOSAMENTE: {pdf_path}")
    print(f"Tamaño: {os.path.getsize(pdf_path)} bytes")
else:
    print("Error generando PDF:")
    print(result.stderr)
    print(result.stdout)
