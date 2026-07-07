import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface OutlookPreferences {
  showProfile: boolean;
  showInbox: boolean;
}

export interface OutlookStatus {
  connected: boolean;
  mockMode: boolean;
  status: string;
  outlookEmail: string | null;
  lastSyncedAt: string | null;
  preferences: OutlookPreferences;
}

export interface OutlookMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string | null;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
  webViewLink: string;
}

export interface OutlookMessagesResponse {
  connected: boolean;
  mockMode: boolean;
  outlookEmail?: string | null;
  messages: OutlookMessage[];
}

export interface OutlookProfile {
  email: string | null;
  displayName: string | null;
}

export interface OutlookProfileResponse {
  connected: boolean;
  mockMode: boolean;
  profile: OutlookProfile | null;
}

export const DEFAULT_OUTLOOK_PREFERENCES: OutlookPreferences = {
  showProfile: true,
  showInbox: true,
};

export const outlookService = {
  getStatus: () => apiGet<OutlookStatus>('/integrations/outlook/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/outlook/auth-url'),

  connectMock: () =>
    apiPost<{ connected: boolean; mockMode: boolean; outlookEmail: string }>(
      '/integrations/outlook/connect-mock',
    ),

  disconnect: () => apiPost('/integrations/outlook/disconnect'),

  getProfile: () =>
    apiGet<OutlookProfileResponse>('/integrations/outlook/profile'),

  getMessages: () =>
    apiGet<OutlookMessagesResponse>('/integrations/outlook/messages'),

  updatePreferences: (preferences: OutlookPreferences) =>
    apiPatch<OutlookPreferences>('/integrations/outlook/preferences', preferences),
};
