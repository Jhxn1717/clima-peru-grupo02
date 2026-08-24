import React from 'react';
import { Clock, Droplets, Wind } from 'lucide-react';
import { HourlyForecastItem } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly }) => {
  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Pronóstico por Horas (Próximas 24 Horas)
          </h3>
        </div>
        <span className="text-xs text-slate-400">Desplazamiento horizontal</span>
      </div>

      {/* Horizontal Scroll List */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth">
        {hourly.map((item, index) => {
          const isNow = index === 0;
          return (
            <div
              key={item.time}
              className={`shrink-0 w-28 p-3.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
                isNow
                  ? 'bg-gradient-to-b from-sky-500/20 to-slate-900/90 border border-sky-500/50 shadow-md shadow-sky-500/10'
                  : 'glass-card hover:border-slate-600/60'
              }`}
            >
              {/* Hour Label */}
              <span className={`text-xs font-semibold ${isNow ? 'text-sky-300' : 'text-slate-400'}`}>
                {isNow ? 'Ahora' : item.hour_label}
              </span>

              {/* Weather Icon */}
              <div className="my-2.5 p-2 rounded-xl bg-slate-800/60">
                <WeatherIcon name={item.weather_icon} size={28} />
              </div>

              {/* Temperature */}
              <span className="text-lg font-bold text-white">
                {Math.round(item.temperature)}°C
              </span>

              {/* Rain Probability & Wind */}
              <div className="w-full mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[11px] text-blue-400 font-medium">
                  <Droplets className="w-3 h-3" />
                  <span>{item.precipitation_probability}%</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                  <Wind className="w-2.5 h-2.5 text-teal-400" />
                  <span>{item.wind_speed} k/h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
