import React from 'react';
import {
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Gauge,
  Cloud,
  Compass
} from 'lucide-react';
import { CurrentWeather } from '../types/weather';

interface MetricCardsGridProps {
  weather: CurrentWeather;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ weather }) => {
  // Helpers
  const getUvBadge = (uv: number, category: string) => {
    if (uv < 3) return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', bar: 'bg-emerald-400', pct: Math.min(100, (uv / 12) * 100) };
    if (uv < 6) return { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', bar: 'bg-yellow-400', pct: Math.min(100, (uv / 12) * 100) };
    if (uv < 8) return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', bar: 'bg-amber-400', pct: Math.min(100, (uv / 12) * 100) };
    if (uv < 11) return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', bar: 'bg-rose-400', pct: Math.min(100, (uv / 12) * 100) };
    return { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', bar: 'bg-purple-400', pct: 100 };
  };

  const getWindDirectionLabel = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  };

  const getHumidityDescription = (hum: number) => {
    if (hum < 30) return 'Ambiente seco';
    if (hum <= 65) return 'Nivel óptimo y agradable';
    if (hum <= 80) return 'Humedad moderada';
    return 'Humedad alta (típica en costa)';
  };

  const uvInfo = getUvBadge(weather.uv_index, weather.uv_category);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      
      {/* 1. Humedad */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Humedad</span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <Droplets className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{weather.relative_humidity}</span>
            <span className="text-sm text-sky-400 font-semibold">%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
            {getHumidityDescription(weather.relative_humidity)}
          </p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${weather.relative_humidity}%` }}
          />
        </div>
      </div>

      {/* 2. Viento */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Viento</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <Wind className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{weather.wind_speed}</span>
            <span className="text-xs text-teal-400 font-semibold">km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
            <Compass className="w-3 h-3 text-teal-400" />
            <span>Dirección: <strong className="text-slate-200">{getWindDirectionLabel(weather.wind_direction)} ({weather.wind_direction}°)</strong></span>
          </div>
        </div>
        {weather.wind_gusts ? (
          <p className="text-[10px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md">
            Ráfagas: <span className="text-teal-300 font-medium">{weather.wind_gusts} km/h</span>
          </p>
        ) : (
          <div className="h-4" />
        )}
      </div>

      {/* 3. Precipitación y Probabilidad */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Precipitación</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <CloudRain className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{weather.precipitation}</span>
            <span className="text-xs text-blue-400 font-semibold">mm</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Probabilidad: <strong className="text-slate-200">{weather.precipitation_probability ?? 0}%</strong>
          </p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (weather.precipitation_probability || 0))}%` }}
          />
        </div>
      </div>

      {/* 4. Índice UV */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Índice UV</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">{weather.uv_index}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${uvInfo.bg}`}>
              {weather.uv_category}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {weather.uv_index >= 8 ? 'Protección solar extrema obligatoria' : 'Fotoprotección recomendada'}
          </p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`${uvInfo.bar} h-full rounded-full transition-all duration-500`}
            style={{ width: `${uvInfo.pct}%` }}
          />
        </div>
      </div>

      {/* 5. Presión Atmosférica */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Presión</span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{Math.round(weather.surface_pressure)}</span>
            <span className="text-xs text-purple-400 font-semibold">hPa</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {weather.surface_pressure > 1013 ? 'Alta presión (Estable)' : 'Baja presión (Variable)'}
          </p>
        </div>
        <div className="text-[10px] text-slate-500">
          Nivel de superficie
        </div>
      </div>

      {/* 6. Nubosidad */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Nubosidad</span>
          <div className="p-2 rounded-xl bg-slate-500/10 text-slate-300">
            <Cloud className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{weather.cloud_cover}</span>
            <span className="text-xs text-slate-400 font-semibold">%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cobertura del cielo
          </p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-slate-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${weather.cloud_cover}%` }}
          />
        </div>
      </div>

    </div>
  );
};
