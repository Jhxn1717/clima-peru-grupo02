import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 mt-12 py-6 text-slate-500 dark:text-slate-400 text-[11px] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-sky-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
            PE
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">METEO<span className="text-sky-500 dark:text-sky-400">PERÚ</span></span>
        </div>

        <div className="text-center sm:text-right">
          © 2026 METEOPERÚ — Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

