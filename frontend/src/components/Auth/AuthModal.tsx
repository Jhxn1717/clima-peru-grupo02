import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CloudSun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';

type AuthView = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, initialView = 'login' }) => {
  const { setSession } = useAuth();
  const [view, setView] = useState<AuthView>(initialView);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const resetForm = () => {
    setError(null);
    setInfo(null);
    setPassword('');
  };

  const switchView = (v: AuthView) => {
    setView(v);
    resetForm();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await authApi.register({ full_name: fullName, email, password });
      const loginRes = await authApi.login({ email, password });
      setSession(loginRes.access_token, loginRes.user);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setSession(res.access_token, res.user);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-3.5 py-3 bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl overflow-hidden relative">
        {/* Top Glowing Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-sky-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-sky-500 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <span className="text-base font-black text-white">PE</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  METEO<span className="text-sky-500">PERÚ</span>
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistema Meteorológico del Perú
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switch View Tabs */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => switchView('login')}
              className={`py-2.5 rounded-xl transition-all ${
                view === 'login'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchView('register')}
              className={`py-2.5 rounded-xl transition-all ${
                view === 'register'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-2xl px-3.5 py-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}
          {info && (
            <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-3.5 py-2.5 animate-fadeIn">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{info}</span>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudSun className="w-4 h-4" />}
                Acceder a MeteoPerú
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre completo"
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Crear Cuenta & Entrar
              </button>
            </form>
          )}

          {/* Security Banner Footer */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Conexión segura cifrada con Supabase PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
