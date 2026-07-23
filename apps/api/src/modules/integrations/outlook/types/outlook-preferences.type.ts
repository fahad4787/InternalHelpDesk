export interface OutlookPreferences {
  showCalendar: boolean;
  showInbox: boolean;
}

export const DEFAULT_OUTLOOK_PREFERENCES: OutlookPreferences = {
  showCalendar: true,
  showInbox: true,
};

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

export interface OutlookProfile {
  email: string | null;
  displayName: string | null;
}

export interface OutlookCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  location: string | null;
  htmlLink: string | null;
  meetLink: string | null;
  meetCode: string | null;
  allDay: boolean;
  organizerName: string | null;
  organizerEmail: string | null;
  attendeeCount: number;
}
