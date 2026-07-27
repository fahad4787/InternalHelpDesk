import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '@/config/app.config';
import { ApiResponse } from '@/types/api.types';

const TOKEN_KEY = 'helpdesk_token';
export const AUTH_CLEARED_EVENT = 'helpdesk:auth-cleared';

const PUBLIC_AUTH_PATHS = ['/', '/login', '/register', '/forgot-password'];

function isPublicAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)),
  );
}

export const apiClient = axios.create({
  baseURL: appConfig.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const requestUrl = error.config?.url ?? '';
      // Integration provider session failures must not wipe the HelpDesk login.
      const isIntegrationRequest = requestUrl.includes('/integrations/');
      if (!isIntegrationRequest) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('helpdesk_user');
        window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
        const { pathname } = window.location;
        // Stay on landing/auth pages; only leave protected screens for the landing page.
        if (!isPublicAuthPath(pathname) && !pathname.startsWith('/login')) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  },
);

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('helpdesk_user');
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ApiResponse<T>>(url, { params });
  return data;
}

export async function apiPost<T>(url: string, body?: unknown) {
  const { data } = await apiClient.post<ApiResponse<T>>(url, body);
  return data;
}

export async function apiPatch<T>(url: string, body?: unknown) {
  const { data } = await apiClient.patch<ApiResponse<T>>(url, body);
  return data;
}

export async function apiDelete<T>(url: string) {
  const { data } = await apiClient.delete<ApiResponse<T>>(url);
  return data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
