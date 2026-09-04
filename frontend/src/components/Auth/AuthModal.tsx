import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock,
  KeyRound,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const { setSession } = useAuth();

  // Mode: 'code_request' (ingresar correo) | 'code_verify' (código 6 dígitos) | 'password_login' (con contraseña)
  const [authMode, setAuthMode] = useState<'code_request' | 'code_verify' | 'password_login'>('code_request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!open) return null;

  const resetForm = () => {
    setError(null);
    setInfo(null);
    setCode('');
    setPassword('');
    setAuthMode('code_request');
  };

  // Enviar código de 6 dígitos al correo
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      await authApi.sendValidationCode(email.trim());
      setInfo(`¡Código enviado! Revisa tu bandeja de entrada o spam.`);
      setAuthMode('code_verify');
      setResendCooldown(45);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código de validación');
    } finally {
      setLoading(false);
    }
  };

  // Validar código de 6 dígitos (inicia sesión o crea cuenta automáticamente)
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setError('El código debe contener los 6 dígitos numéricos');
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const res = await authApi.verifyValidationCode(email.trim(), code.trim());
      setSession(res.access_token, res.user);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.sendValidationCode(email.trim());
      setInfo(`Nuevo código enviado a ${email}`);
      setResendCooldown(45);
    } catch (err: any) {
      setError(err.message || 'Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión con contraseña (para administradores o cuentas creadas)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      setSession(res.access_token, res.user);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Correo o contraseña incorrectos');
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
                <span className="px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Iniciar Sesión en el Sistema
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-2xl px-3.5 py-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Info Message */}
          {info && (
            <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-3.5 py-2.5 animate-fadeIn">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{info}</span>
            </div>
          )}

          {/* PASO 1: Ingreso de Correo para Código */}
          {authMode === 'code_request' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Acceso con Código de Validación
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Escribe tu correo electrónico para enviarte un código de acceso inmediato.
                </p>
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span>Enviar Código de Validación</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAuthMode('password_login');
                  }}
                  className="text-xs text-sky-500 hover:underline font-medium"
                >
                  ¿Prefieres ingresar con contraseña? Haz clic aquí
                </button>
              </div>
            </form>
          )}

          {/* PASO 2: Ingresar Código de 6 Dígitos */}
          {authMode === 'code_verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 mx-auto flex items-center justify-center mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ingresa tu Código de Validación
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ingresa los 6 dígitos enviados a <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
                </p>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className={`${inputClass} text-center font-mono text-xl tracking-[0.35em] font-bold`}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Validar Código y Entrar</span>
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode('code_request')}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Cambiar correo
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResend}
                  className="text-sky-500 hover:text-sky-600 dark:text-sky-400 font-bold disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}

          {/* PASO 3: Ingreso con Contraseña */}
          {authMode === 'password_login' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fadeIn">
              <div className="text-center space-y-1 mb-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4 text-sky-400" />
                  <span>Acceso con Contraseña</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Para administradores o cuentas con clave
                </p>
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Ingresar al Sistema</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('code_request')}
                  className="text-xs text-sky-500 hover:underline"
                >
                  Volver al acceso con código por correo
                </button>
              </div>
            </form>
          )}

          {/* Footer Informativo */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sin registro manual · Tu cuenta se crea automáticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
};
