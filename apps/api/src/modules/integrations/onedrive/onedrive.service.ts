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
import { UpdateOneDrivePreferencesDto } from './dto/update-onedrive-preferences.dto';
import {
  DEFAULT_ONEDRIVE_PREFERENCES,
  OneDriveFile,
  OneDrivePreferences,
} from './types/onedrive-preferences.type';

const ONEDRIVE_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const ONEDRIVE_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
const DEFAULT_SCOPES = 'Files.Read User.Read offline_access';
const ONEDRIVE_HOME_URL = 'https://onedrive.live.com';

interface OneDriveTokenResponse {
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

interface GraphDriveItem {
  id: string;
  name?: string;
  size?: number;
  lastModifiedDateTime?: string;
  webUrl?: string;
  file?: {
    mimeType?: string;
  };
  folder?: Record<string, unknown>;
}

interface GraphDriveChildrenResponse {
  value?: GraphDriveItem[];
}

@Injectable()
export class OneDriveService {
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
    const connection = await this.prisma.oneDriveConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      onedriveEmail: connection?.onedriveEmail ?? null,
      onedriveDisplayName: connection?.onedriveDisplayName ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateOneDrivePreferencesDto,
  ) {
    const connection = await this.prisma.oneDriveConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('OneDrive account is not connected');
    }

    const preferences: OneDrivePreferences = {
      showFiles: dto.showFiles,
    };

    await this.prisma.oneDriveConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService
      .get<string>('ONEDRIVE_CLIENT_ID')
      ?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'OneDrive is not configured. Set ONEDRIVE_CLIENT_ID and ONEDRIVE_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('ONEDRIVE_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'ONEDRIVE_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('ONEDRIVE_SCOPES')?.trim() ||
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
      url: `${ONEDRIVE_AUTH_URL}?${params.toString()}`,
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

    await this.prisma.oneDriveConnection.upsert({
      where: { userId },
      create: {
        userId,
        onedriveAccountId: profile.id ?? null,
        onedriveEmail: profile.email,
        onedriveDisplayName: profile.displayName,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_ONEDRIVE_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        onedriveAccountId: profile.id ?? null,
        onedriveEmail: profile.email,
        onedriveDisplayName: profile.displayName,
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
            provider: IntegrationProvider.ONEDRIVE,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.ONEDRIVE,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.oneDriveConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.oneDriveConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.ONEDRIVE,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'OneDrive disconnected');
  }

  async getFiles(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.oneDriveConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        files: [] as OneDriveFile[],
      });
    }

    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'OneDrive session expired. Please reconnect your account.',
      );
    }

    const accessToken = await this.getValidAccessToken(connection);
    const files = await this.fetchFiles(accessToken, limit);

    await this.prisma.oneDriveConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      onedriveEmail: connection.onedriveEmail,
      files,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_ONEDRIVE_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showFiles:
        typeof raw.showFiles === 'boolean'
          ? raw.showFiles
          : DEFAULT_ONEDRIVE_PREFERENCES.showFiles,
    } satisfies OneDrivePreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'ONEDRIVE_REDIRECT_URI',
      callbackPath: '/api/integrations/onedrive/callback',
    });
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<OneDriveTokenResponse> {
    const clientId = this.configService.get<string>('ONEDRIVE_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'ONEDRIVE_CLIENT_SECRET',
    );
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('OneDrive is not configured');
    }

    const response = await fetch(ONEDRIVE_TOKEN_URL, {
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
        `Failed to exchange OneDrive authorization code: ${error}`,
      );
    }

    return response.json() as Promise<OneDriveTokenResponse>;
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
      throw new BadRequestException('Failed to fetch OneDrive profile');
    }

    const data = (await response.json()) as GraphUserResponse;
    return {
      id: data.id ?? null,
      email: data.mail ?? data.userPrincipalName ?? null,
      displayName: data.displayName ?? null,
    };
  }

  private async fetchFiles(
    accessToken: string,
    limit: number,
  ): Promise<OneDriveFile[]> {
    const top = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      $top: String(top),
      $orderby: 'lastModifiedDateTime desc',
      $select: 'id,name,size,file,folder,webUrl,lastModifiedDateTime',
    });

    const response = await fetch(
      `${GRAPH_API_URL}/me/drive/root/children?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException(
          'OneDrive access was denied. Reconnect your OneDrive account.',
        );
      }
      throw new BadRequestException(
        body || `OneDrive request failed (${response.status})`,
      );
    }

    const data = (await response.json()) as GraphDriveChildrenResponse;
    return (data.value ?? []).slice(0, limit).map((item) => {
      const isFolder = Boolean(item.folder);
      return {
        id: item.id,
        name: item.name?.trim() || 'Untitled',
        mimeType: isFolder
          ? 'application/vnd.onedrive.folder'
          : (item.file?.mimeType ?? 'application/octet-stream'),
        size: isFolder ? null : (item.size ?? null),
        modifiedAt: item.lastModifiedDateTime
          ? new Date(item.lastModifiedDateTime).toISOString()
          : new Date().toISOString(),
        webViewLink: item.webUrl ?? ONEDRIVE_HOME_URL,
        isFolder,
      };
    });
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
        'OneDrive session expired. Please reconnect.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.oneDriveConnection.update({
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
  ): Promise<OneDriveTokenResponse> {
    const clientId = this.configService.get<string>('ONEDRIVE_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'ONEDRIVE_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      throw new BadRequestException('OneDrive is not configured');
    }

    const response = await fetch(ONEDRIVE_TOKEN_URL, {
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
        'Failed to refresh OneDrive token. Please reconnect.',
      );
    }

    return response.json() as Promise<OneDriveTokenResponse>;
  }
}
