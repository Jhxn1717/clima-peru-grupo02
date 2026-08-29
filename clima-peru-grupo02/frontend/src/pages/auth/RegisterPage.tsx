import React, { useState, FormEvent } from 'react';
import { Mail, Lock, User, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField, AlertBanner } from '../../components/auth/FormField';
import { authApi } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onNavigate: (page: 'login' | 'register' | 'forgot-password' | 'app' | 'admin') => void;
}

const passwordRules = [
  { test: (v: string) => v.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (v: string) => /[A-Z]/.test(v), label: 'Una mayúscula' },
  { test: (v: string) => /[0-9]/.test(v), label: 'Un número' },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { loginWithToken } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2)
      errs.full_name = 'Ingresa tu nombre completo (mínimo 2 caracteres).';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Ingresa un correo electrónico válido.';
    if (form.password.length < 8)
      errs.password = 'La contraseña debe tener al menos 8 caracteres.';
    else if (!/[A-Z]/.test(form.password))
      errs.password = 'Incluye al menos una letra mayúscula.';
    else if (!/[0-9]/.test(form.password))
      errs.password = 'Incluye al menos un número.';
    if (form.password !== form.confirm_password)
      errs.confirm_password = 'Las contraseñas no coinciden.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      const token = await authApi.register(form);
      await loginWithToken(token);
      onNavigate('app');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error al crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Crear cuenta" subtitle="Regístrate para acceder al sistema meteorológico">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {serverError && <AlertBanner type="error" message={serverError} />}

        <FormField
          label="Nombre completo"
          type="text"
          placeholder="Juan Pérez López"
          icon={<User className="w-4 h-4" />}
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          error={errors.full_name}
          autoComplete="name"
        />

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

        <div className="space-y-2">
          <FormField
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            autoComplete="new-password"
          />
          {/* Indicadores de fortaleza */}
          {form.password && (
            <div className="flex gap-3 flex-wrap pt-1">
              {passwordRules.map((rule) => {
                const ok = rule.test(form.password);
                return (
                  <div key={rule.label} className={`flex items-center gap-1 text-xs ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${ok ? 'text-emerald-400' : 'text-slate-600'}`} />
                    {rule.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <FormField
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-4 h-4" />}
          value={form.confirm_password}
          onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
          error={errors.confirm_password}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500
            disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3
            rounded-xl transition-all shadow-lg shadow-sky-600/20 text-sm mt-2"
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Creando cuenta...</>
            : <><UserPlus className="w-4 h-4" />Crear cuenta</>}
        </button>

        <p className="text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            Iniciar sesión
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};
