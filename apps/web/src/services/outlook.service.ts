import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { CalendarEvent } from '@/types/api.types';

export interface OutlookPreferences {
  showCalendar: boolean;
  showInbox: boolean;
}

export interface OutlookStatus {
  connected: boolean;
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
  outlookEmail?: string | null;
  messages: OutlookMessage[];
}

export interface OutlookEventsResponse {
  connected: boolean;
  outlookEmail?: string | null;
  events: CalendarEvent[];
}

export interface OutlookProfile {
  email: string | null;
  displayName: string | null;
}

export interface OutlookProfileResponse {
  connected: boolean;
  profile: OutlookProfile | null;
}

export const DEFAULT_OUTLOOK_PREFERENCES: OutlookPreferences = {
  showCalendar: true,
  showInbox: true,
};

export const outlookService = {
  getStatus: () => apiGet<OutlookStatus>('/integrations/outlook/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/outlook/auth-url'),

  disconnect: () => apiPost('/integrations/outlook/disconnect'),

  getProfile: () =>
    apiGet<OutlookProfileResponse>('/integrations/outlook/profile'),

  getMessages: () =>
    apiGet<OutlookMessagesResponse>('/integrations/outlook/messages'),

  getEvents: (range?: { start: string; end: string }) =>
    apiGet<OutlookEventsResponse>('/integrations/outlook/events', range),

  updatePreferences: (preferences: OutlookPreferences) =>
    apiPatch<OutlookPreferences>('/integrations/outlook/preferences', preferences),
};
