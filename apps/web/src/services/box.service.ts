import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface BoxPreferences {
  showFiles: boolean;
}

export interface BoxStatus {
  connected: boolean;
  status: string;
  boxEmail: string | null;
  boxDisplayName: string | null;
  lastSyncedAt: string | null;
  preferences: BoxPreferences;
}

export interface BoxFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
  isFolder: boolean;
}

export const DEFAULT_BOX_PREFERENCES: BoxPreferences = {
  showFiles: true,
};

export const boxService = {
  getStatus: () => apiGet<BoxStatus>('/integrations/box/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/box/auth-url'),

  disconnect: () => apiPost('/integrations/box/disconnect'),

  getFiles: () =>
    apiGet<{ connected: boolean; files: BoxFile[] }>(
      '/integrations/box/files',
    ),

  updatePreferences: (preferences: BoxPreferences) =>
    apiPatch<BoxPreferences>('/integrations/box/preferences', preferences),
};
