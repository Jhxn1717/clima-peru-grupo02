import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';

type AuthView = 'login' | 'register' | 'verify';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const { setSession } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const resetForm = () => {
    setError(null);
    setInfo(null);
    setCode('');
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
      setInfo('Revisa tu correo, te enviamos un código de verificación.');
      setView('verify');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await authApi.verify({ email, code });
      setSession(res.access_token, res.user);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setLoading(true);
    try {
      await authApi.resendCode(email);
      setInfo('Se reenvió un nuevo código a tu correo.');
    } catch (err: any) {
      setError(err.message || 'No se pudo reenviar el código');
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
      const msg = err.message || 'Error al iniciar sesión';
      if (msg.toLowerCase().includes('verifica') && msg.toLowerCase().includes('correo')) {
        setView('verify');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-sky-500 flex items-center justify-center">
              <span className="text-sm font-black text-white">PE</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {view === 'login' ? 'Iniciar Sesión' : view === 'register' ? 'Crear Cuenta' : 'Verificar Correo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {view === 'verify' ? 'Ingresa el código de 6 dígitos enviado a tu correo' : 'Sistema Meteorológico del Perú'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              {info}
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Iniciar Sesión
              </button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={() => switchView('register')} className="text-sky-500 font-semibold hover:underline">
                  Regístrate
                </button>
              </p>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Enviar código de verificación
              </button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => switchView('login')} className="text-sky-500 font-semibold hover:underline">
                  Inicia sesión
                </button>
              </p>
            </form>
          )}

          {view === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Código de 6 dígitos"
                  className={`${inputClass} text-center tracking-[0.5em] font-bold`}
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verificar y crear cuenta
              </button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={handleResend} disabled={loading} className="text-sky-500 font-semibold hover:underline disabled:opacity-50">
                  Reenviar código
                </button>
                <button type="button" onClick={() => switchView('login')} className="text-slate-500 dark:text-slate-400 hover:underline">
                  Volver a inicio
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
