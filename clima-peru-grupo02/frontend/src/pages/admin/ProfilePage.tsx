import React, { useState, FormEvent } from 'react';
import { User as UserIcon, Mail, Shield, Lock, Save, Loader2, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import { FormField, AlertBanner } from '../../components/auth/FormField';
import { Badge, Toast } from '../../components/admin/ui';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name ?? '', email: user?.email ?? '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ─── Actualizar perfil ─────────────────────────────────────────────────────
  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    if (!profileForm.full_name.trim() || profileForm.full_name.trim().length < 2) {
      setProfileError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setProfileLoading(true);
    try {
      await authApi.updateMe({ full_name: profileForm.full_name, email: profileForm.email });
      await refreshUser();
      setProfileMsg('Perfil actualizado correctamente.');
    } catch (e: unknown) {
      setProfileError(e instanceof Error ? e.message : 'Error al actualizar el perfil.');
    } finally { setProfileLoading(false); }
  };

  // ─── Cambiar contraseña ────────────────────────────────────────────────────
  const validatePw = (): boolean => {
    const errs: Record<string, string> = {};
    if (!pwForm.current_password) errs.current_password = 'Ingresa tu contraseña actual.';
    if (pwForm.new_password.length < 8) errs.new_password = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(pwForm.new_password)) errs.new_password = 'Incluye al menos una mayúscula.';
    else if (!/[0-9]/.test(pwForm.new_password)) errs.new_password = 'Incluye al menos un número.';
    if (pwForm.new_password !== pwForm.confirm_password) errs.confirm_password = 'Las contraseñas no coinciden.';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePwSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePw()) return;
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm);
      setToast({ message: 'Contraseña cambiada correctamente.', type: 'success' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : 'Error al cambiar la contraseña.', type: 'error' });
    } finally { setPwLoading(false); }
  };

  if (!user) return null;

  const primaryRole = user.roles[0];
  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    admin:       'bg-sky-500/15 text-sky-300 border-sky-500/30',
    supervisor:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
    user:        'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
        <p className="text-sm text-slate-400 mt-0.5">Administra tu información personal y contraseña</p>
      </div>

      {/* Avatar y resumen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white">{user.full_name}</h2>
          <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-0.5">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {user.roles.map(r => (
              <span key={r.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[r.name] ?? roleColors.user}`}>
                <Shield className="w-2.5 h-2.5" /> {r.display_name}
              </span>
            ))}
            <Badge variant={user.is_active ? 'success' : 'danger'}>
              {user.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
            {user.is_verified && <Badge variant="info">Verificado</Badge>}
          </div>
        </div>
      </div>

      {/* Formulario de perfil */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-sky-400" />
          Información personal
        </h3>
        <form onSubmit={handleProfileSave} className="space-y-4" noValidate>
          {profileMsg && <AlertBanner type="success" message={profileMsg} />}
          {profileError && <AlertBanner type="error" message={profileError} />}
          <FormField
            label="Nombre completo"
            type="text"
            icon={<UserIcon className="w-4 h-4" />}
            value={profileForm.full_name}
            onChange={(e) => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
          />
          <FormField
            label="Correo electrónico"
            type="email"
            icon={<Mail className="w-4 h-4" />}
            value={profileForm.email}
            onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))}
          />
          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Cambio de contraseña */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          Cambiar contraseña
        </h3>
        <form onSubmit={handlePwSave} className="space-y-4" noValidate>
          <FormField
            label="Contraseña actual"
            type="password"
            placeholder="••••••••"
            icon={<Key className="w-4 h-4" />}
            value={pwForm.current_password}
            onChange={(e) => setPwForm(f => ({ ...f, current_password: e.target.value }))}
            error={pwErrors.current_password}
            autoComplete="current-password"
          />
          <FormField
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={pwForm.new_password}
            onChange={(e) => setPwForm(f => ({ ...f, new_password: e.target.value }))}
            error={pwErrors.new_password}
            autoComplete="new-password"
          />
          <FormField
            label="Confirmar nueva contraseña"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={pwForm.confirm_password}
            onChange={(e) => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
            error={pwErrors.confirm_password}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Cambiar contraseña
          </button>
        </form>
      </div>

      {/* Permisos */}
      {user.permissions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            Mis permisos
          </h3>
          {user.permissions.includes('*') ? (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-purple-300">Acceso total — todos los permisos del sistema.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.permissions.map(p => (
                <span key={p} className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-400">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
