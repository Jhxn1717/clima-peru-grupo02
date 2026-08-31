import {
  User,
  RegisterRequest,
  VerifyRequest,
  LoginRequest,
  TokenResponse,
} from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'meteoperu_token';
const USER_KEY = 'meteoperu_user';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.detail || `Error del servidor (${res.status})`;
  } catch {
    return `Error del servidor (${res.status})`;
  }
}

export const authApi = {
  async register(payload: RegisterRequest): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async verify(payload: VerifyRequest): Promise<TokenResponse> {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async resendCode(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async login(payload: LoginRequest): Promise<TokenResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async me(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },
};
