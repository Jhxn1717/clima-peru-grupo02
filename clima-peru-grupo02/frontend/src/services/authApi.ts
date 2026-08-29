import {
  TokenResponse, User, LoginRequest, RegisterRequest,
  ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
  MessageResponse, UserListResponse, UserCreate, UserUpdate,
  Role, RoleCreate, RoleUpdate, Permission,
  AuditLogListResponse, AdminDashboard,
} from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  return handleResponse<T>(res);
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<T>(res);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

export const authApi = {
  // Registro
  register(payload: RegisterRequest): Promise<TokenResponse> {
    return post<TokenResponse>('/auth/register', payload);
  },

  // Login
  login(payload: LoginRequest): Promise<TokenResponse> {
    return post<TokenResponse>('/auth/login', payload);
  },

  // Logout
  logout(): Promise<MessageResponse> {
    return post<MessageResponse>('/auth/logout');
  },

  // Perfil propio
  getMe(): Promise<User> {
    return get<User>('/auth/me');
  },

  updateMe(payload: UserUpdate): Promise<User> {
    return patch<User>('/auth/me', payload);
  },

  changePassword(payload: ChangePasswordRequest): Promise<MessageResponse> {
    return post<MessageResponse>('/auth/me/change-password', payload);
  },

  // Recuperación
  forgotPassword(payload: ForgotPasswordRequest): Promise<MessageResponse> {
    return post<MessageResponse>('/auth/forgot-password', payload);
  },

  resetPassword(payload: ResetPasswordRequest): Promise<MessageResponse> {
    return post<MessageResponse>('/auth/reset-password', payload);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — USUARIOS
// ═══════════════════════════════════════════════════════════════════════════════

export const usersAdminApi = {
  list(params: {
    page?: number;
    page_size?: number;
    search?: string;
    role_id?: number;
    is_active?: boolean;
  }): Promise<UserListResponse> {
    const q = new URLSearchParams();
    if (params.page)      q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    if (params.search)    q.set('search', params.search);
    if (params.role_id)   q.set('role_id', String(params.role_id));
    if (params.is_active !== undefined) q.set('is_active', String(params.is_active));
    return get<UserListResponse>(`/admin/users?${q.toString()}`);
  },

  getById(id: number): Promise<User> {
    return get<User>(`/admin/users/${id}`);
  },

  create(payload: UserCreate): Promise<User> {
    return post<User>('/admin/users', payload);
  },

  update(id: number, payload: UserUpdate): Promise<User> {
    return patch<User>(`/admin/users/${id}`, payload);
  },

  toggleStatus(id: number): Promise<MessageResponse> {
    return patch<MessageResponse>(`/admin/users/${id}/toggle-status`, {});
  },

  delete(id: number): Promise<MessageResponse> {
    return del<MessageResponse>(`/admin/users/${id}`);
  },

  assignRoles(userId: number, roleIds: number[]): Promise<User> {
    return post<User>(`/admin/users/${userId}/roles`, roleIds);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — ROLES
// ═══════════════════════════════════════════════════════════════════════════════

export const rolesAdminApi = {
  list(): Promise<Role[]> {
    return get<Role[]>('/admin/roles');
  },

  getById(id: number): Promise<Role> {
    return get<Role>(`/admin/roles/${id}`);
  },

  create(payload: RoleCreate): Promise<Role> {
    return post<Role>('/admin/roles', payload);
  },

  update(id: number, payload: RoleUpdate): Promise<Role> {
    return patch<Role>(`/admin/roles/${id}`, payload);
  },

  delete(id: number): Promise<MessageResponse> {
    return del<MessageResponse>(`/admin/roles/${id}`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — PERMISOS
// ═══════════════════════════════════════════════════════════════════════════════

export const permissionsAdminApi = {
  list(): Promise<Permission[]> {
    return get<Permission[]>('/admin/permissions');
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — AUDITORÍA
// ═══════════════════════════════════════════════════════════════════════════════

export const auditAdminApi = {
  list(params: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    status?: string;
    action?: string;
    user_id?: number;
  }): Promise<AuditLogListResponse> {
    const q = new URLSearchParams();
    if (params.page)     q.set('page', String(params.page));
    if (params.page_size)q.set('page_size', String(params.page_size));
    if (params.search)   q.set('search', params.search);
    if (params.category) q.set('category', params.category);
    if (params.status)   q.set('status', params.status);
    if (params.action)   q.set('action', params.action);
    if (params.user_id)  q.set('user_id', String(params.user_id));
    return get<AuditLogListResponse>(`/admin/audit?${q.toString()}`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export const dashboardAdminApi = {
  get(): Promise<AdminDashboard> {
    return get<AdminDashboard>('/admin/dashboard');
  },
};
