import React from 'react';
import {
  MapPin,
  Sunrise,
  Sunset,
  ArrowUp,
  ArrowDown,
  Thermometer,
  Clock3,
  Mountain
} from 'lucide-react';
import { CurrentWeather } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';

interface CurrentWeatherHeroProps {
  weather: CurrentWeather;
}

export const CurrentWeatherHero: React.FC<CurrentWeatherHeroProps> = ({ weather }) => {
  const getRegionBadgeColor = (region?: string | null) => {
    switch (region) {
      case 'Costa':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Sierra':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Selva':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-sky-950/40 border border-slate-700/50 shadow-2xl shadow-sky-950/20">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Left: Location & Weather Description */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-lg">
              <MapPin className="w-5 h-5" />
              <span>{weather.city_name}</span>
            </div>
            {weather.department_name && (
              <span className="text-slate-400 text-sm font-medium">
                • {weather.department_name}, Perú
              </span>
            )}
            {weather.region_natural && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRegionBadgeColor(weather.region_natural)}`}>
                Región {weather.region_natural}
              </span>
            )}
            {weather.altitude !== undefined && weather.altitude !== null && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                <Mountain className="w-3 h-3 text-slate-400" />
                {weather.altitude} msnm
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner flex items-center justify-center animate-float">
              <WeatherIcon name={weather.weather_icon} size={48} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight capitalize">
                {weather.weather_description}
              </h2>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  Sensación: <strong className="text-slate-200">{weather.apparent_temperature}°C</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5 text-sky-400" />
                  Actualizado: {weather.updated_at.split(' ')[1] || weather.updated_at}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Big Temperature Display & Day Summary */}
        <div className="flex flex-col items-start md:items-end space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-white">
              {Math.round(weather.temperature)}
            </span>
            <span className="text-3xl sm:text-4xl font-light text-sky-400">°C</span>
          </div>

          {/* Range and Solar Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ArrowDown className="w-4 h-4" />
              <span>{weather.temp_min}°C</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-1 text-rose-400 font-semibold">
              <ArrowUp className="w-4 h-4" />
              <span>{weather.temp_max}°C</span>
            </div>
            {weather.sunrise && (
              <>
                <div className="w-px h-4 bg-slate-700" />
                <div className="flex items-center gap-1 text-amber-300 text-xs">
                  <Sunrise className="w-3.5 h-3.5" />
                  <span>{weather.sunrise}</span>
                </div>
              </>
            )}
            {weather.sunset && (
              <div className="flex items-center gap-1 text-indigo-300 text-xs">
                <Sunset className="w-3.5 h-3.5" />
                <span>{weather.sunset}</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
