import React, { useState, FormEvent } from 'react';
import { Mail, ArrowLeft, Send, Loader2, Lock, KeyRound } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField, AlertBanner } from '../../components/auth/FormField';
import { authApi } from '../../services/authApi';

interface ForgotPasswordPageProps {
  onNavigate: (page: 'login' | 'register' | 'forgot-password' | 'app' | 'admin') => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Paso 1: solicitar recuperación ───────────────────────────────────────
  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Ingresa un correo electrónico válido.' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setServerMessage(res.message);
      setStep('reset');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Paso 2: restablecer contraseña ───────────────────────────────────────
  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs: Record<string, string> = {};
    if (!token.trim()) errs.token = 'Ingresa el token de recuperación.';
    if (newPassword.length < 8) errs.newPassword = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword = 'Incluye al menos una mayúscula.';
    else if (!/[0-9]/.test(newPassword)) errs.newPassword = 'Incluye al menos un número.';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep('done');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error al restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'done' ? '¡Contraseña restablecida!' : 'Recuperar contraseña'}
      subtitle={
        step === 'request'
          ? 'Ingresa tu correo y te enviaremos las instrucciones'
          : step === 'reset'
          ? 'Ingresa el token recibido y tu nueva contraseña'
          : 'Ya puedes iniciar sesión con tu nueva contraseña'
      }
    >
      {/* Paso 1 — solicitar */}
      {step === 'request' && (
        <form onSubmit={handleRequest} className="space-y-5" noValidate>
          {serverError && <AlertBanner type="error" message={serverError} />}
          <FormField
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500
              disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
              : <><Send className="w-4 h-4" />Enviar instrucciones</>}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
          </button>
        </form>
      )}

      {/* Paso 2 — restablecer */}
      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-4" noValidate>
          {serverMessage && <AlertBanner type="success" message={serverMessage} />}
          {serverError && <AlertBanner type="error" message={serverError} />}
          <FormField
            label="Token de recuperación"
            type="text"
            placeholder="Pega aquí el token recibido"
            icon={<KeyRound className="w-4 h-4" />}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            error={errors.token}
          />
          <FormField
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
            autoComplete="new-password"
          />
          <FormField
            label="Confirmar nueva contraseña"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500
              disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Restableciendo...</>
              : <><Lock className="w-4 h-4" />Restablecer contraseña</>}
          </button>
        </form>
      )}

      {/* Paso 3 — éxito */}
      {step === 'done' && (
        <div className="space-y-5 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-slate-300 text-sm">
            Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            Ir al inicio de sesión
          </button>
        </div>
      )}
    </AuthLayout>
  );
};
