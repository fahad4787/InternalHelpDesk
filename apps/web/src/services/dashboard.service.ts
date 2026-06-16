import { apiGet } from '@/lib/api-client';
import { DashboardStats } from '@/types/api.types';

export const dashboardService = {
  getStats: () => apiGet<DashboardStats>('/dashboard/stats'),
};
