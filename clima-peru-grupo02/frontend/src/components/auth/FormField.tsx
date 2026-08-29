import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label, error, icon, type = 'text', className = '', ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={`w-full bg-slate-900 border ${
            error ? 'border-red-500/70 focus:border-red-500' : 'border-slate-700 focus:border-sky-500'
          } text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3
          ${icon ? 'pl-11' : ''}
          ${isPassword ? 'pr-11' : ''}
          focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-500/40' : 'focus:ring-sky-500/40'}
          transition-all text-sm ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
          <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
          {error}
        </p>
      )}
    </div>
  );
};

interface AlertBannerProps {
  type: 'error' | 'success' | 'warning';
  message: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type, message }) => {
  const styles = {
    error:   'bg-red-500/10 border-red-500/40 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
  };
  return (
    <div className={`px-4 py-3 rounded-xl border text-sm ${styles[type]}`}>
      {message}
    </div>
  );
};
