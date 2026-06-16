import { apiGet, apiPatch } from '@/lib/api-client';
import { User } from '@/types/api.types';

export const usersService = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiGet<User[]>('/users', params),

  getById: (id: string) => apiGet<User>(`/users/${id}`),

  update: (id: string, data: Partial<User>) => apiPatch<User>(`/users/${id}`, data),
};
