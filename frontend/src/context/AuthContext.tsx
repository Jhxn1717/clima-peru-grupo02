import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/auth';
import { authApi, authStorage } from '../services/authApi';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (section: string) => boolean;
  setSession: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = authStorage.getToken();
      const savedUser = authStorage.getUser();
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
        try {
          const fresh = await authApi.me(savedToken);
          setUser(fresh);
          authStorage.setUser(fresh);
        } catch {
          authStorage.clear();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const setSession = (newToken: string, newUser: User) => {
    authStorage.setToken(newToken);
    authStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updated: User) => {
    authStorage.setUser(updated);
    setUser(updated);
  };

  const logout = () => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  };

  const isAdmin = !!user && user.role === 'admin';

  const hasPermission = (section: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const key = `perm_${section}` as keyof User;
    return user[key] === true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAdmin,
        hasPermission,
        setSession,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
