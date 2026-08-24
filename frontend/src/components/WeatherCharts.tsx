import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Thermometer, CloudRain, Droplets, Wind } from 'lucide-react';
import { HourlyForecastItem } from '../types/weather';

interface WeatherChartsProps {
  hourly: HourlyForecastItem[];
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ hourly }) => {
  const [activeTab, setActiveTab] = useState<'temp' | 'rain' | 'humidity' | 'wind'>('temp');

  const chartData = hourly.slice(0, 24).map((h) => ({
    hour: h.hour_label,
    temp: h.temperature,
    feelsLike: h.apparent_temperature,
    pop: h.precipitation_probability,
    rain: h.precipitation,
    humidity: h.relative_humidity,
    wind: h.wind_speed,
    uv: h.uv_index,
    description: h.weather_description
  }));

  const tabs = [
    { id: 'temp', label: 'Temperatura', icon: Thermometer, color: 'text-amber-400' },
    { id: 'rain', label: 'Precipitación', icon: CloudRain, color: 'text-blue-400' },
    { id: 'humidity', label: 'Humedad', icon: Droplets, color: 'text-sky-400' },
    { id: 'wind', label: 'Viento', icon: Wind, color: 'text-teal-400' },
  ];

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1">
          <p className="font-bold text-sky-400">{label} hrs</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: <span className="font-bold">{entry.value} {entry.unit || ''}</span>
            </p>
          ))}
          {payload[0]?.payload?.description && (
            <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
              {payload[0].payload.description}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Análisis Gráfico Horario
          </h3>
          <p className="text-xs text-slate-400">Evolución de variables meteorológicas en las próximas 24 horas</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'temp' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="°" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="temp" name="Temperatura" unit="°C" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#tempGradient)" />
              <Area type="monotone" dataKey="feelsLike" name="Sensación Térmica" unit="°C" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#feelsGradient)" />
            </AreaChart>
          ) : activeTab === 'rain' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pop" name="Probabilidad de Lluvia" unit="%" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="rain" name="Precipitación Estimada" unit=" mm" stroke="#60a5fa" strokeWidth={2} />
            </BarChart>
          ) : activeTab === 'humidity' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="humidity" name="Humedad Relativa" unit="%" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#humidityGradient)" />
            </AreaChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" km/h" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="wind" name="Velocidad del Viento" unit=" km/h" stroke="#2dd4bf" strokeWidth={2.5} fillOpacity={1} fill="url(#windGradient)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  );
};
