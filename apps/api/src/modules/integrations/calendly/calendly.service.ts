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
import {
  createOAuthState,
  verifyOAuthState,
} from '../google-calendar/utils/oauth-state.util';
import { resolveOAuthRedirectUri } from '../utils/resolve-oauth-redirect-uri.util';
import { UpdateCalendlyPreferencesDto } from './dto/update-calendly-preferences.dto';
import {
  CalendlyEventType,
  CalendlyScheduledEvent,
} from './types/calendly-event.type';
import {
  DEFAULT_CALENDLY_PREFERENCES,
  CalendlyPreferences,
} from './types/calendly-preferences.type';

const CALENDLY_AUTH_URL = 'https://auth.calendly.com/oauth/authorize';
const CALENDLY_TOKEN_URL = 'https://auth.calendly.com/oauth/token';
const CALENDLY_API_BASE = 'https://api.calendly.com';

interface CalendlyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  created_at?: number;
  owner?: string;
}

interface CalendlyUserResource {
  uri?: string;
  name?: string;
  email?: string;
  scheduling_url?: string;
  timezone?: string;
}

interface CalendlyEventTypeResource {
  uri: string;
  name: string;
  description_plain?: string | null;
  duration?: number;
  scheduling_url?: string;
  active?: boolean;
}

interface CalendlyScheduledEventResource {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type?: string;
  location?: {
    type?: string;
    location?: string | null;
    join_url?: string | null;
  } | null;
}

@Injectable()
export class CalendlyService {
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
    const connection = await this.prisma.calendlyConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      calendlyEmail: connection?.calendlyEmail ?? null,
      calendlyName: connection?.calendlyName ?? null,
      schedulingUrl: connection?.schedulingUrl ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateCalendlyPreferencesDto,
  ) {
    const connection = await this.prisma.calendlyConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Calendly account is not connected');
    }

    const preferences: CalendlyPreferences = {
      showEventTypes: dto.showEventTypes,
      showUpcomingEvents: dto.showUpcomingEvents,
    };

    await this.prisma.calendlyConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('CALENDLY_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Calendly is not configured. Set CALENDLY_CLIENT_ID and CALENDLY_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('CALENDLY_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'CALENDLY_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    });

    return successResponse({
      url: `${CALENDLY_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const me = await this.fetchCurrentUser(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.calendlyConnection.upsert({
      where: { userId },
      create: {
        userId,
        calendlyEmail: me.email ?? null,
        calendlyName: me.name ?? null,
        calendlyUserUri: me.uri ?? null,
        schedulingUrl: me.scheduling_url ?? null,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_CALENDLY_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        calendlyEmail: me.email ?? null,
        calendlyName: me.name ?? null,
        calendlyUserUri: me.uri ?? null,
        schedulingUrl: me.scheduling_url ?? null,
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
            provider: IntegrationProvider.CALENDLY,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.CALENDLY,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.calendlyConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.calendlyConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.CALENDLY,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Calendly disconnected');
  }

  async getEventTypes(user: AuthenticatedUser) {
    const connection = await this.requireConnection(user);
    const accessToken = await this.getValidAccessToken(connection);
    const userUri = connection.calendlyUserUri;
    if (!userUri) {
      throw new BadRequestException(
        'Calendly user is missing. Please reconnect your account.',
      );
    }

    const payload = await this.calendlyFetch<{
      collection?: CalendlyEventTypeResource[];
    }>(
      `${CALENDLY_API_BASE}/event_types?user=${encodeURIComponent(userUri)}&active=true&count=50`,
      accessToken,
    );

    const eventTypes: CalendlyEventType[] = (payload.collection ?? []).map(
      (item) => ({
        uri: item.uri,
        name: item.name,
        description: item.description_plain?.trim()
          ? item.description_plain
          : null,
        durationMinutes: item.duration ?? null,
        schedulingUrl: item.scheduling_url ?? null,
        active: item.active !== false,
      }),
    );

    await this.prisma.calendlyConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      eventTypes,
    });
  }

  async getUpcomingEvents(user: AuthenticatedUser) {
    const connection = await this.requireConnection(user);
    const accessToken = await this.getValidAccessToken(connection);
    const userUri = connection.calendlyUserUri;
    if (!userUri) {
      throw new BadRequestException(
        'Calendly user is missing. Please reconnect your account.',
      );
    }

    const minStart = new Date().toISOString();
    const payload = await this.calendlyFetch<{
      collection?: CalendlyScheduledEventResource[];
    }>(
      `${CALENDLY_API_BASE}/scheduled_events?user=${encodeURIComponent(userUri)}&status=active&min_start_time=${encodeURIComponent(minStart)}&sort=start_time:asc&count=30`,
      accessToken,
    );

    const events: CalendlyScheduledEvent[] = (payload.collection ?? []).map(
      (item) => ({
        uri: item.uri,
        name: item.name,
        status: item.status,
        startAt: item.start_time,
        endAt: item.end_time,
        eventTypeUri: item.event_type ?? null,
        location: item.location?.location ?? item.location?.type ?? null,
        meetingUrl: item.location?.join_url ?? null,
      }),
    );

    await this.prisma.calendlyConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      events,
    });
  }

  private async requireConnection(user: AuthenticatedUser) {
    const connection = await this.prisma.calendlyConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Calendly account is not connected');
    }

    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Calendly token is missing. Please reconnect your account.',
      );
    }

    return connection;
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_CALENDLY_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showEventTypes:
        typeof raw.showEventTypes === 'boolean'
          ? raw.showEventTypes
          : DEFAULT_CALENDLY_PREFERENCES.showEventTypes,
      showUpcomingEvents:
        typeof raw.showUpcomingEvents === 'boolean'
          ? raw.showUpcomingEvents
          : DEFAULT_CALENDLY_PREFERENCES.showUpcomingEvents,
    } satisfies CalendlyPreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'CALENDLY_REDIRECT_URI',
      callbackPath: '/api/integrations/calendly/callback',
    });
  }

  private getBasicAuthHeader(): string {
    const clientId = this.configService.get<string>('CALENDLY_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'CALENDLY_CLIENT_SECRET',
    );
    return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  }

  private async exchangeCodeForTokens(code: string) {
    const redirectUri = this.getRedirectUri();
    const response = await fetch(CALENDLY_TOKEN_URL, {
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
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || 'Failed to exchange Calendly authorization code',
      );
    }

    return (await response.json()) as CalendlyTokenResponse;
  }

  private async refreshAccessToken(refreshToken: string) {
    const response = await fetch(CALENDLY_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: this.getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new UnauthorizedException(
        body || 'Failed to refresh Calendly access token. Please reconnect.',
      );
    }

    return (await response.json()) as CalendlyTokenResponse;
  }

  private async getValidAccessToken(connection: {
    userId: string;
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
  }) {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Calendly token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new UnauthorizedException(
        'Calendly session expired. Please reconnect your account.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);
    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : connection.encryptedRefreshToken;

    await this.prisma.calendlyConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  }

  private async fetchCurrentUser(accessToken: string) {
    const payload = await this.calendlyFetch<{ resource?: CalendlyUserResource }>(
      `${CALENDLY_API_BASE}/users/me`,
      accessToken,
    );
    return payload.resource ?? {};
  }

  private async calendlyFetch<T>(
    url: string,
    accessToken: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException(
          'Calendly access was denied. Reconnect your Calendly account.',
        );
      }
      throw new BadRequestException(
        body || `Calendly request failed (${response.status})`,
      );
    }

    return (await response.json()) as T;
  }
}
