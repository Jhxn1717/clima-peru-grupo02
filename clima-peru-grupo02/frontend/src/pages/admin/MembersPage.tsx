import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, RefreshCw, UserCheck, UserX, Trash2,
  Edit3, Filter, ChevronDown,
} from 'lucide-react';
import { UserSummary, Role, UserCreate, UserUpdate } from '../../types/auth';
import { usersAdminApi, rolesAdminApi } from '../../services/authApi';
import {
  Badge, Spinner, EmptyState, Modal, ConfirmDialog,
  Pagination, Toast,
} from '../../components/admin/ui';
import { useAuth } from '../../context/AuthContext';
import { FormField } from '../../components/auth/FormField';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const AVATAR_COLORS = ['from-sky-500 to-blue-600','from-purple-500 to-indigo-600','from-emerald-500 to-teal-600','from-rose-500 to-red-600','from-amber-500 to-orange-600'];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

export const MembersPage: React.FC = () => {
  const { hasPermission, isSuperAdmin } = useAuth();
  const canCreate = hasPermission('users:create') || isSuperAdmin();
  const canEdit   = hasPermission('users:edit')   || isSuperAdmin();
  const canDelete = hasPermission('users:delete') || isSuperAdmin();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles]   = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]   = useState(1);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterRole, setFilterRole]     = useState<number | undefined>();
  const [filterActive, setFilterActive] = useState<boolean | undefined>();

  // Modales
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser]     = useState<UserSummary | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserSummary | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAdminApi.list({ page, page_size: 15, search: search || undefined, role_id: filterRole, is_active: filterActive });
      setUsers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error cargando usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, filterActive]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { rolesAdminApi.list().then(setRoles).catch(() => {}); }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterRole, filterActive]);

  // ─── Crear usuario ────────────────────────────────────────────────────────
  const [createForm, setCreateForm] = useState<UserCreate>({ full_name: '', email: '', password: '', role_ids: [], is_active: true });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!createForm.full_name.trim()) errs.full_name = 'El nombre es obligatorio.';
    if (!createForm.email.trim() || !/\S+@\S+\.\S+/.test(createForm.email)) errs.email = 'Correo inválido.';
    if (createForm.password.length < 8) errs.password = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(createForm.password)) errs.password = 'Incluye una mayúscula.';
    else if (!/[0-9]/.test(createForm.password)) errs.password = 'Incluye un número.';
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setActionLoading(true);
    try {
      await usersAdminApi.create(createForm);
      showToast('Usuario creado correctamente.');
      setShowCreate(false);
      setCreateForm({ full_name: '', email: '', password: '', role_ids: [], is_active: true });
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al crear usuario.', 'error');
    } finally { setActionLoading(false); }
  };

  // ─── Editar usuario ───────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState<UserUpdate>({});

  useEffect(() => {
    if (editUser) setEditForm({ full_name: editUser.full_name, email: editUser.email, is_active: editUser.is_active, role_ids: editUser.roles.map(r => r.id) });
  }, [editUser]);

  const handleEdit = async () => {
    if (!editUser) return;
    setActionLoading(true);
    try {
      await usersAdminApi.update(editUser.id, editForm);
      showToast('Usuario actualizado correctamente.');
      setEditUser(null);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al actualizar.', 'error');
    } finally { setActionLoading(false); }
  };

  // ─── Toggle estado ────────────────────────────────────────────────────────
  const handleToggleStatus = async (user: UserSummary) => {
    try {
      await usersAdminApi.toggleStatus(user.id);
      showToast(`Usuario ${user.is_active ? 'desactivado' : 'activado'}.`);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al cambiar estado.', 'error');
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteUser) return;
    setActionLoading(true);
    try {
      await usersAdminApi.delete(deleteUser.id);
      showToast('Usuario eliminado correctamente.');
      setDeleteUser(null);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al eliminar.', 'error');
    } finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Miembros</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} usuario(s) registrado(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={filterRole ?? ''}
            onChange={(e) => setFilterRole(e.target.value ? Number(e.target.value) : undefined)}
            className="pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
          >
            <option value="">Todos los roles</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterActive === undefined ? '' : String(filterActive)}
            onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState title="Sin resultados" description="No se encontraron usuarios con los filtros aplicados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Usuario', 'Correo', 'Roles', 'Estado', 'Último acceso', 'Registro', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor(user.id)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                          {getInitials(user.full_name)}
                        </div>
                        <span className="font-medium text-slate-200 whitespace-nowrap">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0
                          ? <span className="text-slate-500 text-xs">Sin rol</span>
                          : user.roles.map(r => (
                            <Badge key={r.id} variant={r.is_super_admin ? 'purple' : 'info'}>
                              {r.display_name}
                            </Badge>
                          ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{formatDate(user.last_login)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setEditUser(user)}
                              title="Editar"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              title={user.is_active ? 'Desactivar' : 'Activar'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            >
                              {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteUser(user)}
                            title="Eliminar"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && users.length > 0 && (
          <div className="px-5 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={15} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal — Crear usuario */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo usuario" maxWidth="max-w-md">
        <div className="space-y-4">
          <FormField label="Nombre completo" type="text" placeholder="Juan Pérez" value={createForm.full_name}
            onChange={(e) => setCreateForm(f => ({ ...f, full_name: e.target.value }))} error={createErrors.full_name} />
          <FormField label="Correo electrónico" type="email" placeholder="juan@correo.com" value={createForm.email}
            onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} error={createErrors.email} />
          <FormField label="Contraseña" type="password" placeholder="••••••••" value={createForm.password}
            onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} error={createErrors.password} />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(role => (
                <label key={role.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors">
                  <input type="checkbox" checked={createForm.role_ids.includes(role.id)}
                    onChange={(e) => setCreateForm(f => ({ ...f, role_ids: e.target.checked ? [...f.role_ids, role.id] : f.role_ids.filter(id => id !== role.id) }))}
                    className="rounded" />
                  <span className="text-xs text-slate-300">{role.display_name}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={createForm.is_active}
              onChange={(e) => setCreateForm(f => ({ ...f, is_active: e.target.checked }))}
              className="rounded" />
            <span className="text-sm text-slate-300">Cuenta activa</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800 hover:bg-slate-700">Cancelar</button>
            <button onClick={handleCreate} disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 flex items-center gap-2">
              {actionLoading && <Spinner size="sm" />} Crear usuario
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — Editar usuario */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar usuario" maxWidth="max-w-md">
        <div className="space-y-4">
          <FormField label="Nombre completo" type="text" value={editForm.full_name ?? ''}
            onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
          <FormField label="Correo electrónico" type="email" value={editForm.email ?? ''}
            onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(role => (
                <label key={role.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 cursor-pointer hover:bg-slate-700">
                  <input type="checkbox" checked={(editForm.role_ids ?? []).includes(role.id)}
                    onChange={(e) => setEditForm(f => ({ ...f, role_ids: e.target.checked ? [...(f.role_ids ?? []), role.id] : (f.role_ids ?? []).filter(id => id !== role.id) }))}
                    className="rounded" />
                  <span className="text-xs text-slate-300">{role.display_name}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editForm.is_active ?? true}
              onChange={(e) => setEditForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
            <span className="text-sm text-slate-300">Cuenta activa</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setEditUser(null)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800 hover:bg-slate-700">Cancelar</button>
            <button onClick={handleEdit} disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 flex items-center gap-2">
              {actionLoading && <Spinner size="sm" />} Guardar cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm — Eliminar */}
      <ConfirmDialog
        open={!!deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDelete}
        title="Eliminar usuario" danger isLoading={actionLoading}
        message={`¿Estás seguro de que deseas eliminar a "${deleteUser?.full_name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
      />
    </div>
  );
};
