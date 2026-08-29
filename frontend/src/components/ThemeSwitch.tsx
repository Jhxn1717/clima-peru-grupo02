import React from 'react';

interface ThemeSwitchProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      type="button"
      role="switch"
      aria-checked={isDark}
      title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      className="relative flex items-center select-none cursor-pointer focus:outline-none transition-all duration-300 group"
      style={{
        width: '138px',
        height: '46px',
        borderRadius: '9999px',
        padding: '4px',
        background: isDark ? '#232936' : '#e2e7ee',
        boxShadow: isDark
          ? 'inset 0 3px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.2)'
          : 'inset 0 3px 6px rgba(0,0,0,0.14), inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(255,255,255,0.5)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Background Labels Container */}
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none overflow-hidden">
        {/* LIGHT MODE Label (Visible when Light) */}
        <div
          className={`flex flex-col items-center justify-center pl-2 transition-all duration-300 ${
            !isDark ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none'
          }`}
        >
          <span
            className="text-[10px] font-black uppercase leading-tight tracking-wider"
            style={{ color: '#526071' }}
          >
            LIGHT
          </span>
          <span
            className="text-[10px] font-black uppercase leading-tight tracking-wider"
            style={{ color: '#526071' }}
          >
            MODE
          </span>
        </div>

        {/* DARK MODE Label (Visible when Dark) */}
        <div
          className={`flex flex-col items-center justify-center pr-2 ml-auto transition-all duration-300 ${
            isDark ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3 pointer-events-none'
          }`}
        >
          <span
            className="text-[10px] font-black uppercase leading-tight tracking-wider"
            style={{ color: '#d1d8e0' }}
          >
            DARK
          </span>
          <span
            className="text-[10px] font-black uppercase leading-tight tracking-wider"
            style={{ color: '#d1d8e0' }}
          >
            MODE
          </span>
        </div>
      </div>

      {/* Floating Circular Knob */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full transition-transform duration-300 ease-out"
        style={{
          width: '38px',
          height: '38px',
          background: '#f8fafc',
          boxShadow: isDark
            ? '0 3px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.9)'
            : '0 3px 8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,1)',
          transform: isDark ? 'translateX(0px)' : 'translateX(92px)',
        }}
      >
        {isDark ? (
          /* Neumorphic Minimalist Moon with Stars Icon */
          <svg
            className="w-5 h-5 text-slate-500 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            <path d="M19 3v4" strokeWidth="2" />
            <path d="M21 5h-4" strokeWidth="2" />
          </svg>
        ) : (
          /* Neumorphic Minimalist Sun Icon */
          <svg
            className="w-5 h-5 text-slate-500 transform rotate-0 group-hover:rotate-45 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5" />
            <path d="M12 19.5V22" />
            <path d="m4.93 4.93 1.77 1.77" />
            <path d="m17.3 17.3 1.77 1.77" />
            <path d="M2 12h2.5" />
            <path d="M19.5 12H22" />
            <path d="m4.93 19.07 1.77-1.77" />
            <path d="m17.3 6.7 1.77-1.77" />
          </svg>
        )}
      </div>
    </button>
  );
};
