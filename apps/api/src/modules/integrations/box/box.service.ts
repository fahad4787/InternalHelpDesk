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
import { UpdateBoxPreferencesDto } from './dto/update-box-preferences.dto';
import {
  DEFAULT_BOX_PREFERENCES,
  BoxFile,
  BoxPreferences,
} from './types/box-preferences.type';

const BOX_AUTH_URL = 'https://account.box.com/api/oauth2/authorize';
const BOX_TOKEN_URL = 'https://api.box.com/oauth2/token';
const BOX_API_BASE = 'https://api.box.com/2.0';

interface BoxTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

interface BoxUser {
  id?: string;
  name?: string;
  login?: string;
}

interface BoxItemEntry {
  type?: 'file' | 'folder' | 'web_link';
  id?: string;
  name?: string;
  size?: number;
  modified_at?: string;
  content_modified_at?: string;
}

@Injectable()
export class BoxService {
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
    const connection = await this.prisma.boxConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      boxEmail: connection?.boxEmail ?? null,
      boxDisplayName: connection?.boxDisplayName ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateBoxPreferencesDto,
  ) {
    const connection = await this.prisma.boxConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Box account is not connected');
    }

    const preferences: BoxPreferences = {
      showFiles: dto.showFiles,
    };

    await this.prisma.boxConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('BOX_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Box is not configured. Set BOX_CLIENT_ID and BOX_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('BOX_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'BOX_CLIENT_SECRET is missing. Add it to your server environment.',
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
      url: `${BOX_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const account = await this.fetchCurrentAccount(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;
    const expiresIn = tokens.expires_in ?? 3_600;

    await this.prisma.boxConnection.upsert({
      where: { userId },
      create: {
        userId,
        boxAccountId: account.id ?? null,
        boxEmail: account.login ?? null,
        boxDisplayName: account.name?.trim() || null,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_BOX_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        boxAccountId: account.id ?? null,
        boxEmail: account.login ?? null,
        boxDisplayName: account.name?.trim() || null,
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
            provider: IntegrationProvider.BOX,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.BOX,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.boxConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.boxConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.BOX,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Box disconnected');
  }

  async getFiles(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.boxConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        files: [] as BoxFile[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const files = await this.fetchFiles(accessToken, limit);

    await this.prisma.boxConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      boxEmail: connection.boxEmail,
      files,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_BOX_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showFiles:
        typeof raw.showFiles === 'boolean'
          ? raw.showFiles
          : DEFAULT_BOX_PREFERENCES.showFiles,
    } satisfies BoxPreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'BOX_REDIRECT_URI',
      callbackPath: '/api/integrations/box/callback',
    });
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = this.configService.get<string>('BOX_CLIENT_ID');
    const clientSecret = this.configService.get<string>('BOX_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    const response = await fetch(BOX_TOKEN_URL, {
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
        body || 'Failed to exchange Box authorization code',
      );
    }

    return (await response.json()) as BoxTokenResponse;
  }

  private async refreshAccessToken(refreshToken: string) {
    const clientId = this.configService.get<string>('BOX_CLIENT_ID');
    const clientSecret = this.configService.get<string>('BOX_CLIENT_SECRET');

    const response = await fetch(BOX_TOKEN_URL, {
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
      throw new BadRequestException(
        body || 'Failed to refresh Box access token. Please reconnect.',
      );
    }

    return (await response.json()) as BoxTokenResponse;
  }

  private async getValidAccessToken(connection: {
    userId: string;
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
  }) {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Box token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'Box session expired. Please reconnect your account.',
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
    const expiresIn = tokens.expires_in ?? 3_600;

    await this.prisma.boxConnection.update({
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
    return this.boxFetch<BoxUser>(
      `${BOX_API_BASE}/users/me?fields=id,name,login`,
      accessToken,
    );
  }

  private async fetchFiles(
    accessToken: string,
    limit: number,
  ): Promise<BoxFile[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      fields: 'id,name,type,size,modified_at,content_modified_at',
      limit: String(capped),
      sort: 'date',
      direction: 'DESC',
    });

    const payload = await this.boxFetch<{ entries?: BoxItemEntry[] }>(
      `${BOX_API_BASE}/folders/0/items?${params.toString()}`,
      accessToken,
    );

    return (payload.entries ?? [])
      .filter((entry) => entry.type === 'file' || entry.type === 'folder')
      .slice(0, limit)
      .map((entry) => {
        const isFolder = entry.type === 'folder';
        const id = entry.id ?? '';
        return {
          id,
          name: entry.name ?? 'Untitled',
          mimeType: isFolder
            ? 'application/vnd.box.folder'
            : this.guessMimeType(entry.name ?? ''),
          size: isFolder ? null : (entry.size ?? null),
          modifiedAt:
            entry.modified_at ??
            entry.content_modified_at ??
            new Date().toISOString(),
          webViewLink: isFolder
            ? `https://app.box.com/folder/${id}`
            : `https://app.box.com/file/${id}`,
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
    if (
      lower.endsWith('.xls') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.csv')
    ) {
      return 'application/vnd.ms-excel';
    }
    if (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg')
    ) {
      return 'image/*';
    }
    return 'application/octet-stream';
  }

  private async boxFetch<T>(
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
          'Box access was denied. Reconnect your Box account.',
        );
      }
      throw new BadRequestException(
        body || `Box request failed (${response.status})`,
      );
    }

    return (await response.json()) as T;
  }
}
