import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface SharePointPreferences {
  showSites: boolean;
}

export interface SharePointStatus {
  connected: boolean;
  status: string;
  sharepointEmail: string | null;
  sharepointDisplayName: string | null;
  lastSyncedAt: string | null;
  preferences: SharePointPreferences;
}

export interface SharePointSite {
  id: string;
  name: string;
  webUrl: string | null;
  description: string | null;
}

export const DEFAULT_SHAREPOINT_PREFERENCES: SharePointPreferences = {
  showSites: true,
};

export const sharePointService = {
  getStatus: () => apiGet<SharePointStatus>('/integrations/sharepoint/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/sharepoint/auth-url'),

  disconnect: () => apiPost('/integrations/sharepoint/disconnect'),

  getSites: () =>
    apiGet<{ connected: boolean; sites: SharePointSite[] }>(
      '/integrations/sharepoint/sites',
    ),

  updatePreferences: (preferences: SharePointPreferences) =>
    apiPatch<SharePointPreferences>(
      '/integrations/sharepoint/preferences',
      preferences,
    ),
};
