import { apiGet } from '@/lib/api-client';
import type { DashboardIntegrationStatuses } from '@/lib/dashboard-widget-utils';
import { Integration } from '@/types/api.types';

export const integrationsService = {
  getAll: () => apiGet<Integration[]>('/integrations'),

  getDashboardStatus: () =>
    apiGet<DashboardIntegrationStatuses>('/integrations/dashboard-status'),
};
