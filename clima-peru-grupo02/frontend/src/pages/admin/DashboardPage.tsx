import React, { useEffect, useState } from 'react';
import {
  Users, UserCheck, UserX, TrendingUp, Shield, Key,
  AlertTriangle, Activity, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AdminDashboard, ActivityItem } from '../../types/auth';
import { dashboardAdminApi } from '../../services/authApi';
import { StatCard, Spinner, Badge } from '../../components/admin/ui';

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#a855f7',
  admin:       '#38bdf8',
  supervisor:  '#f59e0b',
  user:        '#64748b',
};
const DEFAULT_COLOR = '#94a3b8';

const ACTION_LABELS: Record<string, string> = {
  login:                  'Inicio de sesión',
  login_failed:           'Login fallido',
  logout:                 'Cierre de sesión',
  user_registered:        'Registro de usuario',
  user_created:           'Usuario creado',
  user_updated:           'Usuario actualizado',
  user_deleted:           'Usuario eliminado',
  user_activated:         'Usuario activado',
  user_deactivated:       'Usuario desactivado',
  password_changed:       'Contraseña cambiada',
  password_reset_requested: 'Reset solicitado',
  role_created:           'Rol creado',
  role_updated:           'Rol actualizado',
  role_deleted:           'Rol eliminado',
  roles_assigned:         'Roles asignados',
  permissions_updated:    'Permisos actualizados',
};

function statusBadge(status: string) {
  if (status === 'success') return <Badge variant="success">Exitoso</Badge>;
  if (status === 'failure') return <Badge variant="danger">Fallido</Badge>;
  return <Badge variant="warning">Advertencia</Badge>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 shadow-xl">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name}>{p.name}: <span className="font-bold">{p.value}</span></div>
      ))}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await dashboardAdminApi.get());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar el dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );

  if (error) return (
    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
      {error}
    </div>
  );

  if (!data) return null;

  const pieData = data.users_by_role.filter(r => r.count > 0).map(r => ({
    name: r.display_name,
    value: r.count,
    fill: ROLE_COLORS[r.role_name] ?? DEFAULT_COLOR,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
          <p className="text-sm text-slate-400 mt-0.5">Resumen general del sistema</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de usuarios"
          value={data.total_users}
          icon={<Users className="w-5 h-5 text-sky-400" />}
          color="bg-sky-500/15"
          subtitle={`+${data.new_users_last_7_days} últimos 7 días`}
        />
        <StatCard
          title="Usuarios activos"
          value={data.active_users}
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
          color="bg-emerald-500/15"
          subtitle={`${data.verified_users} verificados`}
        />
        <StatCard
          title="Usuarios inactivos"
          value={data.inactive_users}
          icon={<UserX className="w-5 h-5 text-red-400" />}
          color="bg-red-500/15"
        />
        <StatCard
          title="Logins fallidos (24h)"
          value={data.failed_logins_last_24h}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          color="bg-amber-500/15"
          subtitle="Posibles ataques"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Roles del sistema"
          value={data.total_roles}
          icon={<Shield className="w-5 h-5 text-purple-400" />}
          color="bg-purple-500/15"
        />
        <StatCard
          title="Permisos definidos"
          value={data.total_permissions}
          icon={<Key className="w-5 h-5 text-indigo-400" />}
          color="bg-indigo-500/15"
        />
        <StatCard
          title="Registros de auditoría"
          value={data.total_audit_logs}
          icon={<Activity className="w-5 h-5 text-teal-400" />}
          color="bg-teal-500/15"
        />
        <StatCard
          title="Tasa de activación"
          value={data.total_users > 0 ? `${Math.round((data.active_users / data.total_users) * 100)}%` : '0%'}
          icon={<TrendingUp className="w-5 h-5 text-sky-400" />}
          color="bg-sky-500/15"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart — usuarios por rol */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Usuarios por Rol</h2>
          {data.users_by_role.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.users_by_role} barSize={28}>
                <XAxis dataKey="display_name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Usuarios" radius={[6, 6, 0, 0]}>
                  {data.users_by_role.map((entry) => (
                    <Cell key={entry.role_name} fill={ROLE_COLORS[entry.role_name] ?? DEFAULT_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — distribución */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Distribución de Roles</h2>
          {pieData.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  iconType="circle" iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Actividad Reciente</h2>
        {data.recent_activity.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin actividad registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Usuario', 'Acción', 'Categoría', 'Estado', 'Fecha'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.recent_activity.map((item: ActivityItem) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="text-slate-200 font-medium truncate max-w-[140px]">
                        {item.user_name ?? '—'}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[140px]">{item.user_email}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">
                      {ACTION_LABELS[item.action] ?? item.action}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="info">{item.category}</Badge>
                    </td>
                    <td className="py-3 pr-4">{statusBadge(item.status)}</td>
                    <td className="py-3 text-xs text-slate-400 whitespace-nowrap">{formatTime(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
