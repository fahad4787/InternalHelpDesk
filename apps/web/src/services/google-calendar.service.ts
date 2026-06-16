import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { CalendarEvent } from '@/types/api.types';

export interface GooglePreferences {
  showUpcomingMeet: boolean;
  showCalendarEmbed: boolean;
  showGoogleDrive: boolean;
  showGmail: boolean;
}

export interface GoogleCalendarStatus {
  connected: boolean;
  mockMode: boolean;
  status: string;
  googleEmail: string | null;
  lastSyncedAt: string | null;
  preferences: GooglePreferences;
}

export interface GoogleCalendarEventsResponse {
  connected: boolean;
  mockMode: boolean;
  googleEmail?: string | null;
  events: CalendarEvent[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
}

export interface GoogleDriveFilesResponse {
  connected: boolean;
  mockMode: boolean;
  googleEmail?: string | null;
  files: GoogleDriveFile[];
}

export interface GoogleGmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string | null;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
  webViewLink: string;
}

export interface GoogleGmailMessagesResponse {
  connected: boolean;
  mockMode: boolean;
  googleEmail?: string | null;
  messages: GoogleGmailMessage[];
}

export const DEFAULT_GOOGLE_PREFERENCES: GooglePreferences = {
  showUpcomingMeet: true,
  showCalendarEmbed: true,
  showGoogleDrive: true,
  showGmail: true,
};

export const googleCalendarService = {
  getStatus: () =>
    apiGet<GoogleCalendarStatus>('/integrations/google-calendar/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/google-calendar/auth-url'),

  connectMock: () =>
    apiPost<{ connected: boolean; mockMode: boolean; googleEmail: string }>(
      '/integrations/google-calendar/connect-mock',
    ),

  disconnect: () => apiPost('/integrations/google-calendar/disconnect'),

  getEvents: () =>
    apiGet<GoogleCalendarEventsResponse>('/integrations/google-calendar/events'),

  getDriveFiles: () =>
    apiGet<GoogleDriveFilesResponse>('/integrations/google-calendar/drive/files'),

  getGmailMessages: () =>
    apiGet<GoogleGmailMessagesResponse>(
      '/integrations/google-calendar/gmail/messages',
    ),

  updatePreferences: (preferences: GooglePreferences) =>
    apiPatch<GooglePreferences>(
      '/integrations/google-calendar/preferences',
      preferences,
    ),
};
