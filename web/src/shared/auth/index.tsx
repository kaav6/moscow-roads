import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserDto, LoginResponse } from '../types';
import { DEMO_MODE, demo } from '../demo';
import { http } from '@/shared/api/http';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: Status;
  user: UserDto | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'tp_at';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<UserDto | null>(null);
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'unauthenticated');

  useEffect(() => {
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    if (DEMO_MODE) {
      setUser(demo.me().user);
      setStatus('authenticated');
      return;
    }
    let cancelled = false;
    http
      .get('api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .json<{ user: UserDto }>()
      .then(res => {
        if (cancelled) return;
        setUser(res.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = DEMO_MODE
      ? demo.login()
      : await http.post('api/v1/auth/login', { json: { email, password } }).json<LoginResponse>();
    localStorage.setItem(STORAGE_KEY, res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, login, logout }),
    [status, user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
