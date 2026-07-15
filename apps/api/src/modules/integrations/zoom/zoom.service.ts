import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationProvider, IntegrationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/types/api-response.type';
import { decrypt, encrypt } from '../../../common/utils/encryption.util';
import { successResponse } from '../../../common/utils/api-response.util';
import { createOAuthState, verifyOAuthState } from '../google-calendar/utils/oauth-state.util';
import { resolveOAuthRedirectUri } from '../utils/resolve-oauth-redirect-uri.util';
import { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';
import { UpdateZoomPreferencesDto } from './dto/update-zoom-preferences.dto';
import { ZoomMeeting } from './types/zoom-meeting.type';
import {
  DEFAULT_ZOOM_PREFERENCES,
  ZoomPreferences,
} from './types/zoom-preferences.type';
import { ZoomProfile } from './types/zoom-profile.type';

const ZOOM_AUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_USER_URL = 'https://api.zoom.us/v2/users/me';
const ZOOM_MEETINGS_URL = 'https://api.zoom.us/v2/users/me/meetings';
const ZOOM_SCOPES = [
  'meeting:read:list_upcoming_meetings',
  'meeting:write:meeting',
  'user:read:user',
].join(' ');

interface ZoomTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface ZoomUserResponse {
  email?: string;
  first_name?: string;
  last_name?: string;
  pmi?: number | string;
  timezone?: string;
  type?: number;
}

interface ZoomMeetingSettings {
  password?: string;
}

interface ZoomMeetingItem {
  id: number;
  uuid?: string;
  topic?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
  join_url?: string;
  password?: string;
  host_email?: string;
  settings?: ZoomMeetingSettings;
}

interface ZoomMeetingsResponse {
  meetings?: ZoomMeetingItem[];
  total_records?: number;
}

@Injectable()
export class ZoomService {
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
    const connection = await this.prisma.zoomConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      zoomEmail: connection?.zoomEmail ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateZoomPreferencesDto,
  ) {
    const connection = await this.prisma.zoomConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Zoom account is not connected');
    }

    const preferences: ZoomPreferences = {
      showUpcomingMeetings: dto.showUpcomingMeetings,
      showProfile: dto.showProfile,
      showCalendarView: dto.showCalendarView,
    };

    await this.prisma.zoomConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Zoom is not configured');
    }

    const clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');
    if (!clientSecret) {
      throw new BadRequestException(
        'ZOOM_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes = this.configService.get<string>('ZOOM_SCOPES')?.trim();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });
    if (scopes) {
      params.set('scope', scopes);
    }

    return successResponse({
      url: `${ZOOM_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const email = await this.fetchZoomEmail(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.zoomConnection.upsert({
      where: { userId },
      create: {
        userId,
        zoomEmail: email,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences: DEFAULT_ZOOM_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        zoomEmail: email,
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
            provider: IntegrationProvider.ZOOM,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.ZOOM,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.zoomConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.zoomConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.ZOOM,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Zoom disconnected');
  }

  async getProfile(user: AuthenticatedUser) {
    const connection = await this.prisma.zoomConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        profile: null as ZoomProfile | null,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const profile = await this.fetchZoomProfile(accessToken);

    return successResponse({
      connected: true,
      profile: {
        ...profile,
        email: profile.email ?? connection.zoomEmail,
      },
    });
  }

  async getMeetings(user: AuthenticatedUser, limit = 30, includePast = false) {
    const connection = await this.prisma.zoomConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        meetings: [] as ZoomMeeting[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const meetings = await this.fetchZoomMeetings(
      accessToken,
      limit,
      connection.zoomEmail,
      includePast,
    );

    await this.prisma.zoomConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      zoomEmail: connection.zoomEmail,
      meetings,
    });
  }

  async createMeeting(user: AuthenticatedUser, dto: CreateZoomMeetingDto) {
    const connection = await this.prisma.zoomConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Zoom account is not connected');
    }

    const startDate = new Date(dto.startTime);
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start time');
    }

    if (startDate.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('Start time must be in the future');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const meeting = await this.createZoomMeeting(
      accessToken,
      dto,
      connection.zoomEmail,
    );

    await this.prisma.zoomConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({ meeting }, 'Meeting scheduled successfully');
  }

  private resolvePreferences(value: unknown): ZoomPreferences {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_ZOOM_PREFERENCES };
    }

    const prefs = value as Record<string, unknown>;
    return {
      showUpcomingMeetings:
        typeof prefs.showUpcomingMeetings === 'boolean'
          ? prefs.showUpcomingMeetings
          : DEFAULT_ZOOM_PREFERENCES.showUpcomingMeetings,
      showProfile:
        typeof prefs.showProfile === 'boolean'
          ? prefs.showProfile
          : DEFAULT_ZOOM_PREFERENCES.showProfile,
      showCalendarView:
        typeof prefs.showCalendarView === 'boolean'
          ? prefs.showCalendarView
          : DEFAULT_ZOOM_PREFERENCES.showCalendarView,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'ZOOM_REDIRECT_URI',
      callbackPath: '/api/integrations/zoom/callback',
    });
  }

  private async zoomFetch(
    url: string,
    init?: RequestInit,
  ): Promise<Response> {
    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(20_000),
    });
  }

  private getBasicAuthHeader(): string {
    const clientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');
    return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  }

  private async exchangeCodeForTokens(code: string): Promise<ZoomTokenResponse> {
    const redirectUri = this.getRedirectUri();

    const response = await this.zoomFetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: this.getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Zoom token exchange failed: ${error}`);
    }

    return response.json() as Promise<ZoomTokenResponse>;
  }

  private mapZoomAccountType(type?: number): string | null {
    switch (type) {
      case 1:
        return 'Basic';
      case 2:
        return 'Licensed';
      case 3:
        return 'On-prem';
      default:
        return null;
    }
  }

  private async fetchZoomProfile(accessToken: string): Promise<ZoomProfile> {
    const response = await this.zoomFetch(ZOOM_USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Zoom profile');
    }

    const data = (await response.json()) as ZoomUserResponse;
    const firstName = data.first_name ?? null;
    const lastName = data.last_name ?? null;

    return {
      email: data.email ?? null,
      firstName,
      lastName,
      displayName:
        [firstName, lastName].filter(Boolean).join(' ') || data.email || null,
      pmi: data.pmi != null ? String(data.pmi) : null,
      timezone: data.timezone ?? null,
      accountType: this.mapZoomAccountType(data.type),
    };
  }

  private async fetchZoomEmail(accessToken: string): Promise<string | null> {
    const profile = await this.fetchZoomProfile(accessToken);
    return profile.email;
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
        'Zoom session expired. Please reconnect.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.zoomConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encrypt(tokens.access_token, this.encryptionKey),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        ...(tokens.refresh_token
          ? {
              encryptedRefreshToken: encrypt(
                tokens.refresh_token,
                this.encryptionKey,
              ),
            }
          : {}),
      },
    });

    return tokens.access_token;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<ZoomTokenResponse> {
    const response = await this.zoomFetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: this.getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Failed to refresh Zoom token. Please reconnect.',
      );
    }

    return response.json() as Promise<ZoomTokenResponse>;
  }

  private mapZoomMeetingItem(
    meeting: ZoomMeetingItem,
    hostEmail?: string | null,
  ): ZoomMeeting {
    const meetingId = String(meeting.id);
    return {
      id: meetingId,
      topic: meeting.topic ?? 'Untitled meeting',
      start: meeting.start_time ?? new Date().toISOString(),
      duration: meeting.duration ?? 30,
      timezone: meeting.timezone ?? 'UTC',
      joinUrl: meeting.join_url ?? `https://zoom.us/j/${meetingId}`,
      password: meeting.settings?.password ?? meeting.password ?? null,
      hostEmail: meeting.host_email ?? hostEmail ?? null,
      meetingNumber: meetingId,
    };
  }

  private async listZoomMeetingItems(
    accessToken: string,
    type: 'scheduled' | 'upcoming',
    pageSize: number,
  ): Promise<ZoomMeetingItem[]> {
    const params = new URLSearchParams({
      type,
      page_size: String(pageSize),
    });

    const response = await this.zoomFetch(`${ZOOM_MEETINGS_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to fetch Zoom meetings (${type}): ${this.parseZoomError(error)}`,
      );
    }

    const data = (await response.json()) as ZoomMeetingsResponse;
    return data.meetings ?? [];
  }

  private mergeZoomMeetingItems(
    ...lists: ZoomMeetingItem[][]
  ): ZoomMeetingItem[] {
    const byId = new Map<number, ZoomMeetingItem>();
    for (const list of lists) {
      for (const meeting of list) {
        if (meeting.id) {
          byId.set(meeting.id, meeting);
        }
      }
    }
    return [...byId.values()];
  }

  private async createZoomMeeting(
    accessToken: string,
    dto: CreateZoomMeetingDto,
    hostEmail?: string | null,
  ): Promise<ZoomMeeting> {
    const body: Record<string, unknown> = {
      topic: dto.topic,
      type: 2,
      start_time: new Date(dto.startTime).toISOString(),
      duration: dto.duration,
      timezone: 'UTC',
      settings: dto.password ? { password: dto.password } : {},
    };

    const response = await this.zoomFetch(ZOOM_MEETINGS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to create Zoom meeting: ${this.parseZoomError(error)}`,
      );
    }

    const data = (await response.json()) as ZoomMeetingItem;
    return this.mapZoomMeetingItem(data, hostEmail);
  }

  private async fetchZoomMeetings(
    accessToken: string,
    limit: number,
    hostEmail?: string | null,
    includePast = false,
  ): Promise<ZoomMeeting[]> {
    const pageSize = Math.min(Math.max(limit, 1), 30);
    const results = await Promise.allSettled([
      this.listZoomMeetingItems(accessToken, 'scheduled', pageSize),
      this.listZoomMeetingItems(accessToken, 'upcoming', pageSize),
    ]);

    const lists = results
      .filter(
        (result): result is PromiseFulfilledResult<ZoomMeetingItem[]> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);

    if (lists.length === 0) {
      const firstError = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      if (firstError) {
        throw firstError.reason;
      }
      return [];
    }

    const now = Date.now();
    const meetings = this.mergeZoomMeetingItems(...lists)
      .filter((meeting) => {
        if (includePast || !meeting.start_time) return true;
        const start = new Date(meeting.start_time).getTime();
        const durationMs = (meeting.duration ?? 30) * 60 * 1000;
        return start + durationMs >= now - 5 * 60 * 1000;
      })
      .sort(
        (a, b) =>
          new Date(a.start_time ?? 0).getTime() -
          new Date(b.start_time ?? 0).getTime(),
      )
      .slice(0, limit)
      .map((meeting) => this.mapZoomMeetingItem(meeting, hostEmail));

    return Promise.all(
      meetings.map((meeting) =>
        meeting.password
          ? meeting
          : this.enrichMeetingWithPasscode(accessToken, meeting),
      ),
    );
  }

  private async enrichMeetingWithPasscode(
    accessToken: string,
    meeting: ZoomMeeting,
  ): Promise<ZoomMeeting> {
    const response = await this.zoomFetch(
      `https://api.zoom.us/v2/meetings/${meeting.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) return meeting;

    const data = (await response.json()) as ZoomMeetingItem;
    return {
      ...meeting,
      password: data.settings?.password ?? data.password ?? meeting.password,
    };
  }

  private parseZoomError(raw: string): string {
    try {
      const parsed = JSON.parse(raw) as {
        message?: string;
        reason?: string;
      };
      return parsed.message ?? parsed.reason ?? raw;
    } catch {
      return raw || 'Unknown Zoom API error';
    }
  }
}

export type { ZoomMeeting };
