import React from 'react';
import { Calendar, Droplets, Sun, ArrowUp, ArrowDown } from 'lucide-react';
import { DailyForecastItem } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';

interface DailyForecastProps {
  daily: DailyForecastItem[];
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ daily }) => {
  // Find global min and max to normalize thermal range bars
  const globalMin = Math.min(...daily.map(d => d.temp_min));
  const globalMax = Math.max(...daily.map(d => d.temp_max));
  const tempRange = Math.max(1, globalMax - globalMin);

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Pronóstico Extendido (Próximos 7 Días)
          </h3>
        </div>
        <span className="text-xs text-slate-400">Rango térmico y lluvia</span>
      </div>

      <div className="space-y-2.5">
        {daily.map((day, index) => {
          const isToday = index === 0;
          // Calculate bar position
          const leftPct = ((day.temp_min - globalMin) / tempRange) * 100;
          const widthPct = Math.max(10, ((day.temp_max - day.temp_min) / tempRange) * 100);

          return (
            <div
              key={day.date}
              className={`p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                isToday
                  ? 'bg-slate-800/80 border border-sky-500/30 shadow-sm'
                  : 'glass-card hover:bg-slate-800/50'
              }`}
            >
              {/* Day & Date */}
              <div className="w-full sm:w-36 flex items-center justify-between sm:justify-start gap-3">
                <div>
                  <span className={`text-sm font-bold block ${isToday ? 'text-sky-400' : 'text-white'}`}>
                    {isToday ? 'Hoy' : day.day_name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {day.date.split('-').slice(1).reverse().join('/')}
                  </span>
                </div>
                {/* Mobile icon */}
                <div className="sm:hidden flex items-center gap-2">
                  <WeatherIcon name={day.weather_icon} size={24} />
                  <span className="text-xs text-slate-300 font-semibold">{Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°</span>
                </div>
              </div>

              {/* Icon & Condition Description */}
              <div className="hidden sm:flex items-center gap-3 w-48">
                <div className="p-1.5 rounded-lg bg-slate-900/60">
                  <WeatherIcon name={day.weather_icon} size={24} />
                </div>
                <span className="text-xs font-medium text-slate-300 truncate">
                  {day.weather_description}
                </span>
              </div>

              {/* Rain Probability & UV */}
              <div className="flex items-center gap-4 w-36 text-xs">
                <div className="flex items-center gap-1 text-blue-400 font-medium" title="Probabilidad de lluvia">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{day.precipitation_probability_max}%</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-medium" title="Índice UV máximo">
                  <Sun className="w-3.5 h-3.5" />
                  <span>UV {day.uv_index_max}</span>
                </div>
              </div>

              {/* Thermal Range Bar & Min/Max */}
              <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs">
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold w-10 text-right">
                  <ArrowDown className="w-3 h-3" />
                  <span>{Math.round(day.temp_min)}°</span>
                </div>

                <div className="flex-1 bg-slate-900/90 rounded-full h-2 relative overflow-hidden">
                  <div
                    className="absolute h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`
                    }}
                  />
                </div>

                <div className="flex items-center gap-1 text-rose-400 text-xs font-bold w-10">
                  <ArrowUp className="w-3 h-3" />
                  <span>{Math.round(day.temp_max)}°</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
