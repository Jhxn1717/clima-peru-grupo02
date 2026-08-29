import React, { useState, FormEvent } from 'react';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField, AlertBanner } from '../../components/auth/FormField';
import { authApi } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: 'login' | 'register' | 'forgot-password' | 'app' | 'admin') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { loginWithToken } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'El correo es obligatorio.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Ingresa un correo válido.';
    if (!form.password) errs.password = 'La contraseña es obligatoria.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      const token = await authApi.login({ email: form.email, password: form.password });
      await loginWithToken(token);
      onNavigate('app');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Bienvenido de nuevo" subtitle="Inicia sesión para acceder al sistema">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && <AlertBanner type="error" message={serverError} />}

        <FormField
          label="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          icon={<Mail className="w-4 h-4" />}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          error={errors.email}
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <FormField
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            autoComplete="current-password"
          />
          <div className="text-right">
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500
            disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3
            rounded-xl transition-all shadow-lg shadow-sky-600/20 text-sm"
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Iniciando sesión...</>
            : <><LogIn className="w-4 h-4" />Iniciar sesión</>}
        </button>

        <p className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            Regístrate aquí
          </button>
        </p>

        {/* Demo credentials hint */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 text-center">
          <span className="font-semibold text-slate-400">Super Admin:</span>{' '}
          superadmin@meteoperu.com · Admin1234!
        </div>
      </form>
    </AuthLayout>
  );
};
