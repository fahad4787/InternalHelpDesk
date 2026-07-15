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
import { UpdateClickUpPreferencesDto } from './dto/update-clickup-preferences.dto';
import {
  ClickUpList,
  ClickUpListDetail,
  ClickUpProfile,
  ClickUpTask,
} from './types/clickup-list.type';
import {
  DEFAULT_CLICKUP_PREFERENCES,
  ClickUpPreferences,
} from './types/clickup-preferences.type';

const CLICKUP_AUTH_URL = 'https://app.clickup.com/api';
const CLICKUP_TOKEN_URL = 'https://api.clickup.com/api/v2/oauth/token';
const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

interface ClickUpTokenResponse {
  access_token: string;
  token_type?: string;
}

@Injectable()
export class ClickUpService {
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
    const connection = await this.prisma.clickUpConnection.findUnique({
      where: { userId: user.id },
    });

    const connected = connection?.status === IntegrationStatus.CONNECTED;

    return successResponse({
      connected,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      clickupEmail: connection?.clickupEmail ?? null,
      clickupUsername: connection?.clickupUsername ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateClickUpPreferencesDto,
  ) {
    const connection = await this.prisma.clickUpConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('ClickUp account is not connected');
    }

    const preferences: ClickUpPreferences = {
      showLists: dto.showLists,
    };

    await this.prisma.clickUpConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('CLICKUP_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'ClickUp is not configured. Set CLICKUP_CLIENT_ID and redirect URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('CLICKUP_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'CLICKUP_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });

    return successResponse({
      url: `${CLICKUP_AUTH_URL}?${params.toString()}`,
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

    await this.prisma.clickUpConnection.upsert({
      where: { userId },
      create: {
        userId,
        clickupUserId: profile.id,
        clickupEmail: profile.email,
        clickupUsername: profile.username,
        encryptedAccessToken: encryptedAccess,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_CLICKUP_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        clickupUserId: profile.id,
        clickupEmail: profile.email,
        clickupUsername: profile.username,
        encryptedAccessToken: encryptedAccess,
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
            provider: IntegrationProvider.CLICKUP,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.CLICKUP,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.clickUpConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.clickUpConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.CLICKUP,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'ClickUp disconnected');
  }

  async getLists(user: AuthenticatedUser) {
    const connection = await this.prisma.clickUpConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        lists: [] as ClickUpList[],
      });
    }

    const accessToken = this.getAccessToken(connection);
    const lists = await this.fetchLists(accessToken);
    await this.touchLastSynced(user.id);

    return successResponse({
      connected: true,
      lists,
    });
  }

  async getListDetail(user: AuthenticatedUser, listId: string) {
    const connection = await this.prisma.clickUpConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('ClickUp account is not connected');
    }

    const accessToken = this.getAccessToken(connection);
    const detail = await this.fetchListDetail(accessToken, listId);
    await this.touchLastSynced(user.id);

    return successResponse({
      connected: true,
      ...detail,
    });
  }

