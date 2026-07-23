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
import { UpdateSharePointPreferencesDto } from './dto/update-sharepoint-preferences.dto';
import {
  DEFAULT_SHAREPOINT_PREFERENCES,
  SharePointPreferences,
  SharePointSite,
} from './types/sharepoint-preferences.type';

const SHAREPOINT_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const SHAREPOINT_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
const DEFAULT_SCOPES = 'Sites.Read.All User.Read offline_access';
const SHAREPOINT_HOME_URL = 'https://www.office.com/launch/sharepoint';

interface SharePointTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GraphUserResponse {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

interface GraphSiteItem {
  id: string;
  displayName?: string;
  name?: string;
  webUrl?: string;
  description?: string;
}

interface GraphFollowedSitesResponse {
  value?: GraphSiteItem[];
}

@Injectable()
export class SharePointService {
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
    const connection = await this.prisma.sharePointConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      sharepointEmail: connection?.sharepointEmail ?? null,
      sharepointDisplayName: connection?.sharepointDisplayName ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateSharePointPreferencesDto,
  ) {
    const connection = await this.prisma.sharePointConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('SharePoint account is not connected');
    }

    const preferences: SharePointPreferences = {
      showSites: dto.showSites,
    };

    await this.prisma.sharePointConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService
      .get<string>('SHAREPOINT_CLIENT_ID')
      ?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'SharePoint is not configured. Set SHAREPOINT_CLIENT_ID and SHAREPOINT_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('SHAREPOINT_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'SHAREPOINT_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('SHAREPOINT_SCOPES')?.trim() ||
      DEFAULT_SCOPES;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes,
      state,
    });

    return successResponse({
      url: `${SHAREPOINT_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchGraphProfile(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.sharePointConnection.upsert({
      where: { userId },
      create: {
        userId,
        sharepointAccountId: profile.id ?? null,
        sharepointEmail: profile.email,
        sharepointDisplayName: profile.displayName,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_SHAREPOINT_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        sharepointAccountId: profile.id ?? null,
        sharepointEmail: profile.email,
        sharepointDisplayName: profile.displayName,
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
            provider: IntegrationProvider.SHAREPOINT,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.SHAREPOINT,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.sharePointConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.sharePointConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.SHAREPOINT,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'SharePoint disconnected');
  }

  async getSites(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.sharePointConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        sites: [] as SharePointSite[],
      });
    }

    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'SharePoint session expired. Please reconnect your account.',
      );
    }

    const accessToken = await this.getValidAccessToken(connection);
    const sites = await this.fetchFollowedSites(accessToken, limit);

    await this.prisma.sharePointConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      sharepointEmail: connection.sharepointEmail,
      sites,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_SHAREPOINT_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showSites:
        typeof raw.showSites === 'boolean'
          ? raw.showSites
          : DEFAULT_SHAREPOINT_PREFERENCES.showSites,
    } satisfies SharePointPreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'SHAREPOINT_REDIRECT_URI',
      callbackPath: '/api/integrations/sharepoint/callback',
    });
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<SharePointTokenResponse> {
    const clientId = this.configService.get<string>('SHAREPOINT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SHAREPOINT_CLIENT_SECRET',
    );
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('SharePoint is not configured');
    }

    const response = await fetch(SHAREPOINT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to exchange SharePoint authorization code: ${error}`,
      );
    }

    return response.json() as Promise<SharePointTokenResponse>;
  }

  private async fetchGraphProfile(accessToken: string): Promise<{
    id: string | null;
    email: string | null;
    displayName: string | null;
  }> {
    const response = await fetch(
      `${GRAPH_API_URL}/me?$select=id,displayName,mail,userPrincipalName`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch SharePoint profile');
    }

    const data = (await response.json()) as GraphUserResponse;
    return {
      id: data.id ?? null,
      email: data.mail ?? data.userPrincipalName ?? null,
      displayName: data.displayName ?? null,
    };
  }

  private async fetchFollowedSites(
    accessToken: string,
    limit: number,
  ): Promise<SharePointSite[]> {
    const top = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      $top: String(top),
      $select: 'id,displayName,webUrl,description',
    });

    const response = await fetch(
      `${GRAPH_API_URL}/me/followedSites?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException(
          'SharePoint access was denied. Reconnect your SharePoint account or ask an admin to consent Sites.Read.All.',
        );
      }
      throw new BadRequestException(
        body || `SharePoint request failed (${response.status})`,
      );
    }

    const data = (await response.json()) as GraphFollowedSitesResponse;
    return (data.value ?? []).slice(0, limit).map((site) => ({
      id: site.id,
      name: site.displayName?.trim() || site.name?.trim() || 'Untitled site',
      webUrl: site.webUrl ?? SHAREPOINT_HOME_URL,
      description: site.description?.trim() || null,
    }));
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
        'SharePoint session expired. Please reconnect.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.sharePointConnection.update({
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
  ): Promise<SharePointTokenResponse> {
    const clientId = this.configService.get<string>('SHAREPOINT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SHAREPOINT_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      throw new BadRequestException('SharePoint is not configured');
    }

    const response = await fetch(SHAREPOINT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Failed to refresh SharePoint token. Please reconnect.',
      );
    }

    return response.json() as Promise<SharePointTokenResponse>;
  }
}
