import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface DropboxPreferences {
  showFiles: boolean;
}

export interface DropboxStatus {
  connected: boolean;
  status: string;
  dropboxEmail: string | null;
  dropboxDisplayName: string | null;
  lastSyncedAt: string | null;
  preferences: DropboxPreferences;
}

export interface DropboxFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
  isFolder: boolean;
}

export const DEFAULT_DROPBOX_PREFERENCES: DropboxPreferences = {
  showFiles: true,
};

export const dropboxService = {
  getStatus: () => apiGet<DropboxStatus>('/integrations/dropbox/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/dropbox/auth-url'),

  disconnect: () => apiPost('/integrations/dropbox/disconnect'),

  getFiles: () =>
    apiGet<{ connected: boolean; files: DropboxFile[] }>(
      '/integrations/dropbox/files',
    ),

  updatePreferences: (preferences: DropboxPreferences) =>
    apiPatch<DropboxPreferences>(
      '/integrations/dropbox/preferences',
      preferences,
    ),
};
