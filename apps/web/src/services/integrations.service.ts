import { apiGet, apiPost } from '@/lib/api-client';
import type { DashboardIntegrationStatuses } from '@/lib/dashboard-widget-utils';
import { Integration } from '@/types/api.types';

export const integrationsService = {
  getAll: () => apiGet<Integration[]>('/integrations'),

  getDashboardStatus: () =>
    apiGet<DashboardIntegrationStatuses>('/integrations/dashboard-status'),

  connect: (provider: string, config?: Record<string, unknown>) =>
    apiPost(`/integrations/${provider}/connect`, config ?? {}),

  disconnect: (provider: string) => apiPost(`/integrations/${provider}/disconnect`),
};
