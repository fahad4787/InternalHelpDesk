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
import { UpdateDropboxPreferencesDto } from './dto/update-dropbox-preferences.dto';
import {
  DEFAULT_DROPBOX_PREFERENCES,
  DropboxFile,
  DropboxPreferences,
} from './types/dropbox-preferences.type';

const DROPBOX_AUTH_URL = 'https://www.dropbox.com/oauth2/authorize';
const DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const DROPBOX_API_BASE = 'https://api.dropboxapi.com/2';

interface DropboxTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  account_id?: string;
  uid?: string;
}

interface DropboxAccount {
  account_id?: string;
  name?: {
    display_name?: string;
    given_name?: string;
    surname?: string;
  };
  email?: string;
}

interface DropboxListEntry {
  '.tag': 'file' | 'folder' | 'deleted';
  id?: string;
  name?: string;
  path_display?: string;
  size?: number;
  server_modified?: string;
  client_modified?: string;
}

@Injectable()
export class DropboxService {
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
    const connection = await this.prisma.dropboxConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      dropboxEmail: connection?.dropboxEmail ?? null,
      dropboxDisplayName: connection?.dropboxDisplayName ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateDropboxPreferencesDto,
  ) {
    const connection = await this.prisma.dropboxConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Dropbox account is not connected');
    }

    const preferences: DropboxPreferences = {
      showFiles: dto.showFiles,
    };

    await this.prisma.dropboxConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('DROPBOX_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Dropbox is not configured. Set DROPBOX_CLIENT_ID and DROPBOX_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('DROPBOX_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'DROPBOX_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
      token_access_type: 'offline',
    });

    const scopes = this.configService.get<string>('DROPBOX_SCOPES')?.trim();
    if (scopes) {
      params.set('scope', scopes);
    }

    return successResponse({
      url: `${DROPBOX_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const account = await this.fetchCurrentAccount(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;
    const expiresIn = tokens.expires_in ?? 14_400;

    await this.prisma.dropboxConnection.upsert({
      where: { userId },
      create: {
        userId,
        dropboxAccountId: account.account_id ?? tokens.account_id ?? null,
        dropboxEmail: account.email ?? null,
        dropboxDisplayName:
          account.name?.display_name?.trim() ||
          [account.name?.given_name, account.name?.surname]
            .filter(Boolean)
            .join(' ') ||
          null,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_DROPBOX_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        dropboxAccountId: account.account_id ?? tokens.account_id ?? null,
        dropboxEmail: account.email ?? null,
        dropboxDisplayName:
          account.name?.display_name?.trim() ||
          [account.name?.given_name, account.name?.surname]
            .filter(Boolean)
            .join(' ') ||
          null,
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
            provider: IntegrationProvider.DROPBOX,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.DROPBOX,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.dropboxConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.dropboxConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.DROPBOX,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Dropbox disconnected');
  }

  async getFiles(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.dropboxConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        files: [] as DropboxFile[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const files = await this.fetchFiles(accessToken, limit);

    await this.prisma.dropboxConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      dropboxEmail: connection.dropboxEmail,
      files,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_DROPBOX_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showFiles:
        typeof raw.showFiles === 'boolean'
          ? raw.showFiles
          : DEFAULT_DROPBOX_PREFERENCES.showFiles,
    } satisfies DropboxPreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'DROPBOX_REDIRECT_URI',
      callbackPath: '/api/integrations/dropbox/callback',
    });
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = this.configService.get<string>('DROPBOX_CLIENT_ID');
    const clientSecret = this.configService.get<string>('DROPBOX_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    const response = await fetch(DROPBOX_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || 'Failed to exchange Dropbox authorization code',
      );
    }

    return (await response.json()) as DropboxTokenResponse;
  }

  private async refreshAccessToken(refreshToken: string) {
    const clientId = this.configService.get<string>('DROPBOX_CLIENT_ID');
    const clientSecret = this.configService.get<string>('DROPBOX_CLIENT_SECRET');

    const response = await fetch(DROPBOX_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new UnauthorizedException(
        body || 'Failed to refresh Dropbox access token. Please reconnect.',
      );
    }

    return (await response.json()) as DropboxTokenResponse;
  }

  private async getValidAccessToken(connection: {
    userId: string;
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
  }) {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Dropbox token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new UnauthorizedException(
        'Dropbox session expired. Please reconnect your account.',
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
    const expiresIn = tokens.expires_in ?? 14_400;

    await this.prisma.dropboxConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    return tokens.access_token;
  }

  private async fetchCurrentAccount(accessToken: string) {
    return this.dropboxFetch<DropboxAccount>(
      `${DROPBOX_API_BASE}/users/get_current_account`,
      accessToken,
      { method: 'POST', body: 'null' },
    );
  }

  private async fetchFiles(
    accessToken: string,
    limit: number,
  ): Promise<DropboxFile[]> {
    const payload = await this.dropboxFetch<{ entries?: DropboxListEntry[] }>(
      `${DROPBOX_API_BASE}/files/list_folder`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          path: '',
          recursive: false,
          include_media_info: false,
          include_deleted: false,
          limit: Math.min(Math.max(limit, 1), 50),
        }),
      },
    );

    return (payload.entries ?? [])
      .filter((entry) => entry['.tag'] === 'file' || entry['.tag'] === 'folder')
      .slice(0, limit)
      .map((entry) => {
        const isFolder = entry['.tag'] === 'folder';
        const path = entry.path_display ?? `/${entry.name ?? ''}`;
        return {
          id: entry.id ?? path,
          name: entry.name ?? 'Untitled',
          mimeType: isFolder
            ? 'application/vnd.dropbox.folder'
            : this.guessMimeType(entry.name ?? ''),
          size: isFolder ? null : (entry.size ?? null),
          modifiedAt:
            entry.server_modified ??
            entry.client_modified ??
            new Date().toISOString(),
          webViewLink: `https://www.dropbox.com/home${encodeURI(path)}`,
          isFolder,
        };
      });
  }

  private guessMimeType(name: string): string {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      return 'application/msword';
    }
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
      return 'application/vnd.ms-excel';
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return 'image/*';
    }
    return 'application/octet-stream';
  }

  private async dropboxFetch<T>(
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
        throw new UnauthorizedException(
          'Dropbox access was denied. Reconnect your Dropbox account.',
        );
      }
      throw new BadRequestException(
        body || `Dropbox request failed (${response.status})`,
      );
    }

    return (await response.json()) as T;
  }
}
