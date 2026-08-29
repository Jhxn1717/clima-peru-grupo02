import React, { ReactNode } from 'react';
import { CloudSun } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => (
  <div className="min-h-screen flex bg-slate-950">
    {/* Panel izquierdo decorativo */}
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-sky-600/10 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-sky-500 p-0.5 shadow-lg">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
            <span className="text-xl font-black text-white">PE</span>
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-white">
            METEO<span className="text-sky-400">PERÚ</span>
          </div>
          <div className="text-xs text-slate-400">Sistema Meteorológico</div>
        </div>
      </div>

      {/* Contenido central */}
      <div className="relative space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <CloudSun className="w-5 h-5 text-sky-400" />
          </div>
          <span className="text-sm font-medium text-sky-400 uppercase tracking-wider">
            Datos en tiempo real
          </span>
        </div>
        <h2 className="text-4xl font-bold text-white leading-tight">
          Monitoreo meteorológico<br />
          <span className="text-sky-400">del Perú</span>
        </h2>
        <p className="text-slate-400 text-base leading-relaxed max-w-sm">
          Accede a pronósticos, alertas climáticas, análisis histórico y
          comparación de las 60+ ciudades del Perú.
        </p>

        {/* Stats decorativas */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { value: '25', label: 'Departamentos' },
            { value: '60+', label: 'Ciudades' },
            { value: '24/7', label: 'Disponible' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-sky-400">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="relative text-xs text-slate-500">
        © {new Date().getFullYear()} MeteoPerú · Grupo 02
      </p>
    </div>

    {/* Panel derecho — formulario */}
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md">
        {/* Logo mobile */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-sky-500 p-0.5">
            <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
              <span className="text-sm font-black text-white">PE</span>
            </div>
          </div>
          <span className="text-lg font-bold text-white">METEO<span className="text-sky-400">PERÚ</span></span>
        </div>

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  </div>
);
