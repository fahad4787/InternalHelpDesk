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
import { UpdateMondayPreferencesDto } from './dto/update-monday-preferences.dto';
import {
  MondayBoard,
  MondayBoardDetail,
  MondayItem,
  MondayProfile,
} from './types/monday-board.type';
import {
  DEFAULT_MONDAY_PREFERENCES,
  MondayPreferences,
} from './types/monday-preferences.type';

const MONDAY_AUTH_URL = 'https://auth.monday.com/oauth2/authorize';
const MONDAY_TOKEN_URL = 'https://auth.monday.com/oauth2/token';
const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_API_VERSION = '2024-10';

interface MondayTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface MondayGraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

@Injectable()
export class MondayService {
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
    const connection = await this.prisma.mondayConnection.findUnique({
      where: { userId: user.id },
    });

    const connected = connection?.status === IntegrationStatus.CONNECTED;

    return successResponse({
      connected,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      mondayEmail: connection?.mondayEmail ?? null,
      mondayName: connection?.mondayName ?? null,
      mondayAccountName: connection?.mondayAccountName ?? null,
      mondayAccountSlug: connection?.mondayAccountSlug ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateMondayPreferencesDto,
  ) {
    const connection = await this.prisma.mondayConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Monday.com account is not connected');
    }

    const preferences: MondayPreferences = {
      showBoards: dto.showBoards,
    };

    await this.prisma.mondayConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('MONDAY_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Monday.com is not configured. Set MONDAY_CLIENT_ID and redirect URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('MONDAY_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'MONDAY_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('MONDAY_SCOPES')?.trim() ||
      'me:read boards:read account:read';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: scopes,
    });

    return successResponse({
      url: `${MONDAY_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchProfile(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.mondayConnection.upsert({
      where: { userId },
      create: {
        userId,
        mondayUserId: profile.id,
        mondayEmail: profile.email,
        mondayName: profile.name,
        mondayAccountSlug: profile.accountSlug,
        mondayAccountName: profile.accountName,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_MONDAY_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        mondayUserId: profile.id,
        mondayEmail: profile.email,
        mondayName: profile.name,
        mondayAccountSlug: profile.accountSlug,
        mondayAccountName: profile.accountName,
        encryptedAccessToken: encryptedAccess,
        ...(encryptedRefresh
          ? { encryptedRefreshToken: encryptedRefresh }
          : {}),
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
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
            provider: IntegrationProvider.MONDAY,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.MONDAY,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.mondayConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.mondayConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.MONDAY,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Monday.com disconnected');
  }

  async getBoards(user: AuthenticatedUser) {
    const connection = await this.prisma.mondayConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        boards: [] as MondayBoard[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const boards = await this.fetchBoards(accessToken);
    await this.touchLastSynced(user.id);

    return successResponse({
      connected: true,
      boards,
    });
  }

  async getBoardDetail(user: AuthenticatedUser, boardId: string) {
    const connection = await this.prisma.mondayConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Monday.com account is not connected');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const detail = await this.fetchBoardDetail(accessToken, boardId);
    await this.touchLastSynced(user.id);

    return successResponse({
      connected: true,
      ...detail,
    });
  }

  private resolvePreferences(value: unknown): MondayPreferences {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_MONDAY_PREFERENCES };
    }
    const prefs = value as Record<string, unknown>;
    return {
      showBoards:
        typeof prefs.showBoards === 'boolean'
          ? prefs.showBoards
          : DEFAULT_MONDAY_PREFERENCES.showBoards,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'MONDAY_REDIRECT_URI',
      callbackPath: '/api/integrations/monday/callback',
    });
  }

  private async touchLastSynced(userId: string) {
    await this.prisma.mondayConnection.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });
  }

  private async mondayFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Network request failed';
      throw new BadRequestException(
        `Monday.com API request failed (${message}). Check your internet connection and try again.`,
      );
    }
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<MondayTokenResponse> {
    const clientId = this.configService.get<string>('MONDAY_CLIENT_ID')?.trim();
    const clientSecret = this.configService
      .get<string>('MONDAY_CLIENT_SECRET')
      ?.trim();
    const redirectUri = this.getRedirectUri();

    const response = await this.mondayFetch(MONDAY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Monday.com token exchange failed: ${error}`,
      );
    }

    return response.json() as Promise<MondayTokenResponse>;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<MondayTokenResponse> {
    const clientId = this.configService.get<string>('MONDAY_CLIENT_ID')?.trim();
    const clientSecret = this.configService
      .get<string>('MONDAY_CLIENT_SECRET')
      ?.trim();

    const response = await this.mondayFetch(MONDAY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        error || 'Failed to refresh Monday.com access token. Please reconnect.',
      );
    }

