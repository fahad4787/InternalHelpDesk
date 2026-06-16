import { apiGet, apiPatch } from '@/lib/api-client';
import { Company } from '@/types/api.types';

export const companiesService = {
  getCompany: () => apiGet<Company & { _count?: Record<string, number> }>('/companies/me'),

  updateCompany: (data: Partial<Company>) => apiPatch<Company>('/companies/me', data),
};
