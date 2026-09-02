import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  RefreshCw,
  UserRound,
  CheckCircle2,
  XCircle,
  Loader2,
  Crown,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  Building2,
  Pencil,
  Trash2,
  Save,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User, SYSTEM_SECTIONS, Role, UpdateProfileRequest } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';

interface AdminPanelProps {
  theme: 'dark' | 'light';
}

export const AdminPanel: React.FC<AdminPanelProps> = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const togglePermission = async (targetUser: User, sectionKey: string) => {
    if (targetUser.role === 'admin') return;
    const newValue = !(targetUser as any)[sectionKey];
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, [sectionKey]: newValue } : u)),
    );
    setSavingId(targetUser.id);
    setSavingField(sectionKey);
    setLastAction(null);
    try {
      const updated = await adminApi.updatePermissions(targetUser.id, {
        perm_dashboard: sectionKey === 'perm_dashboard' ? newValue : targetUser.perm_dashboard,
        perm_map: sectionKey === 'perm_map' ? newValue : targetUser.perm_map,
        perm_compare: sectionKey === 'perm_compare' ? newValue : targetUser.perm_compare,
        perm_analysis: sectionKey === 'perm_analysis' ? newValue : targetUser.perm_analysis,
        perm_alerts: sectionKey === 'perm_alerts' ? newValue : targetUser.perm_alerts,
        perm_rankings: sectionKey === 'perm_rankings' ? newValue : targetUser.perm_rankings,
        perm_csv: sectionKey === 'perm_csv' ? newValue : targetUser.perm_csv,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setLastAction(`Permisos actualizados para ${targetUser.full_name}`);
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, [sectionKey]: !newValue } : u)),
      );
      setError(err.message || 'Error al actualizar permisos');
    } finally {
      setSavingId(null);
      setSavingField(null);
    }
  };

  const changeRole = async (targetUser: User, newRole: Role) => {
    if (targetUser.role === newRole) return;
    setSavingId(targetUser.id);
    setSavingField('role');
    setLastAction(null);
    setError(null);
    try {
      const updated = await adminApi.updateRole(targetUser.id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u)),
      );
      setLastAction(`Rol de ${targetUser.full_name} cambiado a ${newRole === 'admin' ? 'Admin' : 'Usuario'}`);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar rol');
    } finally {
      setSavingId(null);
      setSavingField(null);
    }
  };

  const openEdit = (targetUser: User) => {
    setEditName(targetUser.full_name);
    setEditEmail(targetUser.email);
    setEditPassword('');
    setShowEditPassword(false);
    setEditingUser(targetUser);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setSavingId(editingUser.id);
    setSavingField('profile');
    setLastAction(null);
    try {
      const payload: UpdateProfileRequest = {
        full_name: editName,
        email: editEmail,
      };
      if (editPassword.trim().length > 0) {
        payload.password = editPassword;
      }
      const updated = await adminApi.updateProfile(editingUser.id, payload);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
      );
      setLastAction(
        editPassword
          ? `Perfil de ${updated.full_name} actualizado y contraseña restablecida.`
          : `Perfil de ${updated.full_name} actualizado.`,
      );
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setSavingId(null);
      setSavingField(null);
    }
  };

  const performDelete = async () => {
    if (!deletingUser) return;
    setError(null);
    setSavingId(deletingUser.id);
    setSavingField('delete');
    setLastAction(null);
    try {
      const res = await adminApi.deleteUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      if (expandedId === deletingUser.id) setExpandedId(null);
      setLastAction(res.message || `${deletingUser.full_name} fue eliminado.`);
      setDeletingUser(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el usuario');
      setDeletingUser(null);
    } finally {
      setSavingId(null);
      setSavingField(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name + ' ' + u.email).toLowerCase().includes(search.toLowerCase()),
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + stats */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-sky-500 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Panel de Administración
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Los cambios se guardan automáticamente al hacer clic
            </p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-center">
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400">{users.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Usuarios</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{adminCount}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Admins</div>
            </div>
          </div>
        </div>

        {lastAction && (
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{lastAction}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Users table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Usuarios registrados
            </h3>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full pl-9 pr-3 py-1.5 bg-white/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={loadUsers}
              title="Refrescar lista"
              className="p-2 rounded-xl bg-white/90 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {search ? `No se encontraron usuarios que coincidan con "${search}".` : 'No hay usuarios registrados.'}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isCurrent = currentUser?.id === u.id;
            const isSaving = savingId === u.id;
            const isAdminUser = u.role === 'admin';
            const isExpanded = expandedId === u.id;

            return (
              <div key={u.id} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
                {/* Fila compacta */}
                <div
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-100/60 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                >
                  {/* Expandir/colapsar */}
                  <button
                    className="text-slate-400 hover:text-sky-500 w-5 h-5 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : u.id);
                    }}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      isAdminUser
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                        : 'bg-gradient-to-tr from-sky-500 to-blue-600'
                    }`}
                  >
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Nombre + correo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {u.full_name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold shrink-0">
                          TÚ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{u.email}</span>
                      {!u.is_verified && (
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 shrink-0">
                          <XCircle className="w-3 h-3" /> sin verificar
                        </span>
                      )}
                      {isAdminUser && (
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 shrink-0 ml-1">
                          <Crown className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rol selector */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {(['user', 'admin'] as Role[]).map((r) => {
                      const active = u.role === r;
                      return (
                        <button
                          key={r}
                          disabled={isSaving || (isCurrent && r === 'user')}
                          onClick={() => changeRole(u, r)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            active
                              ? r === 'admin'
                                ? 'bg-amber-500 text-white'
                                : 'bg-sky-500 text-white'
                              : 'bg-white/90 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          } disabled:opacity-50`}
                        >
                          {isSaving && savingField === 'role' && active ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : r === 'admin' ? (
                            <Crown className="w-3 h-3" />
                          ) : (
                            <UserRound className="w-3 h-3" />
                          )}
                          {r === 'admin' ? 'Admin' : 'Usuario'}
                        </button>
                      );
                    })}

                    {/* Acciones: editar / eliminar */}
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => openEdit(u)}
                        disabled={isSaving}
                        title={isCurrent ? 'No puedes editar tu propio perfil desde aquí' : 'Editar usuario'}
                        className={`p-1.5 rounded-lg transition-colors ${isCurrent
                          ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          : 'text-sky-500 hover:bg-sky-500/10'}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(u)}
                        disabled={isSaving}
                        title={isCurrent ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                        className={`p-1.5 rounded-lg transition-colors ${isCurrent
                          ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          : 'text-red-500 hover:bg-red-500/10'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fila expandida: permisos */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
                    {isAdminUser ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        Los administradores tienen acceso total a todas las secciones.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mb-3">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Permisos por sección
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {SYSTEM_SECTIONS.map((section) => {
                            const value = u[section.key] as boolean;
                            const thisSaving = isSaving && savingField === section.key;
                            return (
                              <button
                                key={section.key}
                                onClick={() => togglePermission(u, section.key)}
                                disabled={isSaving}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all text-xs ${
                                  value
                                    ? 'bg-sky-500/10 border-sky-500/40 text-slate-800 dark:text-slate-200'
                                    : 'bg-slate-100/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-70'
                                } disabled:opacity-60`}
                              >
                                <span className="font-medium">{section.label}</span>
                                <span
                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                    value ? 'bg-sky-500' : 'bg-slate-400 dark:bg-slate-700'
                                  }`}
                                >
                                  {thisSaving ? (
                                    <Loader2 className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-white animate-spin" />
                                  ) : (
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        value ? 'translate-x-[18px]' : 'translate-x-0.5'
                                      }`}
                                    />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Editar usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Usuario</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ID #{editingUser.id} · {editingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre y apellidos"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                  Si cambias el correo, el usuario deberá volver a verificar su cuenta.
                </p>
              </div>

              {/* Cambiar contraseña */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Nueva contraseña <span className="font-normal">(opcional)</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    minLength={6}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar en blanco para no cambiar"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((s) => !s)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                    title={showEditPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Mínimo 6 caracteres. Déjalo vacío si no deseas restablecerla.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingId === editingUser.id}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingId === editingUser.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Usuario</h3>
              </div>
              <button onClick={() => setDeletingUser(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                ¿Seguro que quieres eliminar a{' '}
                <span className="font-bold text-slate-900 dark:text-white">{deletingUser.full_name}</span>{' '}
                (<span className="font-mono text-xs">{deletingUser.email}</span>)?
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Esta acción es permanente y no se puede deshacer.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={performDelete}
                  disabled={savingId === deletingUser.id}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingId === deletingUser.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
