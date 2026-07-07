export interface OutlookPreferences {
  showProfile: boolean;
  showInbox: boolean;
}

export const DEFAULT_OUTLOOK_PREFERENCES: OutlookPreferences = {
  showProfile: true,
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
