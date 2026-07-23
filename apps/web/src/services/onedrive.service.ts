import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface OneDrivePreferences {
  showFiles: boolean;
}

export interface OneDriveStatus {
  connected: boolean;
  status: string;
  onedriveEmail: string | null;
  onedriveDisplayName: string | null;
  lastSyncedAt: string | null;
  preferences: OneDrivePreferences;
}

export interface OneDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
  isFolder: boolean;
}

export const DEFAULT_ONEDRIVE_PREFERENCES: OneDrivePreferences = {
  showFiles: true,
};

export const oneDriveService = {
  getStatus: () => apiGet<OneDriveStatus>('/integrations/onedrive/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/onedrive/auth-url'),

  disconnect: () => apiPost('/integrations/onedrive/disconnect'),

  getFiles: () =>
    apiGet<{ connected: boolean; files: OneDriveFile[] }>(
      '/integrations/onedrive/files',
    ),

  updatePreferences: (preferences: OneDrivePreferences) =>
    apiPatch<OneDrivePreferences>(
      '/integrations/onedrive/preferences',
      preferences,
    ),
};
