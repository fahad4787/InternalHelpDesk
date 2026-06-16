'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/api-client';
import { User } from '@/types/api.types';

const USER_KEY = 'helpdesk_user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const stored = localStorage.getItem(USER_KEY);
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        clearAuthToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    setAuthToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const isAuthenticated = !!user && !!getAuthToken();

  return { user, isLoading, isAuthenticated, login, logout };
}
