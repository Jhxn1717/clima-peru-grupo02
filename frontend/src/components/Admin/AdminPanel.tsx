import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
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
  Sparkles,
  Lock,
  Database
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
  const verifiedCount = users.filter((u) => u.is_verified).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-6 h-6 text-sky-500" />
          </div>
          <Loader2 className="w-6 h-6 text-sky-400 animate-spin absolute -top-1 -right-1" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando Centro de Control & Seguridad...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header Banner with Stat Cards */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 relative overflow-hidden shadow-xl">
        {/* Glow lights in background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-sky-500 p-0.5 shadow-xl shadow-sky-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Panel de Control & Seguridad
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ACTIVO
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Gestión de usuarios, permisos por módulo y seguridad institucional
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</span>
                <Users className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</div>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">Registrados</div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admins</span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{adminCount}</div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Acceso Total</div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verificados</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{verifiedCount}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100% Seguros</div>
            </div>
          </div>
        </div>

        {lastAction && (
          <div className="mt-5 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{lastAction}</span>
          </div>
        )}
        {error && (
          <div className="mt-5 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}
      </div>

      {/* Users Management Section */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Directorio de Usuarios del Sistema
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {filteredUsers.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full pl-10 pr-3.5 py-2 bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={loadUsers}
              title="Refrescar lista"
              className="p-2 rounded-xl bg-white/90 hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {search ? `No se encontraron usuarios que coincidan con "${search}".` : 'No hay usuarios registrados.'}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isCurrent = currentUser?.id === u.id;
            const isSaving = savingId === u.id;
            const isAdminUser = u.role === 'admin';
            const isExpanded = expandedId === u.id;

            return (
              <div key={u.id} className="border-b border-slate-200/80 dark:border-slate-800/80 last:border-b-0">
                {/* User Row */}
                <div
                  className="flex items-center gap-3.5 px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                >
                  {/* Expand / Collapse Button */}
                  <button
                    className="text-slate-400 hover:text-sky-500 w-6 h-6 flex items-center justify-center shrink-0 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : u.id);
                    }}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-sky-500" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Avatar with Status */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md ${
                        isAdminUser
                          ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/20'
                          : 'bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 shadow-sky-500/20'
                      }`}
                    >
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    {/* Security Badge on Avatar */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Cuenta con verificación activa">
                      <ShieldCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  {/* Name + Security Badge + Email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {u.full_name}
                      </span>
                      
                      {/* Security verified symbol next to user name */}
                      <div
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold"
                        title="Verificación de Seguridad Activa"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Verificado</span>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-bold">
                          TÚ
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate font-mono">{u.email}</span>
                      {isAdminUser && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 ml-1.5">
                          <Crown className="w-3 h-3" /> Administrador
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Selector Controls */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {(['user', 'admin'] as Role[]).map((r) => {
                      const active = u.role === r;
                      return (
                        <button
                          key={r}
                          disabled={isSaving || (isCurrent && r === 'user')}
                          onClick={() => changeRole(u, r)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            active
                              ? r === 'admin'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                              : 'bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          } disabled:opacity-50`}
                        >
                          {isSaving && savingField === 'role' && active ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : r === 'admin' ? (
                            <Crown className="w-3.5 h-3.5" />
                          ) : (
                            <UserRound className="w-3.5 h-3.5" />
                          )}
                          {r === 'admin' ? 'Admin' : 'Usuario'}
                        </button>
                      );
                    })}

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => openEdit(u)}
                        disabled={isSaving}
                        title={isCurrent ? 'No puedes editar tu propio perfil desde aquí' : 'Editar usuario'}
                        className={`p-2 rounded-xl transition-colors ${
                          isCurrent
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-sky-500 hover:bg-sky-500/10 hover:text-sky-600'
                        }`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(u)}
                        disabled={isSaving}
                        title={isCurrent ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                        className={`p-2 rounded-xl transition-colors ${
                          isCurrent
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-red-500 hover:bg-red-500/10 hover:text-red-600'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Row: Section Permission Matrix */}
                {isExpanded && (
                  <div className="px-6 py-5 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
                    {isAdminUser ? (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Los administradores cuentan con privilegios totales de acceso a todos los módulos del sistema.</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-sky-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              Matriz de Permisos por Módulo
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">Haz clic para activar o desactivar</span>
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
                                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border transition-all text-xs ${
                                  value
                                    ? 'bg-sky-500/10 border-sky-500/40 text-slate-900 dark:text-white font-semibold shadow-sm'
                                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                                } disabled:opacity-50 hover:scale-[1.01]`}
                              >
                                <span>{section.label}</span>
                                <span
                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                    value ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                                  }`}
                                >
                                  {thisSaving ? (
                                    <Loader2 className="absolute left-1/2 -translate-x-1/2 w-3 h-3 text-white animate-spin" />
                                  ) : (
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Usuario</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    ID #{editingUser.id} · {editingUser.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre y apellidos"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Password Reset */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nueva contraseña <span className="font-normal lowercase text-[11px]">(opcional)</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    minLength={6}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar en blanco para conservar actual"
                    className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((s) => !s)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingId === editingUser.id}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
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

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm glass-panel rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-red-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Usuario</h3>
              </div>
              <button onClick={() => setDeletingUser(null)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                ¿Confirmas la eliminación permanente del usuario{' '}
                <span className="font-bold text-slate-900 dark:text-white">{deletingUser.full_name}</span>?
              </p>
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Esta acción revocará todos sus accesos inmediatamente.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={performDelete}
                  disabled={savingId === deletingUser.id}
                  className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
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
