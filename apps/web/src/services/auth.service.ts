import { apiGet, apiPost } from '@/lib/api-client';
import { AuthResponse, User } from '@/types/api.types';

export const authService = {
  login: (data: { email: string; password: string }) =>
    apiPost<AuthResponse>('/auth/login', data),

  register: (data: {
    companyName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    domain?: string;
  }) => apiPost<AuthResponse>('/auth/register', data),

  getProfile: () => apiGet<User>('/auth/me'),

  inviteUser: (data: { email: string; role?: string }) =>
    apiPost('/auth/invite', data),

  forgotPassword: (data: { email: string }) =>
    apiPost('/auth/forgot-password', data),
};
