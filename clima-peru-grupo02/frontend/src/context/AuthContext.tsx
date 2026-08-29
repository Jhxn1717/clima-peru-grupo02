import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from 'react';
import { User, AuthStatus, TokenResponse } from '../types/auth';
import { authApi } from '../services/authApi';

// ─── Tipos del contexto ───────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  token: string | null;
  // Acciones
  loginWithToken: (tokenResponse: TokenResponse) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  // Helpers de permisos
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const initializingRef = useRef(false);

  // Carga inicial: leer token del localStorage y verificar sesión
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setStatus('unauthenticated');
      return;
    }

    setToken(savedToken);
    authApi.getMe()
      .then((userData) => {
        setUser(userData);
        setStatus('authenticated');
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setStatus('unauthenticated');
      });
  }, []);

  // Guarda el token y carga el usuario
  const loginWithToken = useCallback(async (tokenResponse: TokenResponse) => {
    localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
    setToken(tokenResponse.access_token);
    const userData = await authApi.getMe();
    setUser(userData);
    setStatus('authenticated');
  }, []);

  // Cierra sesión
  const logout = useCallback(() => {
    // Intentar registrar el logout en el backend (best-effort)
    authApi.logout().catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Recarga datos del usuario autenticado
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      logout();
    }
  }, [logout]);

  // ─── Helpers de permisos ─────────────────────────────────────────────────

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;  // super admin wildcard
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((...permissions: string[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  const isSuperAdmin = useCallback((): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.is_super_admin);
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.name === 'admin' || r.is_super_admin);
  }, [user]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.name === roleName);
  }, [user]);

  const value: AuthContextValue = {
    user, status, token,
    loginWithToken, logout, refreshUser,
    hasPermission, hasAnyPermission,
    isSuperAdmin, isAdmin, hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
