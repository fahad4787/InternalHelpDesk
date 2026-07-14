import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { CalendarEvent } from '@/types/api.types';

export interface GooglePreferences {
  showUpcomingMeet: boolean;
  showCalendarEmbed: boolean;
  showGoogleDrive: boolean;
  showGmail: boolean;
  showGoogleChat: boolean;
}

export interface GoogleCalendarStatus {
  connected: boolean;
  status: string;
  googleEmail: string | null;
  lastSyncedAt: string | null;
  preferences: GooglePreferences;
  needsReconnect?: boolean;
}

export interface GoogleCalendarEventsResponse {
  connected: boolean;
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
  googleEmail?: string | null;
  messages: GoogleGmailMessage[];
}

export interface GoogleChatSpace {
  id: string;
  name: string;
  memberCount: number;
  isPrivate: boolean;
  kind: 'space' | 'dm' | 'group_dm';
}

export interface GoogleChatMessage {
  id: string;
  text: string;
  userId: string | null;
  userName: string | null;
  timestamp: string;
}

export const DEFAULT_GOOGLE_PREFERENCES: GooglePreferences = {
  showUpcomingMeet: true,
  showCalendarEmbed: true,
  showGoogleDrive: true,
  showGmail: true,
  showGoogleChat: true,
};

export const googleCalendarService = {
  getStatus: () =>
    apiGet<GoogleCalendarStatus>('/integrations/google-calendar/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/google-calendar/auth-url'),

  disconnect: () => apiPost('/integrations/google-calendar/disconnect'),

  getEvents: () =>
    apiGet<GoogleCalendarEventsResponse>('/integrations/google-calendar/events'),

  getDriveFiles: () =>
    apiGet<GoogleDriveFilesResponse>('/integrations/google-calendar/drive/files'),

  getGmailMessages: () =>
    apiGet<GoogleGmailMessagesResponse>(
      '/integrations/google-calendar/gmail/messages',
    ),

  getChatSpaces: () =>
    apiGet<{
      connected: boolean;
      spaces: GoogleChatSpace[];
    }>('/integrations/google-calendar/chat/spaces'),

  getChatMessages: (spaceId: string) =>
    apiGet<{
      connected: boolean;
      spaceId: string;
      messages: GoogleChatMessage[];
    }>(
      `/integrations/google-calendar/chat/spaces/${encodeURIComponent(spaceId)}/messages`,
    ),

  sendChatMessage: (spaceId: string, text: string) =>
    apiPost<{
      spaceId: string;
      message: GoogleChatMessage;
    }>(
      `/integrations/google-calendar/chat/spaces/${encodeURIComponent(spaceId)}/messages`,
      { text },
    ),

  updatePreferences: (preferences: GooglePreferences) =>
    apiPatch<GooglePreferences>(
      '/integrations/google-calendar/preferences',
      preferences,
    ),

  createMeet: (data: {
    title: string;
    startAt: string;
    durationMinutes: number;
    description?: string;
    timeZone?: string;
    attendeeEmails?: string[];
  }) => apiPost<CalendarEvent>('/integrations/google-calendar/events/meet', data),
};
