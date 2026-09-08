# -*- coding: utf-8 -*-
import subprocess
import os
import sys

html_content = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Resumen de Cambios en la Rama - Clima Perú (Grupo 02)</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

  @page {
    size: A4;
    margin: 12mm 14mm 12mm 14mm;
    @bottom-center {
      content: "Página " counter(page);
      font-size: 8pt;
      font-family: 'Inter', sans-serif;
      color: #94a3b8;
    }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 8.5pt;
    line-height: 1.45;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Portada Ejecutiva */
  .hero-card {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%);
    border-radius: 12px;
    padding: 16px 20px;
    color: #ffffff;
    margin-bottom: 14px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  }
  .hero-card .badge-branch {
    display: inline-block;
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.5);
    color: #38bdf8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .hero-card h1 {
    font-size: 15pt;
    font-weight: 800;
    margin: 0 0 4px 0;
    letter-spacing: -0.02em;
    color: #ffffff;
  }
  .hero-card p {
    margin: 0;
    font-size: 8.5pt;
    color: #cbd5e1;
  }

  /* Secciones y Tarjetas de Módulo */
  .section-heading {
    font-size: 11pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 3px;
    margin-top: 12px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  .card-module {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .card-module.highlight {
    border-left: 4px solid #0284c7;
    background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
  }
  .card-module.warning {
    border-left: 4px solid #dc2626;
    background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);
  }
  .card-module.success {
    border-left: 4px solid #10b981;
    background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
  }
  .card-module.purple {
    border-left: 4px solid #8b5cf6;
    background: linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%);
  }

  .card-module h3 {
    margin: 0 0 6px 0;
    font-size: 9.5pt;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pill {
    font-size: 6.5pt;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 4px;
    text-transform: uppercase;
    color: #fff;
  }
  .pill-blue { background: #0284c7; }
  .pill-red { background: #dc2626; }
  .pill-green { background: #059669; }
  .pill-purple { background: #7c3aed; }

  ul.clean-list {
    margin: 0;
    padding-left: 14px;
  }
  ul.clean-list li {
    margin-bottom: 4px;
    color: #334155;
    font-size: 8pt;
  }
  ul.clean-list li strong {
    color: #0f172a;
  }

  /* Tabla de Archivos */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    margin-bottom: 12px;
    font-size: 7.5pt;
  }
  table.data-table th {
    background: #0f172a;
    color: #ffffff;
    text-align: left;
    padding: 5px 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  table.data-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }
  table.data-table tr:nth-child(even) {
    background: #f8fafc;
  }
  table.data-table td.code {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    color: #0284c7;
  }

  /* Caja de Sustentación / Pitch de Exposición */
  .pitch-box {
    background: #0f172a;
    border-radius: 10px;
    padding: 12px 16px;
    color: #f8fafc;
    margin-top: 8px;
    border: 1px solid #334155;
  }
  .pitch-box h4 {
    margin: 0 0 6px 0;
    font-size: 9.5pt;
    font-weight: 800;
    color: #38bdf8;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pitch-steps {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-top: 6px;
  }
  .pitch-step {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 8px 10px;
  }
  .pitch-step strong {
    color: #facc15;
    display: block;
    font-size: 8pt;
    margin-bottom: 3px;
  }
  .pitch-step span {
    font-size: 7.5pt;
    color: #cbd5e1;
    line-height: 1.35;
    display: block;
  }

  .page-break {
    page-break-after: always;
  }
</style>
</head>
<body>

<!-- ENCABEZADO EJECUTIVO -->
<div class="hero-card">
  <div class="badge-branch">RAMA: Fran_Elbuscadoencomas</div>
  <h1>RESUMEN DE CAMBIOS Y NUEVAS FUNCIONALIDADES</h1>
  <p><strong>Proyecto Clima Perú (Grupo 02)</strong> &middot; Guía concisa de arquitectura, componentes y mejoras de experiencia de usuario implementadas en esta rama.</p>
</div>

<!-- SECCIÓN 1: LAS 4 GRANDES IMPLEMENTACIONES -->
<div class="section-heading">
  <span>⚡</span> 1. Las 4 Grandes Mejoras Implementadas en Nuestra Rama
</div>

<div class="grid-2">

  <!-- Módulo 1 -->
  <div class="card-module highlight">
    <h3>
      <span>🔐</span> Autenticación Oficial con Google
      <span class="pill pill-blue">Frontend + Backend</span>
    </h3>
    <ul class="clean-list">
      <li><strong>SDK Oficial GIS:</strong> Integración del botón oficial <em>"Continuar con Google"</em> vía Google Identity Services en React.</li>
      <li><strong>Validación Criptográfica:</strong> Endpoint en FastAPI (<code>POST /auth/google</code>) que verifica el ID Token mediante <code>google-auth</code> y la llave de cliente oficial.</li>
      <li><strong>Experiencia Ágil:</strong> Inicio de sesión en un clic con persistencia de tokens JWT del sistema; se retiró el formulario redundante para agilizar el acceso.</li>
    </ul>
  </div>

  <!-- Módulo 2 -->
  <div class="card-module warning">
    <h3>
      <span>🌡️</span> Mapa Térmico SENAMHI (25 Dptos.)
      <span class="pill pill-red">Leaflet + GeoJSON</span>
    </h3>
    <ul class="clean-list">
      <li><strong>Cobertura Total:</strong> Polígonos vectoriales oficiales de los 25 departamentos (<code>peru_departamentos.json</code>); adiós al fondo gris vacío.</li>
      <li><strong>Gradiente de 7 Niveles:</strong> Idéntico al mapa multianual del SENAMHI: desde heladas andinas (&lt;6°C azul oscuro) hasta calor de selva (&gt;26°C rojo fuego).</li>
      <li><strong>Textura de Relieve:</strong> Transparencia balanceada (<code>fillOpacity: 0.74</code>) que deja apreciar la topografía del mapa satelital oscuro de Esri ArcGIS.</li>
    </ul>
  </div>

  <!-- Módulo 3 -->
  <div class="card-module purple">
    <h3>
      <span>📍</span> Nombres Nítidos y Pin de Máximo Calor
      <span class="pill pill-purple">UI / Cartografía</span>
    </h3>
    <ul class="clean-list">
      <li><strong>Tipografía de Alta Visibilidad:</strong> Se eliminaron los bloques opacos de 120px que tapaban el mapa; se añadió sombra perimetral 360° nítida sobre cualquier color.</li>
      <li><strong>Pin Rojo Oficial (Imagen 2):</strong> Icono de gota con corte circular blanco y anillo en el suelo ubicado en los departamentos más cálidos (Piura, Loreto, Ucayali, etc.).</li>
      <li><strong>Sincronización Total:</strong> Hover o clic en polígono o pin resalta el departamento en celeste neón y actualiza el <strong>Inspector Departamental</strong>.</li>
    </ul>
  </div>

  <!-- Módulo 4 -->
  <div class="card-module success">
    <h3>
      <span>📡</span> Olas Térmicas y Radar a 60 FPS
      <span class="pill pill-green">Rendimiento GPU</span>
    </h3>
    <ul class="clean-list">
      <li><strong>Olas Térmicas Expansivas:</strong> Anillos concéntricos continuos desde los puntos de calor con CSS GPU (<code>translate3d</code> y <code>scale</code>) sin consumo de CPU.</li>
      <li><strong>Barrido Doppler de Radar:</strong> Haz giratorio animado que emula una estación de radar meteorológico profesional en vivo.</li>
      <li><strong>Control de Animación:</strong> Botón interactivo <code>Radar ON/OFF</code> en el selector de capas para activar o pausar el escaneo a voluntad.</li>
    </ul>
  </div>

</div>

<!-- SECCIÓN 2: TABLA DE ARCHIVOS CLAVE -->
<div class="section-heading">
  <span>📁</span> 2. Archivos Modificados e Impacto en el Proyecto
</div>

<table class="data-table">
  <thead>
    <tr>
      <th style="width: 32%;">Archivo</th>
      <th style="width: 18%;">Capa</th>
      <th style="width: 50%;">Descripción Breve del Cambio</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="code">frontend/src/components/PeruMap.tsx</td>
      <td>Frontend (React/Leaflet)</td>
      <td>Capa GeoJSON de 25 departamentos, escala 7 niveles SENAMHI, pin rojo de calor y sincronización.</td>
    </tr>
    <tr>
      <td class="code">frontend/src/assets/peru_departamentos.json</td>
      <td>Activos Vectoriales</td>
      <td>GeoJSON de alta precisión con las coordenadas y delimitaciones de los 25 departamentos del Perú.</td>
    </tr>
    <tr>
      <td class="code">frontend/src/index.css</td>
      <td>Estilos Globales</td>
      <td>Animaciones de olas térmicas expansivas (GPU) y haz giratorio del barrido Doppler.</td>
    </tr>
    <tr>
      <td class="code">frontend/src/components/Auth/AuthModal.tsx</td>
      <td>Frontend (Auth)</td>
      <td>Integración de Google Identity Services (GIS), flujo seguro de ID Token y modal unificado.</td>
    </tr>
    <tr>
      <td class="code">backend/app/routers/auth.py</td>
      <td>Backend (FastAPI)</td>
      <td>Endpoint <code>POST /auth/google</code> para validar el token con Google y generar sesión JWT.</td>
    </tr>
    <tr>
      <td class="code">backend/app/models/user.py</td>
      <td>Base de Datos</td>
      <td>Campos <code>google_id</code> y <code>auth_provider</code> para admitir cuentas locales y federadas.</td>
    </tr>
    <tr>
      <td class="code">.env.example / config.py</td>
      <td>Configuración</td>
      <td>Definición segura de <code>GOOGLE_CLIENT_ID</code> y <code>VITE_GOOGLE_CLIENT_ID</code>.</td>
    </tr>
  </tbody>
</table>

<!-- SALTO DE PÁGINA PARA LA SECCIÓN DE EXPOSICIÓN -->
<div class="page-break"></div>

<!-- SECCIÓN 3: CÓMO EXPLICAR ESTO EN 2 MINUTOS (PITCH DE SUSTENTACIÓN) -->
<div class="pitch-box">
  <h4><span>🎙️</span> Guía Rápida para Exponer los Cambios de la Rama (Pitch de 2 Minutos)</h4>
  <p style="margin: 0 0 6px 0; font-size: 8pt; color: #94a3b8;">
    Si el docente o jurado te pide explicar qué hiciste en tu rama, utiliza estos 3 puntos clave estructurados:
  </p>
  <div class="pitch-steps">
    <div class="pitch-step">
      <strong>1. Seguridad y Acceso</strong>
      <span>"Implementamos autenticación federada con Google (GIS) en React y validación criptográfica en FastAPI con tokens JWT, facilitando un acceso rápido y seguro en un solo clic."</span>
    </div>
    <div class="pitch-step">
      <strong>2. Cartografía Oficial SENAMHI</strong>
      <span>"Transformamos el mapa interactivo integrando los 25 departamentos vectoriales de Perú con la paleta térmica multianual de 7 niveles del SENAMHI, eliminando vacíos y reflejando el clima real."</span>
    </div>
    <div class="pitch-step">
      <strong>3. UX y Alto Rendimiento (60 FPS)</strong>
      <span>"Destacamos las zonas de mayor calor con pines vectoriales y olas térmicas con aceleración por hardware (GPU) y barrido de radar Doppler, sin sobrecargar la memoria ni ralentizar el navegador."</span>
    </div>
  </div>
</div>

<!-- SECCIÓN 4: COMPARATIVA ANTES VS DESPUÉS -->
<div class="section-heading" style="margin-top: 14px;">
  <span>🔄</span> 3. Cuadro Comparativo: Antes vs. Después en Esta Rama
</div>

<table class="data-table">
  <thead>
    <tr>
      <th style="width: 25%;">Aspecto</th>
      <th style="width: 37%;">Estado Anterior (Base)</th>
      <th style="width: 38%;">Nuevo Estado (Nuestra Rama)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Autenticación</strong></td>
      <td>Solo código de 6 dígitos enviado por correo electrónico.</td>
      <td><strong>Acceso instantáneo con Google</strong> + JWT criptográfico de sesión.</td>
    </tr>
    <tr>
      <td><strong>Cobertura del Mapa</strong></td>
      <td>Círculos difusos aislados (Leaflet.heat) sobre un fondo gris vacío.</td>
      <td><strong>Cobertura total de los 25 departamentos</strong> con polígonos GeoJSON.</td>
    </tr>
    <tr>
      <td><strong>Colores Climáticos</strong></td>
      <td>Colores genéricos sin equivalencia oficial.</td>
      <td><strong>Gradiente térmico oficial SENAMHI</strong> (7 rangos calibrados).</td>
    </tr>
    <tr>
      <td><strong>Legibilidad de Departamentos</strong></td>
      <td>Cajas opacas rectangulares de 120px que tapaban las provincias.</td>
      <td><strong>Tipografía nítida con sombra 360°</strong> sin obstrucción visual.</td>
    </tr>
    <tr>
      <td><strong>Zonas de Alto Calor</strong></td>
      <td>No se diferenciaban visualmente las regiones calurosas.</td>
      <td><strong>Pin Rojo 3D</strong> con anillo en el suelo y olas de calor (Imagen 2).</td>
    </tr>
    <tr>
      <td><strong>Efectos Visuales</strong></td>
      <td>Mapa estático sin dinamismo meteorológico.</td>
      <td><strong>Olas térmicas GPU + Barrido Doppler de Radar</strong> con botón ON/OFF.</td>
    </tr>
  </tbody>
</table>

<!-- PIE DE DOCUMENTO -->
<div style="margin-top: 14px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 7.5pt; color: #64748b;">
  <strong>Sistema Meteorológico Clima Perú</strong> &middot; Grupo 02 &middot; Rama <code>Fran_Elbuscadoencomas</code> &middot; Documento Oficial de Sustentación
</div>

</body>
</html>
"""

# Rutas de salida en la carpeta docs/
docs_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(docs_dir, "resumen_cambios_rama_temp.html")
pdf_path = os.path.join(docs_dir, "RESUMEN_CAMBIOS_RAMA_GRUPO02.pdf")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generado en: {html_path}")

edge_candidates = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
]

edge_path = next((p for p in edge_candidates if os.path.exists(p)), None)

if not edge_path:
    print("Error: No se encontró el ejecutable de Microsoft Edge para compilar el PDF.")
    sys.exit(1)

edge_cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    f"file:///{html_path.replace(os.sep, '/')}"
]

print("Compilando PDF con Microsoft Edge...")
result = subprocess.run(edge_cmd, capture_output=True, text=True)

if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
    print(f"PDF GENERADO EXITOSAMENTE: {pdf_path}")
    print(f"Tamaño: {os.path.getsize(pdf_path)} bytes")
    # Limpiar archivo temporal
    if os.path.exists(html_path):
        os.remove(html_path)
else:
    print("Error generando PDF:")
    print(result.stderr)
    print(result.stdout)
    sys.exit(1)
