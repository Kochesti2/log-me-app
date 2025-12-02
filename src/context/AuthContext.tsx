'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  login as apiLogin,
  LoginPayload,
  register as apiRegister,
  RegisterPayload,
} from '@/lib/api/auth';

interface AuthContextType {
  user: string | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load auth state from localStorage and set mounted in one effect
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsMounted(true);
  }, []);


  const login = async (payload: LoginPayload) => {
    try {
      const response = await apiLogin(payload);
      const { access_token } = response;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', payload.username);
      setToken(access_token);
      setUser(payload.username);
      // Use window.location.href instead of router.push to force full page reload
      // This ensures the AuthProvider remounts with the correct token from localStorage
      window.location.href = '/users';
    } catch (error) {
      throw error;
    }
  };


  const register = async (payload: RegisterPayload) => {
    try {
      const response = await apiRegister(payload);
      // Optionally auto-login or redirect to login
      router.push('/auth/login');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  };

  // Protect routes - only run after mounting
  useEffect(() => {
    if (!isMounted) return;

    const publicPaths = ['/auth/login', '/auth/register', '/logs'];
    if (
      !token &&
      !publicPaths.includes(pathname) &&
      typeof window !== 'undefined' &&
      localStorage.getItem('token') === null
    ) {
      // Check if we are already redirecting or on a public page to avoid loops
      // The check for localStorage is because state might not be hydrated yet
      // But for safety, let's rely on the API client interceptor for strict enforcement
      // and this for client-side navigation UX.
      router.push('/auth/login');
    }
  }, [token, pathname, router, isMounted]);

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
