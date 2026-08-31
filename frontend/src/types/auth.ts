export type Role = 'admin' | 'user';

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_verified: boolean;
  role: Role;
  perm_dashboard: boolean;
  perm_map: boolean;
  perm_compare: boolean;
  perm_analysis: boolean;
  perm_alerts: boolean;
  perm_rankings: boolean;
  perm_csv: boolean;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateRoleRequest {
  role: Role;
}

export interface UpdatePermissionsRequest {
  perm_dashboard: boolean;
  perm_map: boolean;
  perm_compare: boolean;
  perm_analysis: boolean;
  perm_alerts: boolean;
  perm_rankings: boolean;
  perm_csv: boolean;
  role?: Role;
}

export interface UpdateProfileRequest {
  full_name: string;
  email: string;
  password?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Secciones del sistema (para controlar permisos en el panel admin)
export const SYSTEM_SECTIONS: { key: keyof Pick<User, 'perm_dashboard' | 'perm_map' | 'perm_compare' | 'perm_analysis' | 'perm_alerts' | 'perm_rankings' | 'perm_csv'>; label: string; tab: string }[] = [
  { key: 'perm_dashboard', label: 'Dashboard', tab: 'dashboard' },
  { key: 'perm_map', label: 'Mapa', tab: 'map' },
  { key: 'perm_compare', label: 'Comparador', tab: 'compare' },
  { key: 'perm_analysis', label: 'Análisis Histórico', tab: 'analysis' },
  { key: 'perm_alerts', label: 'Alertas', tab: 'alerts' },
  { key: 'perm_rankings', label: 'Rankings', tab: 'rankings' },
  { key: 'perm_csv', label: 'Cargar CSV', tab: 'csv' },
];