  private resolvePreferences(value: unknown): ClickUpPreferences {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_CLICKUP_PREFERENCES };
    }
    const prefs = value as Record<string, unknown>;
    return {
      showLists:
        typeof prefs.showLists === 'boolean'
          ? prefs.showLists
          : DEFAULT_CLICKUP_PREFERENCES.showLists,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'CLICKUP_REDIRECT_URI',
      callbackPath: '/api/integrations/clickup/callback',
    });
  }

  private async touchLastSynced(userId: string) {
    await this.prisma.clickUpConnection.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });
  }

  private getAccessToken(connection: {
    encryptedAccessToken: string | null;
  }): string {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'ClickUp session expired. Please reconnect.',
      );
    }
    return decrypt(connection.encryptedAccessToken, this.encryptionKey);
  }

  private async clickupFetch(
    url: string,
    init?: RequestInit,
  ): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Network request failed';
      throw new BadRequestException(
        `ClickUp API request failed (${message}). Check your internet connection and try again.`,
      );
    }
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<ClickUpTokenResponse> {
    const clientId = this.configService.get<string>('CLICKUP_CLIENT_ID')?.trim();
    const clientSecret = this.configService
      .get<string>('CLICKUP_CLIENT_SECRET')
      ?.trim();

    const params = new URLSearchParams({
      client_id: clientId ?? '',
      client_secret: clientSecret ?? '',
      code,
    });

    const response = await this.clickupFetch(
      `${CLICKUP_TOKEN_URL}?${params.toString()}`,
      { method: 'POST' },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `ClickUp token exchange failed: ${error}`,
      );
    }

    return response.json() as Promise<ClickUpTokenResponse>;
  }

  private async apiGet<T>(accessToken: string, path: string): Promise<T> {
    const response = await this.clickupFetch(`${CLICKUP_API_BASE}${path}`, {
      headers: {
        Authorization: accessToken.startsWith('pk_')
          ? accessToken
          : `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`ClickUp API error: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  private async fetchProfile(accessToken: string): Promise<ClickUpProfile> {
    const data = await this.apiGet<{
      user?: {
        id?: number | string;
        username?: string;
        email?: string;
      };
    }>(accessToken, '/user');

    return {
      id: data.user?.id != null ? String(data.user.id) : null,
      username: data.user?.username ?? null,
      email: data.user?.email ?? null,
    };
  }

  private async fetchLists(accessToken: string): Promise<ClickUpList[]> {
    const teamsData = await this.apiGet<{
      teams?: Array<{ id?: string; name?: string }>;
    }>(accessToken, '/team');

    const lists: ClickUpList[] = [];

    for (const team of teamsData.teams ?? []) {
      if (!team.id) continue;
      const spacesData = await this.apiGet<{
        spaces?: Array<{ id?: string; name?: string }>;
      }>(accessToken, `/team/${team.id}/space?archived=false`);

      for (const space of spacesData.spaces ?? []) {
        if (!space.id) continue;

        const folderless = await this.apiGet<{
          lists?: Array<{
            id?: string;
            name?: string;
            task_count?: number | string;
          }>;
        }>(accessToken, `/space/${space.id}/list?archived=false`);

        for (const list of folderless.lists ?? []) {
          if (!list.id) continue;
          lists.push({
            id: String(list.id),
            name: list.name ?? 'Untitled list',
            taskCount:
              list.task_count != null ? Number(list.task_count) : null,
            spaceName: space.name ?? null,
            folderName: null,
            teamName: team.name ?? null,
          });
        }

        const foldersData = await this.apiGet<{
          folders?: Array<{
            id?: string;
            name?: string;
            lists?: Array<{
              id?: string;
              name?: string;
              task_count?: number | string;
            }>;
          }>;
        }>(accessToken, `/space/${space.id}/folder?archived=false`);

        for (const folder of foldersData.folders ?? []) {
          for (const list of folder.lists ?? []) {
            if (!list.id) continue;
            lists.push({
              id: String(list.id),
              name: list.name ?? 'Untitled list',
              taskCount:
                list.task_count != null ? Number(list.task_count) : null,
              spaceName: space.name ?? null,
              folderName: folder.name ?? null,
              teamName: team.name ?? null,
            });
          }
        }
      }
    }

    return lists.slice(0, 100);
  }

  private async fetchListDetail(
    accessToken: string,
    listId: string,
  ): Promise<ClickUpListDetail> {
    const listData = await this.apiGet<{
      id?: string;
      name?: string;
      task_count?: number | string;
      space?: { id?: string; name?: string };
      folder?: { id?: string; name?: string; hidden?: boolean };
    }>(accessToken, `/list/${listId}`);

    const tasksData = await this.apiGet<{
      tasks?: Array<{
        id?: string;
        name?: string;
        status?: { status?: string };
        due_date?: string | null;
        url?: string;
        assignees?: Array<{ username?: string; email?: string }>;
      }>;
    }>(accessToken, `/list/${listId}/task?archived=false&include_closed=false`);

    const list: ClickUpList = {
      id: String(listData.id ?? listId),
      name: listData.name ?? 'Untitled list',
      taskCount:
        listData.task_count != null ? Number(listData.task_count) : null,
      spaceName: listData.space?.name ?? null,
      folderName: listData.folder?.hidden ? null : listData.folder?.name ?? null,
      teamName: null,
    };

    const tasks: ClickUpTask[] = (tasksData.tasks ?? []).map((task) => ({
      id: String(task.id ?? ''),
      name: task.name ?? 'Untitled task',
      status: task.status?.status ?? null,
      dueDate: task.due_date
        ? new Date(Number(task.due_date)).toISOString()
        : null,
      url: task.url ?? null,
      assignees: (task.assignees ?? [])
        .map((a) => a.username || a.email)
        .filter((v): v is string => Boolean(v)),
    }));

    return { list, tasks };
  }
}
