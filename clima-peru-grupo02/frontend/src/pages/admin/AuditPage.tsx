import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, RefreshCw, ChevronDown, Info } from 'lucide-react';
import { AuditLog } from '../../types/auth';
import { auditAdminApi } from '../../services/authApi';
import { Badge, Spinner, EmptyState, Pagination, Toast, Modal } from '../../components/admin/ui';

const ACTION_LABELS: Record<string, string> = {
  login:                    'Inicio de sesión',
  login_failed:             'Login fallido',
  logout:                   'Cierre de sesión',
  user_registered:          'Registro',
  user_created:             'Usuario creado',
  user_updated:             'Usuario editado',
  user_deleted:             'Usuario eliminado',
  user_activated:           'Usuario activado',
  user_deactivated:         'Usuario desactivado',
  password_changed:         'Contraseña cambiada',
  password_reset_requested: 'Reset solicitado',
  role_created:             'Rol creado',
  role_updated:             'Rol editado',
  role_deleted:             'Rol eliminado',
  roles_assigned:           'Roles asignados',
  permissions_updated:      'Permisos actualizados',
};

const CATEGORIES = ['', 'auth', 'users', 'roles', 'permissions', 'general'];
const STATUSES = ['', 'success', 'failure', 'warning'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function statusBadge(status: string) {
  const map: Record<string, 'success' | 'danger' | 'warning'> = {
    success: 'success', failure: 'danger', warning: 'warning',
  };
  const labels: Record<string, string> = {
    success: 'Exitoso', failure: 'Fallido', warning: 'Advertencia',
  };
  return <Badge variant={map[status] ?? 'neutral'}>{labels[status] ?? status}</Badge>;
}

function categoryBadge(cat: string) {
  const map: Record<string, 'info' | 'purple' | 'warning' | 'neutral'> = {
    auth: 'info', users: 'warning', roles: 'purple', permissions: 'neutral', general: 'neutral',
  };
  return <Badge variant={map[cat] ?? 'neutral'}>{cat}</Badge>;
}

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditAdminApi.list({
        page, page_size: 20,
        search: search || undefined,
        category: filterCategory || undefined,
        status: filterStatus || undefined,
      });
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : 'Error cargando auditoría.', type: 'error' });
    } finally { setLoading(false); }
  }, [page, search, filterCategory, filterStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filterCategory, filterStatus]);

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Auditoría</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} evento(s) registrado(s)</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Buscar por usuario, acción..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer">
            {CATEGORIES.map(c => <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Todas las categorías'}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer">
            {STATUSES.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Todos los estados'}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : logs.length === 0 ? (
          <EmptyState title="Sin registros" description="No se encontraron eventos con los filtros aplicados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Usuario', 'Acción', 'Categoría', 'Recurso', 'Estado', 'IP', 'Fecha', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-slate-200 font-medium truncate max-w-[130px]">{log.user_name ?? '—'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[130px]">{log.user_email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="px-5 py-3.5">{categoryBadge(log.category)}</td>
                    <td className="px-5 py-3.5">
                      {log.target_display ? (
                        <div>
                          <div className="text-xs text-slate-400">{log.target_type}</div>
                          <div className="text-xs text-slate-300 font-mono truncate max-w-[120px]">{log.target_display}</div>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5">{statusBadge(log.status)}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{log.ip_address ?? '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-5 py-3.5">
                      {log.details && (
                        <button onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-slate-800 transition-colors">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <div className="px-5 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={20} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal — Detalles del log */}
      <Modal open={!!selectedLog} onClose={() => setSelectedLog(null)} title="Detalles del evento" maxWidth="max-w-lg">
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Acción:</span><div className="text-slate-200 font-medium">{ACTION_LABELS[selectedLog.action] ?? selectedLog.action}</div></div>
              <div><span className="text-slate-500">Categoría:</span><div className="mt-1">{categoryBadge(selectedLog.category)}</div></div>
              <div><span className="text-slate-500">Estado:</span><div className="mt-1">{statusBadge(selectedLog.status)}</div></div>
              <div><span className="text-slate-500">IP:</span><div className="text-slate-200 font-mono">{selectedLog.ip_address ?? '—'}</div></div>
              <div className="col-span-2"><span className="text-slate-500">Fecha:</span><div className="text-slate-200">{formatDate(selectedLog.created_at)}</div></div>
              {selectedLog.target_display && (
                <div className="col-span-2"><span className="text-slate-500">Recurso afectado:</span>
                  <div className="text-slate-200">{selectedLog.target_type}: {selectedLog.target_display}</div></div>
              )}
            </div>
            {selectedLog.details && (
              <div>
                <div className="text-slate-500 mb-2">Detalles adicionales:</div>
                <pre className="bg-slate-800 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {(() => { try { return JSON.stringify(JSON.parse(selectedLog.details!), null, 2); } catch { return selectedLog.details; } })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
