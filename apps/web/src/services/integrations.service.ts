import { apiGet, apiPost } from '@/lib/api-client';
import { Integration } from '@/types/api.types';

export const integrationsService = {
  getAll: () => apiGet<Integration[]>('/integrations'),

  connect: (provider: string, config?: Record<string, unknown>) =>
    apiPost(`/integrations/${provider}/connect`, config ?? {}),

  disconnect: (provider: string) => apiPost(`/integrations/${provider}/disconnect`),
};
