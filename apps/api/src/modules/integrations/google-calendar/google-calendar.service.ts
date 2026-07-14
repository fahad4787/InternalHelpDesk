import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationProvider, IntegrationStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/types/api-response.type';
import { decrypt, encrypt } from '../../../common/utils/encryption.util';
import { successResponse } from '../../../common/utils/api-response.util';
import { UpdateGooglePreferencesDto } from './dto/update-google-preferences.dto';
import { CreateMeetDto } from './dto/create-meet.dto';
import {
  DEFAULT_GOOGLE_PREFERENCES,
  GoogleDriveFile,
  GoogleGmailMessage,
  GooglePreferences,
} from './types/google-preferences.type';
import {
  GoogleChatMessage,
  GoogleChatSpace,
} from './types/google-chat.type';
import { createOAuthState, verifyOAuthState } from './utils/oauth-state.util';
import { resolveOAuthRedirectUri } from '../utils/resolve-oauth-redirect-uri.util';
import { extractMeetLink, extractMeetCode, isLikelyGoogleMeetEvent } from './utils/meet-link.util';

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
].join(' ');

const CALENDAR_WRITE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
];

const CHAT_REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
];

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_CALENDAR_LIST_URL =
  'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const GOOGLE_DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_CHAT_API_URL = 'https://chat.googleapis.com/v1';

export interface CalendarEvent {
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
  recurringEventId?: string | null;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleCalendarEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string; label?: string }>;
    conferenceSolution?: { key?: { type?: string }; name?: string };
    createRequest?: { conferenceSolutionKey?: { type?: string } };
  };
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  organizer?: { email?: string; displayName?: string };
  attendees?: Array<{ email?: string; displayName?: string }>;
  status?: string;
  recurringEventId?: string;
}

interface GoogleEventsResponse {
  items?: GoogleCalendarEventItem[];
  nextPageToken?: string;
}