    return response.json() as Promise<MondayTokenResponse>;
  }

  private async getValidAccessToken(connection: {
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
    userId: string;
  }): Promise<string> {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Monday.com session expired. Please reconnect.',
      );
    }

    const expiresSoon =
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt.getTime() < Date.now() + 60_000;

    if (!expiresSoon) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'Monday.com session expired. Please reconnect.',
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

    await this.prisma.mondayConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
    });

    return tokens.access_token;
  }

  private async graphql<T>(
    accessToken: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.mondayFetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json',
        'API-Version': MONDAY_API_VERSION,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Monday.com API error: ${error}`);
    }

    const payload = (await response.json()) as MondayGraphqlResponse<T>;
    if (payload.errors?.length) {
      throw new BadRequestException(
        payload.errors[0]?.message || 'Monday.com GraphQL request failed',
      );
    }

    if (!payload.data) {
      throw new BadRequestException('Monday.com returned an empty response');
    }

    return payload.data;
  }

  private async fetchProfile(accessToken: string): Promise<MondayProfile> {
    const data = await this.graphql<{
      me?: {
        id?: string | number;
        name?: string;
        email?: string;
        account?: { name?: string; slug?: string };
      };
    }>(
      accessToken,
      `query {
        me {
          id
          name
          email
          account {
            name
            slug
          }
        }
      }`,
    );

    return {
      id: data.me?.id != null ? String(data.me.id) : null,
      name: data.me?.name ?? null,
      email: data.me?.email ?? null,
      accountName: data.me?.account?.name ?? null,
      accountSlug: data.me?.account?.slug ?? null,
    };
  }

  private async fetchBoards(accessToken: string): Promise<MondayBoard[]> {
    const data = await this.graphql<{
      boards?: Array<{
        id?: string | number;
        name?: string;
        description?: string | null;
        board_kind?: string | null;
        items_count?: number | null;
        updated_at?: string | null;
        url?: string | null;
      }>;
    }>(
      accessToken,
      `query {
        boards(limit: 50, state: active) {
          id
          name
          description
          board_kind
          items_count
          updated_at
          url
        }
      }`,
    );

    return (data.boards ?? []).map((board) => ({
      id: String(board.id ?? ''),
      name: board.name ?? 'Untitled board',
      description: board.description ?? null,
      boardKind: board.board_kind ?? null,
      itemsCount: board.items_count ?? 0,
      updatedAt: board.updated_at ?? null,
      permalinkUrl: board.url ?? null,
    }));
  }

  private async fetchBoardDetail(
    accessToken: string,
    boardId: string,
  ): Promise<MondayBoardDetail> {
    const data = await this.graphql<{
      boards?: Array<{
        id?: string | number;
        name?: string;
        description?: string | null;
        board_kind?: string | null;
        items_count?: number | null;
        updated_at?: string | null;
        url?: string | null;
        items_page?: {
          items?: Array<{
            id?: string | number;
            name?: string;
            state?: string | null;
            updated_at?: string | null;
            url?: string | null;
            column_values?: Array<{
              id?: string;
              text?: string | null;
              type?: string | null;
              column?: { title?: string | null };
            }>;
          }>;
        };
      }>;
    }>(
      accessToken,
      `query ($boardIds: [ID!]) {
        boards(ids: $boardIds) {
          id
          name
          description
          board_kind
          items_count
          updated_at
          url
          items_page(limit: 40) {
            items {
              id
              name
              state
              updated_at
              url
              column_values {
                id
                text
                type
                column {
                  title
                }
              }
            }
          }
        }
      }`,
      { boardIds: [boardId] },
    );

    const raw = data.boards?.[0];
    if (!raw) {
      throw new BadRequestException('Monday.com board not found');
    }

    const board: MondayBoard = {
      id: String(raw.id ?? boardId),
      name: raw.name ?? 'Untitled board',
      description: raw.description ?? null,
      boardKind: raw.board_kind ?? null,
      itemsCount: raw.items_count ?? 0,
      updatedAt: raw.updated_at ?? null,
      permalinkUrl: raw.url ?? null,
    };

    const items: MondayItem[] = (raw.items_page?.items ?? []).map((item) => {
      const statusColumn = item.column_values?.find(
        (col) =>
          col.type === 'status' ||
          col.column?.title?.toLowerCase() === 'status',
      );
      return {
        id: String(item.id ?? ''),
        name: item.name ?? 'Untitled item',
        state: item.state ?? null,
        updatedAt: item.updated_at ?? null,
        permalinkUrl: item.url ?? null,
        statusText: statusColumn?.text ?? null,
      };
    });

    return { board, items };
  }
}
