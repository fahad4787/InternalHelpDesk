'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AUTH_CLEARED_EVENT, clearAuthToken, getAuthToken, setAuthToken } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { User } from '@/types/api.types';

const USER_KEY = 'helpdesk_user';
export { AUTH_CLEARED_EVENT };

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  const token = getAuthToken();
  const stored = localStorage.getItem(USER_KEY);
  if (!token || !stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    clearAuthToken();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    setAuthToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  useEffect(() => {
    const restore = async () => {
      const storedUser = readStoredUser();
      if (!storedUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Restore immediately so landing/login can honor the session without a flash.
      setUser(storedUser);

      try {
        const res = await authService.getProfile();
        if (res.data) {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
          setUser(res.data);
        }
      } catch {
        // 401 interceptor clears storage + emits AUTH_CLEARED_EVENT.
        // Other failures keep the optimistic local session.
      } finally {
        setIsLoading(false);
      }
    };

    void restore();

    const onCleared = () => setUser(null);
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, onCleared);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
