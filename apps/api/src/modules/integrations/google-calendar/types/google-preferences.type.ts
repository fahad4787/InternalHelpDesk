export interface GooglePreferences {
  showUpcomingMeet: boolean;
  showCalendarEmbed: boolean;
  showGoogleDrive: boolean;
  showGmail: boolean;
  showGoogleChat: boolean;
}

export const DEFAULT_GOOGLE_PREFERENCES: GooglePreferences = {
  showUpcomingMeet: true,
  showCalendarEmbed: true,
  showGoogleDrive: true,
  showGmail: true,
  showGoogleChat: true,
};

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
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
