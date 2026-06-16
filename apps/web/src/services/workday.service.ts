import { apiGet, apiPost } from '@/lib/api-client';
import { Document } from '@/types/api.types';

export interface WorkdayStatus {
  connected: boolean;
  mockMode: boolean;
  status: string;
  tenantUrl: string | null;
  clientId: string | null;
  hasClientSecret: boolean;
  environment: string;
  lastTestedAt: string | null;
  lastSyncedAt: string | null;
  totalSyncedArticles: number;
}

export interface WorkdayConnectPayload {
  tenantUrl?: string;
  clientId?: string;
  clientSecret?: string;
  environment?: 'SANDBOX' | 'PRODUCTION';
}

export interface WorkdaySyncResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  status: string;
  syncLogId: string;
  mockMode: boolean;
}

export interface WorkdaySyncLog {
  id: string;
  integrationType: string;
  status: string;
  message: string | null;
  totalItems: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkdayResetResult {
  documentsRemoved: number;
  syncLogsRemoved: number;
}

export const workdayService = {
  getStatus: () => apiGet<WorkdayStatus>('/integrations/workday/status'),

  connect: (payload: WorkdayConnectPayload) =>
    apiPost('/integrations/workday/connect', payload),

  testConnection: (payload?: WorkdayConnectPayload) =>
    apiPost<{ success: boolean; mockMode: boolean }>(
      '/integrations/workday/test-connection',
      payload ?? {},
    ),

  sync: () => apiPost<WorkdaySyncResult>('/integrations/workday/sync'),

  reset: () => apiPost<WorkdayResetResult>('/integrations/workday/reset'),

  getSyncLogs: () => apiGet<WorkdaySyncLog[]>('/integrations/workday/sync-logs'),

  getArticles: (params?: { page?: number; limit?: number; search?: string }) =>
    apiGet<Document[]>('/integrations/workday/articles', params),
};
