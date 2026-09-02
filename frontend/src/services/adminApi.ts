import { User, UpdateRoleRequest, UpdatePermissionsRequest, UpdateProfileRequest } from '../types/auth';
import { authStorage } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders(): HeadersInit {
  const token = authStorage.getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Error del servidor (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    return handle<User[]>(res);
  },

  async updateRole(userId: number, role: UpdateRoleRequest): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(role),
    });
    return handle<User>(res);
  },

  async updatePermissions(userId: number, perms: UpdatePermissionsRequest): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/permissions`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(perms),
    });
    return handle<User>(res);
  },

  async updateProfile(userId: number, profile: UpdateProfileRequest): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/profile`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(profile),
    });
    return handle<User>(res);
  },

  async deleteUser(userId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handle<{ message: string }>(res);
  },
};
