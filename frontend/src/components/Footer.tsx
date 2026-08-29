import React from 'react';
import { CloudSun, Database, Code2, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full glass-panel border-t border-slate-200/80 dark:border-slate-800/80 mt-12 py-10 text-slate-500 dark:text-slate-400 text-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-sky-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                PE
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">METEO<span className="text-sky-500 dark:text-sky-400">PERÚ</span></span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs max-w-md">
              Plataforma meteorológica académica de alta precisión dedicada al análisis, visualización y monitoreo climatológico de las 25 regiones y principales ciudades del Perú.
            </p>
            <p className="text-[11px] text-slate-500">
              Desarrollado como proyecto académico por el <strong className="text-slate-700 dark:text-slate-300">Grupo 02</strong>.
            </p>
          </div>

          {/* Architecture Stack */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">Arquitectura & Stack</span>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Backend: FastAPI (Python 3.11)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Frontend: React 18 + TypeScript + Vite</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Base de Datos: SQLite / PostgreSQL</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Mapas & Gráficos: Leaflet & Recharts</span>
              </li>
            </ul>
          </div>

          {/* Data Sources */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">Fuentes Meteorológicas</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Integración directa con modelos globales de alta resolución <strong>ECMWF (9km)</strong> y <strong>GFS (13km)</strong> mediante la API de Open-Meteo y referencias del Servicio Nacional de Meteorología e Hidrología del Perú (SENAMHI).
            </p>
            <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500">
              Actualizaciones continuas y pronósticos generados para coordenadas geográficas oficiales del Perú.
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 METEOPERÚ — Sistema de Clima y Datos Meteorológicos del Perú. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-1 font-medium">
            <span>Diseñado con excelencia académica y tecnológica para el Perú</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

