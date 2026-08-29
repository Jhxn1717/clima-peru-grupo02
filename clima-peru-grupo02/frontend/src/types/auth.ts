// ─── Permisos ─────────────────────────────────────────────────────────────────
export interface Permission {
  id: number;
  name: string;
  display_name: string;
  category: string;
  description?: string;
  created_at: string;
}

// ─── Roles ────────────────────────────────────────────────────────────────────
export interface RoleSimple {
  id: number;
  name: string;
  display_name: string;
  is_super_admin: boolean;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  is_super_admin: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at?: string;
  user_count?: number;
}

export interface RoleCreate {
  name: string;
  display_name: string;
  description?: string;
  permission_ids: number[];
}

export interface RoleUpdate {
  display_name?: string;
  description?: string;
  permission_ids?: number[];
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  last_login?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at?: string;
  roles: RoleSimple[];
  permissions: string[];
}

export interface UserSummary {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  roles: RoleSimple[];
}

export interface UserListResponse {
  items: UserSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserCreate {
  full_name: string;
  email: string;
  password: string;
  role_ids: number[];
  is_active: boolean;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  is_active?: boolean;
  role_ids?: number[];
  avatar_url?: string;
}

// ─── Auth requests / responses ────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

// ─── Auditoría ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  user_name?: string;
  action: string;
  category: string;
  target_type?: string;
  target_id?: string;
  target_display?: string;
  details?: string;
  status: 'success' | 'failure' | 'warning';
  ip_address?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export interface UsersByRoleItem {
  role_name: string;
  display_name: string;
  count: number;
}

export interface ActivityItem {
  id: number;
  user_name?: string;
  user_email?: string;
  action: string;
  category: string;
  status: string;
  created_at: string;
}

export interface AdminDashboard {
  total_users: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  new_users_last_7_days: number;
  users_by_role: UsersByRoleItem[];
  total_roles: number;
  total_permissions: number;
  recent_activity: ActivityItem[];
  total_audit_logs: number;
  failed_logins_last_24h: number;
}

// ─── Estado de auth ───────────────────────────────────────────────────────────
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  token: string | null;
}
