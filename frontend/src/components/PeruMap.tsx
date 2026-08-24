import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Thermometer, CloudRain, Sun, MapPin, Eye } from 'lucide-react';
import { DepartmentWeatherSummary, City } from '../types/weather';

interface PeruMapProps {
  departmentsSummary: DepartmentWeatherSummary[];
  onSelectCityByName: (cityName: string) => void;
  selectedCity: City | null;
}

export const PeruMap: React.FC<PeruMapProps> = ({
  departmentsSummary,
  onSelectCityByName,
  selectedCity
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [metric, setMetric] = useState<'temperature' | 'precipitation' | 'uv_index'>('temperature');
  const [hoveredDept, setHoveredDept] = useState<DepartmentWeatherSummary | null>(null);

  // Helper to color-code based on active metric
  const getMetricColor = (val: number, type: 'temperature' | 'precipitation' | 'uv_index') => {
    if (type === 'temperature') {
      if (val <= 12) return '#06b6d4'; // Cyan (Cold)
      if (val <= 20) return '#10b981'; // Green (Mild)
      if (val <= 28) return '#f59e0b'; // Amber (Warm)
      return '#ef4444'; // Red (Hot)
    } else if (type === 'precipitation') {
      if (val === 0) return '#64748b'; // Slate (No rain)
      if (val <= 2) return '#38bdf8'; // Light Blue
      if (val <= 8) return '#2563eb'; // Blue
      return '#7c3aed'; // Violet (Heavy)
    } else {
      if (val < 3) return '#10b981'; // Low
      if (val < 6) return '#eab308'; // Moderate
      if (val < 8) return '#f97316'; // High
      if (val < 11) return '#ef4444'; // Very High
      return '#a855f7'; // Extreme
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Peru coordinates [-9.19, -75.01]
      const map = L.map(mapContainerRef.current, {
        center: [-9.189967, -75.015152],
        zoom: 5.5,
        minZoom: 4,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when departmentsSummary or metric changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    departmentsSummary.forEach((dept) => {
      const val = dept[metric];
      const color = getMetricColor(val, metric);
      const isSelected = selectedCity?.name === dept.capital || selectedCity?.department_name === dept.department_name;

      const unit = metric === 'temperature' ? '°C' : metric === 'precipitation' ? ' mm' : ' UV';
      const label = metric === 'temperature' ? `${dept.temperature}°` : metric === 'precipitation' ? `${dept.precipitation}mm` : `UV ${dept.uv_index}`;

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            background: rgba(15, 23, 42, 0.9);
            border: 2px solid ${color};
            border-radius: 9999px;
            box-shadow: 0 4px 12px ${color}40;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
            transition: all 0.2s ease;
            white-space: nowrap;
          ">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
            <span>${dept.department_name}</span>
            <span style="color: ${color}; font-weight: 800;">${label}</span>
          </div>
        `,
        iconSize: [120, 26],
        iconAnchor: [60, 13]
      });

      const marker = L.marker([dept.latitude, dept.longitude], { icon: customIcon });

      const popupContent = `
        <div style="padding: 6px 2px; min-width: 180px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 8px;">
            <strong style="font-size: 14px; color: #38bdf8;">${dept.department_name}</strong>
            <span style="font-size: 10px; color: #94a3b8;">${dept.region_natural}</span>
          </div>
          <div style="font-size: 12px; margin-bottom: 4px;"><strong>Capital:</strong> ${dept.capital}</div>
          <div style="font-size: 12px; margin-bottom: 4px;"><strong>Clima:</strong> ${dept.weather_description}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-top: 8px; background: rgba(30,41,59,0.5); padding: 6px; border-radius: 8px;">
            <div>🌡️ Temp: <strong>${dept.temperature}°C</strong></div>
            <div>💧 Hum: <strong>${dept.relative_humidity}%</strong></div>
            <div>🌧️ Lluvia: <strong>${dept.precipitation} mm</strong></div>
            <div>☀️ UV: <strong>${dept.uv_index}</strong></div>
          </div>
          <button id="btn-select-${dept.department_id}" style="
            width: 100%;
            margin-top: 8px;
            padding: 6px 0;
            background: #0284c7;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">
            Ver Clima en Dashboard
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${dept.department_id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectCityByName(dept.capital);
            marker.closePopup();
          };
        }
      });

      marker.on('mouseover', () => {
        setHoveredDept(dept);
      });

      marker.on('click', () => {
        onSelectCityByName(dept.capital);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [departmentsSummary, metric, selectedCity]);

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      
      {/* Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Mapa Meteorológico Interactivo del Perú
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Explora las condiciones en los 25 departamentos. Pasa el cursor o haz clic para consultar.
          </p>
        </div>

        {/* Metric Layer Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setMetric('temperature')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              metric === 'temperature'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperatura</span>
          </button>

          <button
            onClick={() => setMetric('precipitation')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              metric === 'precipitation'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Lluvia</span>
          </button>

          <button
            onClick={() => setMetric('uv_index')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              metric === 'uv_index'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Índice UV</span>
          </button>
        </div>
      </div>

      {/* Map Container & Interactive Inspector Side Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Map Canvas */}
        <div className="lg:col-span-3 h-[480px] rounded-2xl overflow-hidden border border-slate-800 relative">
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Map Legend Floating */}
          <div className="absolute bottom-3 left-3 z-10 glass-panel p-2.5 rounded-xl text-[10px] space-y-1.5 max-w-[200px] border border-slate-700/80">
            <span className="font-bold text-slate-300 block">
              Escala de {metric === 'temperature' ? 'Temperatura (°C)' : metric === 'precipitation' ? 'Precipitación (mm)' : 'Índice UV'}
            </span>
            {metric === 'temperature' ? (
              <div className="flex items-center justify-between gap-1">
                <span className="text-cyan-400">&le;12° Frío</span>
                <span className="text-emerald-400">20° Templado</span>
                <span className="text-rose-400">&ge;28° Cálido</span>
              </div>
            ) : metric === 'precipitation' ? (
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-400">0mm Seco</span>
                <span className="text-blue-400">2-8mm Moderada</span>
                <span className="text-purple-400">&gt;8mm Fuerte</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1">
                <span className="text-emerald-400">1-2 Bajo</span>
                <span className="text-amber-400">6-7 Alto</span>
                <span className="text-purple-400">11+ Extremo</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover / Selected Inspector Side Panel */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-2 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5" />
              <span>Inspector Departamental</span>
            </div>

            {hoveredDept ? (
              <div className="space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xl font-bold text-white">{hoveredDept.department_name}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-0.5">
                    <span>Capital: <strong className="text-slate-300">{hoveredDept.capital}</strong></span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 font-medium">{hoveredDept.region_natural}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60">
                    <span className="text-slate-400">🌡️ Temperatura:</span>
                    <span className="font-bold text-amber-300 text-sm">{hoveredDept.temperature}°C</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60">
                    <span className="text-slate-400">💧 Humedad:</span>
                    <span className="font-bold text-sky-300 text-sm">{hoveredDept.relative_humidity}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60">
                    <span className="text-slate-400">🌧️ Precipitación:</span>
                    <span className="font-bold text-blue-300 text-sm">{hoveredDept.precipitation} mm</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60">
                    <span className="text-slate-400">☀️ Índice UV:</span>
                    <span className="font-bold text-purple-300 text-sm">{hoveredDept.uv_index}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60">
                    <span className="text-slate-400">💨 Viento:</span>
                    <span className="font-bold text-teal-300 text-sm">{hoveredDept.wind_speed} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Pasa el cursor o haz clic sobre cualquier departamento en el mapa para inspeccionar sus datos.</p>
              </div>
            )}
          </div>

          {hoveredDept && (
            <button
              onClick={() => onSelectCityByName(hoveredDept.capital)}
              className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20"
            >
              Cargar {hoveredDept.capital} en Dashboard
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
