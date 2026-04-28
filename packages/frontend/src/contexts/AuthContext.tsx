import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  nome: string;
  email: string;
  plano: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { nome?: string; email?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('faro_user');
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('faro_token')
  );

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('faro_token', data.token);
    localStorage.setItem('faro_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (nome: string, email: string, password: string) => {
      await api.post('/auth/register', { nome, email, password });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('faro_token');
    localStorage.removeItem('faro_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (data: { nome?: string; email?: string; password?: string }) => {
      const updated = await api.put<User>('/auth/profile', data);
      localStorage.setItem('faro_user', JSON.stringify(updated));
      setUser(updated);
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
