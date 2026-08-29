import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Shield, Users, Key } from 'lucide-react';
import { Role, Permission, RoleCreate, RoleUpdate } from '../../types/auth';
import { rolesAdminApi, permissionsAdminApi } from '../../services/authApi';
import { Badge, Spinner, EmptyState, Modal, ConfirmDialog, Toast } from '../../components/admin/ui';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_ORDER = ['usuarios', 'reportes', 'sistema', 'general'];

function groupByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);
}

export const RolesPage: React.FC = () => {
  const { isSuperAdmin, hasPermission } = useAuth();
  const canManage = hasPermission('roles:manage') || isSuperAdmin();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  // Modales
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState<RoleCreate>({ name: '', display_name: '', description: '', permission_ids: [] });
  const [editForm, setEditForm] = useState<RoleUpdate>({});
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([rolesAdminApi.list(), permissionsAdminApi.list()]);
      setRoles(r);
      setAllPerms(p);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error cargando roles.', 'error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editRole) setEditForm({ display_name: editRole.display_name, description: editRole.description, permission_ids: editRole.permissions.map(p => p.id) });
  }, [editRole]);

  // ─── Crear ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!createForm.name.trim()) errs.name = 'El identificador es obligatorio.';
    else if (!/^[a-z_]+$/.test(createForm.name)) errs.name = 'Solo letras minúsculas y guiones bajos.';
    if (!createForm.display_name.trim()) errs.display_name = 'El nombre de visualización es obligatorio.';
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setActionLoading(true);
    try {
      await rolesAdminApi.create(createForm);
      showToast('Rol creado correctamente.');
      setShowCreate(false);
      setCreateForm({ name: '', display_name: '', description: '', permission_ids: [] });
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al crear rol.', 'error');
    } finally { setActionLoading(false); }
  };

  // ─── Editar ───────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editRole) return;
    setActionLoading(true);
    try {
      await rolesAdminApi.update(editRole.id, editForm);
      showToast('Rol actualizado correctamente.');
      setEditRole(null);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al actualizar rol.', 'error');
    } finally { setActionLoading(false); }
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteRole) return;
    setActionLoading(true);
    try {
      await rolesAdminApi.delete(deleteRole.id);
      showToast('Rol eliminado correctamente.');
      setDeleteRole(null);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al eliminar rol.', 'error');
    } finally { setActionLoading(false); }
  };

  const PermissionSelector = ({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) => {
    const grouped = groupByCategory(allPerms);
    const categories = CATEGORY_ORDER.filter(c => grouped[c]);
    return (
      <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
        {categories.map(cat => (
          <div key={cat}>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key className="w-3 h-3" />{cat}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {grouped[cat].map(perm => (
                <label key={perm.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(perm.id)}
                    onChange={(e) => onChange(e.target.checked ? [...selectedIds, perm.id] : selectedIds.filter(id => id !== perm.id))}
                    className="rounded accent-sky-500"
                  />
                  <div>
                    <div className="text-sm text-slate-200">{perm.display_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{perm.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Roles y Permisos</h1>
          <p className="text-sm text-slate-400 mt-0.5">{roles.length} roles · {allPerms.length} permisos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canManage && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Nuevo rol
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : roles.length === 0 ? (
        <EmptyState title="Sin roles" description="No hay roles configurados en el sistema." />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              {/* Header del rol */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role.is_super_admin ? 'bg-purple-500/20' : 'bg-sky-500/15'}`}>
                    <Shield className={`w-4.5 h-4.5 ${role.is_super_admin ? 'text-purple-400' : 'text-sky-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{role.display_name}</span>
                      {role.is_system && <Badge variant="neutral">Sistema</Badge>}
                      {role.is_super_admin && <Badge variant="purple">Super Admin</Badge>}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">{role.name}</div>
                  </div>
                </div>
                {canManage && !role.is_super_admin && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditRole(role)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {!role.is_system && (
                      <button onClick={() => setDeleteRole(role)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {role.description && (
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{role.description}</p>
              )}

              {/* Metadatos */}
              <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{role.user_count ?? 0} usuario(s)</span>
                <span className="flex items-center gap-1"><Key className="w-3 h-3" />{role.permissions.length} permiso(s)</span>
              </div>

              {/* Permisos del rol */}
              {role.is_super_admin ? (
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-300">Acceso total — todos los permisos del sistema.</p>
                </div>
              ) : role.permissions.length === 0 ? (
                <p className="text-xs text-slate-600 italic">Sin permisos asignados.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map(p => (
                    <span key={p.id} className="px-2 py-0.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-400">
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal — Crear rol */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Crear nuevo rol" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Identificador (slug) *</label>
            <input type="text" placeholder="ej: content_editor" value={createForm.name}
              onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') }))}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono" />
            {createErrors.name && <p className="text-xs text-red-400 mt-1">{createErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre de visualización *</label>
            <input type="text" placeholder="ej: Editor de Contenido" value={createForm.display_name}
              onChange={(e) => setCreateForm(f => ({ ...f, display_name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500" />
            {createErrors.display_name && <p className="text-xs text-red-400 mt-1">{createErrors.display_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción</label>
            <textarea placeholder="Descripción del rol..." value={createForm.description ?? ''}
              onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Permisos</label>
            <PermissionSelector selectedIds={createForm.permission_ids}
              onChange={(ids) => setCreateForm(f => ({ ...f, permission_ids: ids }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800 hover:bg-slate-700">Cancelar</button>
            <button onClick={handleCreate} disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 flex items-center gap-2">
              {actionLoading && <Spinner size="sm" />} Crear rol
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — Editar rol */}
      <Modal open={!!editRole} onClose={() => setEditRole(null)} title={`Editar rol: ${editRole?.display_name}`} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre de visualización</label>
            <input type="text" value={editForm.display_name ?? ''}
              onChange={(e) => setEditForm(f => ({ ...f, display_name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción</label>
            <textarea value={editForm.description ?? ''}
              onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Permisos</label>
            <PermissionSelector selectedIds={editForm.permission_ids ?? []}
              onChange={(ids) => setEditForm(f => ({ ...f, permission_ids: ids }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setEditRole(null)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800 hover:bg-slate-700">Cancelar</button>
            <button onClick={handleEdit} disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 flex items-center gap-2">
              {actionLoading && <Spinner size="sm" />} Guardar cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm — Eliminar */}
      <ConfirmDialog
        open={!!deleteRole} onClose={() => setDeleteRole(null)} onConfirm={handleDelete}
        title="Eliminar rol" danger isLoading={actionLoading}
        message={`¿Estás seguro de que deseas eliminar el rol "${deleteRole?.display_name}"? Los usuarios con este rol lo perderán.`}
        confirmLabel="Sí, eliminar"
      />
    </div>
  );
};
