import { BadRequestException, Injectable } from '@nestjs/common';
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
import { UpdateHubSpotPreferencesDto } from './dto/update-hubspot-preferences.dto';
import {
  DEFAULT_HUBSPOT_PREFERENCES,
  HubSpotContact,
  HubSpotDeal,
  HubSpotPreferences,
  HubSpotTicket,
} from './types/hubspot-preferences.type';

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const DEFAULT_HUBSPOT_SCOPES =
  'crm.objects.contacts.read crm.objects.deals.read';

interface HubSpotTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

interface HubSpotTokenInfo {
  token?: string;
  user?: string;
  hub_domain?: string;
  hub_id?: number;
  user_id?: number;
}

interface HubSpotObject {
  id?: string;
  properties?: Record<string, string | null>;
  updatedAt?: string;
}

interface HubSpotListResponse {
  results?: HubSpotObject[];
}

@Injectable()
export class HubSpotService {
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
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret');
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.hubSpotConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      hubspotEmail: connection?.hubspotEmail ?? null,
      hubDomain: connection?.hubDomain ?? null,
      hubspotPortalId: connection?.hubspotPortalId ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateHubSpotPreferencesDto,
  ) {
    const connection = await this.prisma.hubSpotConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('HubSpot account is not connected');
    }

    const preferences: HubSpotPreferences = {
      showContacts: dto.showContacts,
      showDeals: dto.showDeals,
      showTickets: dto.showTickets,
    };

    await this.prisma.hubSpotConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('HUBSPOT_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'HubSpot is not configured. Set HUBSPOT_CLIENT_ID and HUBSPOT_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('HUBSPOT_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'HUBSPOT_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('HUBSPOT_SCOPES')?.trim() ||
      DEFAULT_HUBSPOT_SCOPES;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      response_type: 'code',
    });

    return successResponse({
      url: `${HUBSPOT_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const info = await this.fetchTokenInfo(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;
    const expiresIn = tokens.expires_in ?? 1_800;

    await this.prisma.hubSpotConnection.upsert({
      where: { userId },
      create: {
        userId,
        hubspotPortalId: info.hub_id ? String(info.hub_id) : null,
        hubspotEmail: info.user ?? null,
        hubDomain: info.hub_domain ?? null,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_HUBSPOT_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        hubspotPortalId: info.hub_id ? String(info.hub_id) : null,
        hubspotEmail: info.user ?? null,
        hubDomain: info.hub_domain ?? null,
        encryptedAccessToken: encryptedAccess,
        ...(encryptedRefresh ? { encryptedRefreshToken: encryptedRefresh } : {}),
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
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
            provider: IntegrationProvider.HUBSPOT,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.HUBSPOT,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.hubSpotConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.hubSpotConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.HUBSPOT,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'HubSpot disconnected');
  }

  async getContacts(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.hubSpotConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        contacts: [] as HubSpotContact[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const contacts = await this.fetchContacts(
      accessToken,
      connection.hubspotPortalId,
      limit,
    );

    await this.prisma.hubSpotConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      hubspotEmail: connection.hubspotEmail,
      contacts,
    });
  }

  async getDeals(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.hubSpotConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        deals: [] as HubSpotDeal[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const deals = await this.fetchDeals(
      accessToken,
      connection.hubspotPortalId,
      limit,
    );

    await this.prisma.hubSpotConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      hubspotEmail: connection.hubspotEmail,
      deals,
    });
  }

  async getTickets(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.hubSpotConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        tickets: [] as HubSpotTicket[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const tickets = await this.fetchTickets(
      accessToken,
      connection.hubspotPortalId,
      limit,
    );

    await this.prisma.hubSpotConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      hubspotEmail: connection.hubspotEmail,
      tickets,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_HUBSPOT_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showContacts:
        typeof raw.showContacts === 'boolean'
          ? raw.showContacts
          : DEFAULT_HUBSPOT_PREFERENCES.showContacts,
      showDeals:
        typeof raw.showDeals === 'boolean'
          ? raw.showDeals
          : DEFAULT_HUBSPOT_PREFERENCES.showDeals,
      showTickets:
        typeof raw.showTickets === 'boolean'
          ? raw.showTickets
          : DEFAULT_HUBSPOT_PREFERENCES.showTickets,
    } satisfies HubSpotPreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'HUBSPOT_REDIRECT_URI',
      callbackPath: '/api/integrations/hubspot/callback',
    });
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = this.configService.get<string>('HUBSPOT_CLIENT_ID');
    const clientSecret = this.configService.get<string>('HUBSPOT_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    const response = await fetch(HUBSPOT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        redirect_uri: redirectUri,
        code,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || 'Failed to exchange HubSpot authorization code',
      );
    }

    return (await response.json()) as HubSpotTokenResponse;
  }

  private async refreshAccessToken(refreshToken: string) {
    const clientId = this.configService.get<string>('HUBSPOT_CLIENT_ID');
    const clientSecret = this.configService.get<string>('HUBSPOT_CLIENT_SECRET');

    const response = await fetch(HUBSPOT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || 'Failed to refresh HubSpot access token. Please reconnect.',
      );
    }

    return (await response.json()) as HubSpotTokenResponse;
  }

  private async getValidAccessToken(connection: {
    userId: string;
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
  }) {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'HubSpot token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'HubSpot session expired. Please reconnect your account.',
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
    const expiresIn = tokens.expires_in ?? 1_800;

    await this.prisma.hubSpotConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    return tokens.access_token;
  }

  private async fetchTokenInfo(accessToken: string): Promise<HubSpotTokenInfo> {
    return this.hubspotFetch<HubSpotTokenInfo>(
      `${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${encodeURIComponent(accessToken)}`,
      accessToken,
    );
  }

  private buildRecordUrl(
    portalId: string | null,
    objectType: 'contact' | 'deal' | 'ticket',
    id: string,
  ): string | null {
    if (!portalId) return null;
    return `https://app.hubspot.com/contacts/${portalId}/${objectType}/${id}`;
  }

  private async fetchContacts(
    accessToken: string,
    portalId: string | null,
    limit: number,
  ): Promise<HubSpotContact[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      limit: String(capped),
      properties:
        'firstname,lastname,email,company,jobtitle,lifecyclestage',
      archived: 'false',
    });

    const payload = await this.hubspotFetch<HubSpotListResponse>(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts?${params.toString()}`,
      accessToken,
    );

    return (payload.results ?? []).slice(0, limit).map((entry) => {
      const props = entry.properties ?? {};
      const id = entry.id ?? '';
      const name =
        [props.firstname, props.lastname].filter(Boolean).join(' ').trim() ||
        props.email ||
        'Unnamed contact';
      return {
        id,
        name,
        email: props.email ?? null,
        company: props.company ?? null,
        jobTitle: props.jobtitle ?? null,
        lifecycleStage: props.lifecyclestage ?? null,
        updatedAt: entry.updatedAt ?? new Date().toISOString(),
        webUrl: this.buildRecordUrl(portalId, 'contact', id),
      };
    });
  }

  private async fetchDeals(
    accessToken: string,
    portalId: string | null,
    limit: number,
  ): Promise<HubSpotDeal[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      limit: String(capped),
      properties: 'dealname,amount,dealstage,pipeline,closedate',
      archived: 'false',
    });

    const payload = await this.hubspotFetch<HubSpotListResponse>(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals?${params.toString()}`,
      accessToken,
    );

    return (payload.results ?? []).slice(0, limit).map((entry) => {
      const props = entry.properties ?? {};
      const id = entry.id ?? '';
      return {
        id,
        name: props.dealname || 'Untitled deal',
        amount: props.amount ?? null,
        stage: props.dealstage ?? null,
        pipeline: props.pipeline ?? null,
        closeDate: props.closedate ?? null,
        updatedAt: entry.updatedAt ?? new Date().toISOString(),
        webUrl: this.buildRecordUrl(portalId, 'deal', id),
      };
    });
  }

  private async fetchTickets(
    accessToken: string,
    portalId: string | null,
    limit: number,
  ): Promise<HubSpotTicket[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      limit: String(capped),
      properties:
        'subject,content,hs_pipeline_stage,hs_ticket_priority,hs_pipeline,createdate',
      archived: 'false',
    });

    const payload = await this.hubspotFetch<HubSpotListResponse>(
      `${HUBSPOT_API_BASE}/crm/v3/objects/tickets?${params.toString()}`,
      accessToken,
    );

    return (payload.results ?? []).slice(0, limit).map((entry) => {
      const props = entry.properties ?? {};
      const id = entry.id ?? '';
      return {
        id,
        subject: props.subject || 'Untitled ticket',
        stage: props.hs_pipeline_stage ?? null,
        priority: props.hs_ticket_priority ?? null,
        pipeline: props.hs_pipeline ?? null,
        content: props.content ?? null,
        createdAt: props.createdate ?? null,
        updatedAt: entry.updatedAt ?? new Date().toISOString(),
        webUrl: this.buildRecordUrl(portalId, 'ticket', id),
      };
    });
  }

  private async hubspotFetch<T>(
    url: string,
    accessToken: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException(
          'HubSpot access was denied. Reconnect your HubSpot account.',
        );
      }
      throw new BadRequestException(
        body || `HubSpot request failed (${response.status})`,
      );
    }

    return (await response.json()) as T;
  }
}