@Injectable()
export class GoogleCalendarService {
  private encryptionKey: string;
  private jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'dev-encryption-key-change-in-production',
    );
    this.jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'dev-secret',
    );
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    const connected = connection?.status === IntegrationStatus.CONNECTED;
    let needsReconnect = false;

    if (connected && connection?.encryptedAccessToken) {
      try {
        const accessToken = await this.getValidAccessToken(connection);
        const hasCalendarWrite =
          await this.tokenHasCalendarWriteScope(accessToken);
        const hasChatScopes = await this.tokenHasChatScopes(accessToken);
        needsReconnect = !hasCalendarWrite || !hasChatScopes;
      } catch {
        needsReconnect = true;
      }
    }

    return successResponse({
      connected,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      googleEmail: connection?.googleEmail ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
      needsReconnect,
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateGooglePreferencesDto,
  ) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Google account is not connected');
    }

    const preferences: GooglePreferences = {
      showUpcomingMeet: dto.showUpcomingMeet,
      showCalendarEmbed: dto.showCalendarEmbed,
      showGoogleDrive: dto.showGoogleDrive,
      showGmail: dto.showGmail,
      showGoogleChat: dto.showGoogleChat,
    };

    await this.prisma.googleCalendarConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  async getDriveFiles(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        files: [] as GoogleDriveFile[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const files = await this.fetchDriveFiles(accessToken, limit);

    return successResponse({
      connected: true,
      googleEmail: connection.googleEmail,
      files,
    });
  }

  private resolvePreferences(value: unknown): GooglePreferences {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_GOOGLE_PREFERENCES };
    }

    const prefs = value as Record<string, unknown>;
    return {
      showUpcomingMeet:
        typeof prefs.showUpcomingMeet === 'boolean'
          ? prefs.showUpcomingMeet
          : DEFAULT_GOOGLE_PREFERENCES.showUpcomingMeet,
      showCalendarEmbed:
        typeof prefs.showCalendarEmbed === 'boolean'
          ? prefs.showCalendarEmbed
          : DEFAULT_GOOGLE_PREFERENCES.showCalendarEmbed,
      showGoogleDrive:
        typeof prefs.showGoogleDrive === 'boolean'
          ? prefs.showGoogleDrive
          : DEFAULT_GOOGLE_PREFERENCES.showGoogleDrive,
      showGmail:
        typeof prefs.showGmail === 'boolean'
          ? prefs.showGmail
          : DEFAULT_GOOGLE_PREFERENCES.showGmail,
      showGoogleChat:
        typeof prefs.showGoogleChat === 'boolean'
          ? prefs.showGoogleChat
          : DEFAULT_GOOGLE_PREFERENCES.showGoogleChat,
    };
  }

  async getChatSpaces(user: AuthenticatedUser) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        spaces: [] as GoogleChatSpace[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const spaces = await this.fetchChatSpaces(accessToken);

    return successResponse({
      connected: true,
      spaces,
    });
  }

  async getChatMessages(user: AuthenticatedUser, spaceId: string) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        spaceId,
        messages: [] as GoogleChatMessage[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const messages = await this.fetchChatMessages(accessToken, spaceId);

    return successResponse({
      connected: true,
      spaceId,
      messages,
    });
  }

  async sendChatMessage(
    user: AuthenticatedUser,
    spaceId: string,
    text: string,
  ) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Google account is not connected');
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Message cannot be empty');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const message = await this.postChatMessage(accessToken, spaceId, trimmed);

    return successResponse({ spaceId, message }, 'Message sent');
  }

  async getGmailMessages(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        messages: [] as GoogleGmailMessage[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const messages = await this.fetchGmailMessages(accessToken, limit);

    return successResponse({
      connected: true,
      googleEmail: connection.googleEmail,
      messages,
    });
  }

  private async fetchGmailMessages(
    accessToken: string,
    limit: number,
  ): Promise<GoogleGmailMessage[]> {
    const listParams = new URLSearchParams({
      maxResults: String(limit),
      labelIds: 'INBOX',
    });

    const listResponse = await fetch(
      `${GMAIL_API_URL}/users/me/messages?${listParams}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!listResponse.ok) {
      throw new BadRequestException('Failed to fetch Gmail messages');
    }

    const listData = (await listResponse.json()) as {
      messages?: Array<{ id: string; threadId: string }>;
    };

    const messageRefs = listData.messages ?? [];
    if (messageRefs.length === 0) {
      return [];
    }

    const messages = await Promise.all(
      messageRefs.map((ref) =>
        this.fetchGmailMessage(accessToken, ref.id, ref.threadId),
      ),
    );

    return messages;
  }

  private async fetchGmailMessage(
    accessToken: string,
    id: string,
    threadId: string,
  ): Promise<GoogleGmailMessage> {
    const params = new URLSearchParams({ format: 'metadata' });
    params.append('metadataHeaders', 'From');
    params.append('metadataHeaders', 'Subject');
    params.append('metadataHeaders', 'Date');

    const response = await fetch(
      `${GMAIL_API_URL}/users/me/messages/${id}?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Gmail message details');
    }

    const data = (await response.json()) as {
      id: string;
      threadId: string;
      snippet?: string;
      labelIds?: string[];
      internalDate?: string;
      payload?: {
        headers?: Array<{ name: string; value: string }>;
      };
    };

    const headers = data.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
        ?.value ?? '';

    const fromRaw = getHeader('From');
    const { name: fromName, email: fromEmail } = this.parseEmailAddress(fromRaw);
    const subject = getHeader('Subject') || '(No subject)';
    const dateHeader = getHeader('Date');
    const receivedAt = dateHeader
      ? new Date(dateHeader).toISOString()
      : data.internalDate
        ? new Date(Number(data.internalDate)).toISOString()
        : new Date().toISOString();

    return {
      id: data.id,
      threadId: data.threadId ?? threadId,
      subject,
      from: fromName,
      fromEmail,
      snippet: data.snippet ?? '',
      receivedAt,
      isUnread: (data.labelIds ?? []).includes('UNREAD'),
      webViewLink: `https://mail.google.com/mail/u/0/#inbox/${data.id}`,
    };
  }

  private parseEmailAddress(value: string): {
    name: string;
    email: string | null;
  } {
    const trimmed = value.trim();
    const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      return {
        name: match[1].replace(/^"|"$/g, '').trim(),
        email: match[2].trim(),
      };
    }
    if (trimmed.includes('@')) {
      return { name: trimmed, email: trimmed };
    }
    return { name: trimmed || 'Unknown sender', email: null };
  }

  private async fetchDriveFiles(
    accessToken: string,
    limit: number,
  ): Promise<GoogleDriveFile[]> {
    const params = new URLSearchParams({
      pageSize: String(limit),
      orderBy: 'modifiedTime desc',
      q: "'root' in parents and trashed=false",
      fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
    });

    const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Google Drive files');
    }

    const data = (await response.json()) as {
      files?: Array<{
        id: string;
        name: string;
        mimeType: string;
        size?: string;
        modifiedTime?: string;
        webViewLink?: string;
      }>;
    };

    return (data.files ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? Number(file.size) : null,
      modifiedAt: file.modifiedTime ?? new Date().toISOString(),
      webViewLink: file.webViewLink ?? null,
    }));
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google Calendar is not configured');
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return successResponse({
      url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const email = await this.fetchGoogleEmail(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.googleCalendarConnection.upsert({
      where: { userId },
      create: {
        userId,
        googleEmail: email,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences: DEFAULT_GOOGLE_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        googleEmail: email,
        encryptedAccessToken: encryptedAccess,
        ...(encryptedRefresh ? { encryptedRefreshToken: encryptedRefresh } : {}),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        lastSyncedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (user) {
      await this.prisma.integration.upsert({
        where: {
          companyId_provider: {
            companyId: user.companyId,
            provider: IntegrationProvider.GOOGLE_CALENDAR,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.GOOGLE_CALENDAR,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.googleCalendarConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.googleCalendarConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.GOOGLE_CALENDAR,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Google Calendar disconnected');
  }

  async getEvents(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        events: [] as CalendarEvent[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const events = await this.fetchGoogleEvents(
      accessToken,
      limit,
      connection.googleEmail,
    );

    await this.prisma.googleCalendarConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      googleEmail: connection.googleEmail,
      events,
    });
  }

  async createMeet(user: AuthenticatedUser, dto: CreateMeetDto) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Google account is not connected');
    }

    const start = new Date(dto.startAt);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid meeting start time');
    }

    const end = new Date(start.getTime() + dto.durationMinutes * 60_000);
    if (end <= start) {
      throw new BadRequestException('Meeting end must be after start');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const event = await this.insertGoogleMeetEvent(
      accessToken,
      dto,
      start,
      end,
      connection.googleEmail,
    );

    await this.prisma.googleCalendarConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse(event, 'Google Meet created');
  }

  private async insertGoogleMeetEvent(
    accessToken: string,
    dto: CreateMeetDto,
    start: Date,
    end: Date,
    organizerEmail: string | null,
  ): Promise<CalendarEvent> {
    const timeZone = dto.timeZone?.trim() || 'UTC';
    const body: Record<string, unknown> = {
      summary: dto.title.trim(),
      description: dto.description?.trim() || undefined,
      start: {
        dateTime: start.toISOString(),
        timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    if (dto.attendeeEmails?.length) {
      body.attendees = dto.attendeeEmails.map((email) => ({ email }));
    }

    const params = new URLSearchParams({
      conferenceDataVersion: '1',
      sendUpdates: dto.attendeeEmails?.length ? 'all' : 'none',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      if (
        response.status === 403 &&
        (error.includes('insufficientPermissions') ||
          error.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT'))
      ) {
        throw new BadRequestException(
          'Google Calendar needs updated permissions to create meetings. Click Reconnect on the Google integration page and approve calendar access again.',
        );
      }

      throw new InternalServerErrorException(
        `Failed to create Google Meet: ${error}`,
      );
    }

    const item = (await response.json()) as GoogleCalendarEventItem;
    const meetLink = extractMeetLink(item);

    if (!meetLink) {
      throw new InternalServerErrorException(
        'Meeting was created but no Google Meet link was returned',
      );
    }

    return this.mapGoogleEventItem(item, meetLink, organizerEmail);
  }

  private mapGoogleEventItem(
    item: GoogleCalendarEventItem,
    meetLink: string,
    fallbackOrganizerEmail: string | null,
  ): CalendarEvent {
    const allDay = !!item.start?.date && !item.start?.dateTime;
    const start = item.start?.dateTime ?? item.start?.date ?? new Date().toISOString();
    const end = item.end?.dateTime ?? item.end?.date ?? start;

    return {
      id: item.id,
      title: item.summary ?? 'Untitled',
      description: item.description ?? null,
      start,
      end,
      location: item.location ?? 'Google Meet',
      htmlLink: item.htmlLink ?? null,
      meetLink,
      meetCode: extractMeetCode(meetLink),
      allDay,
      organizerName: item.organizer?.displayName ?? null,
      organizerEmail: item.organizer?.email ?? fallbackOrganizerEmail,
      attendeeCount: item.attendees?.length ?? 0,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'GOOGLE_REDIRECT_URI',
      callbackPath: '/api/integrations/google-calendar/callback',
    });
  }

  private async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Google token exchange failed: ${error}`);
    }

    return response.json() as Promise<GoogleTokenResponse>;
  }

  private async fetchGoogleEmail(accessToken: string): Promise<string | null> {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    if (tokenInfoRes.ok) {
      const data = (await tokenInfoRes.json()) as { email?: string };
      if (data.email) return data.email;
    }

    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { email?: string };
      return profile.email ?? null;
    }

    return null;
  }

  private async getValidAccessToken(connection: {
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
    userId: string;
  }): Promise<string> {
    const expiresSoon =
      !connection.tokenExpiresAt ||
      connection.tokenExpiresAt.getTime() < Date.now() + 60_000;

    if (!expiresSoon && connection.encryptedAccessToken) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'Google Calendar session expired. Please reconnect.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.googleCalendarConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encrypt(tokens.access_token, this.encryptionKey),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<GoogleTokenResponse> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Failed to refresh Google Calendar token. Please reconnect.',
      );
    }

    return response.json() as Promise<GoogleTokenResponse>;
  }

  private async fetchGoogleEvents(
    accessToken: string,
    limit: number,
    connectedEmail?: string | null,
  ): Promise<CalendarEvent[]> {
    const calendarIds = await this.fetchReadableCalendarIds(accessToken);
    const meetings: CalendarEvent[] = [];
    const seen = new Set<string>();
    let detailFetches = 0;

    for (const calendarId of calendarIds) {
      if (meetings.length >= 100) break;

      let pageToken: string | undefined;
      let pagesFetched = 0;

      while (meetings.length < 100 && pagesFetched < 3) {
        const params = new URLSearchParams({
          maxResults: '100',
          singleEvents: 'true',
          orderBy: 'startTime',
          timeMin: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          conferenceDataVersion: '1',
          fields:
            'nextPageToken,items(id,summary,description,location,hangoutLink,htmlLink,conferenceData,start,end,organizer,attendees,status,recurringEventId)',
        });
        if (pageToken) params.set('pageToken', pageToken);

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (!response.ok) break;

        const data = (await response.json()) as GoogleEventsResponse;
        pagesFetched += 1;

        for (const item of data.items ?? []) {
          if (item.status === 'cancelled') continue;

          const key = `${item.id}:${item.start?.dateTime ?? item.start?.date ?? ''}`;
          if (seen.has(key)) continue;

          let meetLink = extractMeetLink(item);

          if (
            !meetLink &&
            detailFetches < 40 &&
            this.shouldFetchEventDetails(item, connectedEmail)
          ) {
            meetLink = await this.fetchEventMeetLink(
              accessToken,
              calendarId,
              item.id,
            );
            detailFetches += 1;
          }

          if (!meetLink) continue;

          seen.add(key);
          const allDay = !!item.start?.date && !item.start?.dateTime;
          const start = item.start?.dateTime ?? item.start?.date ?? '';
          const end = item.end?.dateTime ?? item.end?.date ?? '';

          meetings.push({
            id: item.id,
            title: item.summary ?? 'Untitled',
            description: item.description ?? null,
            start,
            end,
            location: item.location ?? null,
            htmlLink: item.htmlLink ?? null,
            meetLink,
            meetCode: extractMeetCode(meetLink),
            allDay,
            organizerName: item.organizer?.displayName ?? null,
            organizerEmail: item.organizer?.email ?? null,
            attendeeCount: item.attendees?.length ?? 0,
            recurringEventId: item.recurringEventId ?? null,
          });

          if (meetings.length >= 100) break;
        }

        pageToken = data.nextPageToken;
        if (!pageToken) break;
      }
    }

    return this.dedupeRecurringMeetings(meetings, limit);
  }

  private dedupeRecurringMeetings(
    meetings: CalendarEvent[],
    limit: number,
  ): CalendarEvent[] {
    const now = Date.now() - 60 * 60 * 1000;
    const groups = new Map<string, CalendarEvent[]>();

    for (const meeting of meetings) {
      if (new Date(meeting.start).getTime() < now) continue;

      const seriesKey = meeting.recurringEventId ?? `single:${meeting.id}`;
      const list = groups.get(seriesKey) ?? [];
      list.push(meeting);
      groups.set(seriesKey, list);
    }

    const deduped: CalendarEvent[] = [];

    for (const group of groups.values()) {
      group.sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

      const next = { ...group[0] };
      const titled = group.find((item) => item.title !== 'Untitled');
      if (titled) {
        next.title = titled.title;
        if (!next.description && titled.description) {
          next.description = titled.description;
        }
      }

      deduped.push(next);
    }

    return deduped
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit);
  }

  private shouldFetchEventDetails(
    item: GoogleCalendarEventItem,
    connectedEmail?: string | null,
  ): boolean {
    if (isLikelyGoogleMeetEvent(item)) return true;
    if (item.conferenceData) return true;

    const isTimedEvent = !!item.start?.dateTime;
    if (!isTimedEvent) return false;

    const organizerEmail = item.organizer?.email?.toLowerCase();
    const accountEmail = connectedEmail?.toLowerCase();
    if (organizerEmail && accountEmail && organizerEmail === accountEmail) {
      return true;
    }

    return false;
  }

  private async fetchReadableCalendarIds(
    accessToken: string,
  ): Promise<string[]> {
    const params = new URLSearchParams({
      minAccessRole: 'reader',
      fields: 'items(id,selected,primary)',
    });

    const response = await fetch(`${GOOGLE_CALENDAR_LIST_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return ['primary'];

    const data = (await response.json()) as {
      items?: Array<{ id: string; selected?: boolean; primary?: boolean }>;
    };

    const calendars =
      data.items?.filter((c) => c.selected !== false).map((c) => c.id) ?? [];

    return calendars.length > 0 ? calendars : ['primary'];
  }

  private async fetchEventMeetLink(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<string | null> {
    const params = new URLSearchParams({
      conferenceDataVersion: '1',
      fields: 'hangoutLink,conferenceData,description,location',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) return null;

    const event = (await response.json()) as GoogleCalendarEventItem;
    return extractMeetLink(event);
  }

  private async tokenHasCalendarWriteScope(accessToken: string): Promise<boolean> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );

    if (!response.ok) return false;

    const data = (await response.json()) as { scope?: string };
    const granted = data.scope?.split(' ') ?? [];

    return CALENDAR_WRITE_SCOPES.some((scope) => granted.includes(scope));
  }

  private async tokenHasChatScopes(accessToken: string): Promise<boolean> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );

    if (!response.ok) return false;

    const data = (await response.json()) as { scope?: string };
    const granted = data.scope?.split(' ') ?? [];

    return CHAT_REQUIRED_SCOPES.every((scope) => granted.includes(scope));
  }

  private toSpaceResourceName(spaceId: string): string {
    return spaceId.startsWith('spaces/') ? spaceId : `spaces/${spaceId}`;
  }

  private fromSpaceResourceName(name: string): string {
    return name.startsWith('spaces/') ? name.slice('spaces/'.length) : name;
  }

  private parseGoogleChatError(status: number, error: string): never {
    if (
      status === 403 &&
      (error.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
        error.includes('insufficientPermissions') ||
        error.includes('PERMISSION_DENIED'))
    ) {
      throw new BadRequestException(
        'Google Chat needs updated permissions. Click Reconnect Google and approve Chat access again.',
      );
    }

    if (
      status === 403 &&
      (error.includes('SERVICE_DISABLED') ||
        error.includes('Chat API has not been used') ||
        error.includes('API has not been used'))
    ) {
      throw new BadRequestException(
        'Google Chat API is not enabled on this Google Cloud project. Enable the Chat API, then reconnect Google.',
      );
    }

    throw new BadRequestException(
      `Failed to fetch Google Chat data (${status}): ${error.slice(0, 400)}`,
    );
  }

  private async fetchChatSpaces(accessToken: string): Promise<GoogleChatSpace[]> {
    const spaces: GoogleChatSpace[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        pageSize: '100',
        filter:
          'spaceType = "SPACE" OR spaceType = "GROUP_CHAT" OR spaceType = "DIRECT_MESSAGE"',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const response = await fetch(`${GOOGLE_CHAT_API_URL}/spaces?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        return this.parseGoogleChatError(response.status, await response.text());
      }

      const data = (await response.json()) as {
        spaces?: Array<{
          name: string;
          displayName?: string;
          spaceType?: string;
          singleUserBotDm?: boolean;
        }>;
        nextPageToken?: string;
      };

      for (const space of data.spaces ?? []) {
        const spaceType = space.spaceType ?? 'SPACE';
        const kind =
          spaceType === 'DIRECT_MESSAGE'
            ? 'dm'
            : spaceType === 'GROUP_CHAT'
              ? 'group_dm'
              : 'space';

        spaces.push({
          id: this.fromSpaceResourceName(space.name),
          name:
            space.displayName?.trim() ||
            (kind === 'dm' ? 'Direct message' : 'Untitled space'),
          memberCount: kind === 'dm' ? 2 : 0,
          isPrivate: kind !== 'space',
          kind,
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    await this.resolveChatSpaceDisplayNames(accessToken, spaces);
    return this.sortChatSpaces(spaces);
  }

  private async resolveChatSpaceDisplayNames(
    accessToken: string,
    spaces: GoogleChatSpace[],
  ) {
    const unresolved = spaces.filter(
      (space) =>
        (space.kind === 'dm' || space.kind === 'group_dm') &&
        (space.name === 'Direct message' || space.name === 'Untitled space'),
    );

    await Promise.all(
      unresolved.slice(0, 40).map(async (space) => {
        const name = await this.fetchChatSpaceMemberLabel(accessToken, space.id);
        if (name) space.name = name;
      }),
    );
  }

  private async fetchChatSpaceMemberLabel(
    accessToken: string,
    spaceId: string,
  ): Promise<string | null> {
    const parent = this.toSpaceResourceName(spaceId);
    const response = await fetch(
      `${GOOGLE_CHAT_API_URL}/${parent}/members?pageSize=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      memberships?: Array<{
        member?: {
          name?: string;
          displayName?: string;
          type?: string;
        };
      }>;
    };

    const humans = (data.memberships ?? [])
      .map((entry) => entry.member)
      .filter(
        (member): member is { name?: string; displayName?: string; type?: string } =>
          !!member && member.type !== 'BOT',
      );

    const labels = humans
      .map((member) => member.displayName?.trim())
      .filter((label): label is string => !!label);

    if (labels.length === 0) return null;
    if (labels.length === 1) return labels[0];
    return labels.slice(0, 3).join(', ');
  }

  private sortChatSpaces(spaces: GoogleChatSpace[]): GoogleChatSpace[] {
    const sorter = (a: GoogleChatSpace, b: GoogleChatSpace) =>
      a.name.localeCompare(b.name);

    return [
      ...spaces.filter((space) => space.kind === 'space').sort(sorter),
      ...spaces
        .filter((space) => space.kind === 'dm' || space.kind === 'group_dm')
        .sort(sorter),
    ];
  }

  private async fetchChatMessages(
    accessToken: string,
    spaceId: string,
  ): Promise<GoogleChatMessage[]> {
    const parent = this.toSpaceResourceName(spaceId);
    const params = new URLSearchParams({
      pageSize: '25',
      orderBy: 'createTime desc',
    });

    const response = await fetch(
      `${GOOGLE_CHAT_API_URL}/${parent}/messages?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      return this.parseGoogleChatError(response.status, await response.text());
    }

    const data = (await response.json()) as {
      messages?: Array<{
        name: string;
        text?: string;
        createTime?: string;
        sender?: {
          name?: string;
          displayName?: string;
          type?: string;
        };
      }>;
    };

    const messages = (data.messages ?? [])
      .map((message) => ({
        id: message.name,
        text: message.text ?? '',
        userId: message.sender?.name ?? null,
        userName: message.sender?.displayName ?? null,
        timestamp: message.createTime ?? new Date().toISOString(),
      }))
      .filter((message) => message.text.trim().length > 0)
      .reverse();

    return messages;
  }

  private async postChatMessage(
    accessToken: string,
    spaceId: string,
    text: string,
  ): Promise<GoogleChatMessage> {
    const parent = this.toSpaceResourceName(spaceId);

    const response = await fetch(`${GOOGLE_CHAT_API_URL}/${parent}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (
        response.status === 403 &&
        (error.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
          error.includes('insufficientPermissions'))
      ) {
        throw new BadRequestException(
          'Google Chat needs updated permissions. Click Reconnect Google and approve Chat access again.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to send Google Chat message: ${error}`,
      );
    }

    const data = (await response.json()) as {
      name: string;
      text?: string;
      createTime?: string;
      sender?: {
        name?: string;
        displayName?: string;
      };
    };

    return {
      id: data.name,
      text: data.text ?? text,
      userId: data.sender?.name ?? null,
      userName: data.sender?.displayName ?? null,
      timestamp: data.createTime ?? new Date().toISOString(),
    };
  }
}
