import {
  BadRequestException,
  Injectable,
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
import { ConnectTrelloDto } from './dto/connect-trello.dto';
import { UpdateTrelloPreferencesDto } from './dto/update-trello-preferences.dto';
import {
  DEFAULT_TRELLO_PREFERENCES,
  TrelloPreferences,
} from './types/trello-preferences.type';
import {
  TrelloBoard,
  TrelloBoardDetail,
  TrelloCardSummary,
  TrelloListWithCards,
} from './types/trello-board.type';

const TRELLO_API_BASE = 'https://api.trello.com/1';
const TRELLO_AUTHORIZE_URL = 'https://trello.com/1/authorize';

interface TrelloMemberResponse {
  id?: string;
  username?: string;
  fullName?: string;
  email?: string;
  url?: string;
  avatarUrl?: string | null;
}

interface TrelloBoardResponse {
  id: string;
  name: string;
  desc?: string;
  url?: string;
  closed?: boolean;
  dateLastActivity?: string;
}

interface TrelloListResponse {
  id: string;
  name: string;
  closed?: boolean;
  pos?: number;
}

interface TrelloScaledCover {
  url?: string;
  width?: number;
  height?: number;
}

interface TrelloCardResponse {
  id: string;
  name: string;
  desc?: string;
  url?: string;
  idList?: string;
  due?: string | null;
  closed?: boolean;
  dateLastActivity?: string;
  cover?: {
    scaled?: TrelloScaledCover[];
  } | null;
}

@Injectable()
export class TrelloService {
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

  private getApiKey(): string {
    const apiKey = this.configService.get<string>('TRELLO_API_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException(
        'Trello is not configured. Set TRELLO_API_KEY in the server environment.',
      );
    }
    return apiKey;
  }

  private getReturnUrl(): string {
    const configured = this.configService.get<string>('TRELLO_RETURN_URL')?.trim();
    if (configured) return configured;

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://127.0.0.1:3000',
    );
    return `${frontendUrl.replace(/\/$/, '')}/integrations/trello`;
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.trelloConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      trelloEmail: connection?.trelloEmail ?? null,
      trelloUsername: connection?.trelloUsername ?? null,
      trelloFullName: connection?.trelloFullName ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateTrelloPreferencesDto,
  ) {
    const connection = await this.prisma.trelloConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Trello account is not connected');
    }

    const preferences: TrelloPreferences = {
      showBoards: dto.showBoards,
    };

    await this.prisma.trelloConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const apiKey = this.getApiKey();
    const state = createOAuthState(user.id, this.jwtSecret);
    const returnUrl = new URL(this.getReturnUrl());
    returnUrl.searchParams.set('state', state);

    const appName =
      this.configService.get<string>('TRELLO_APP_NAME')?.trim() || 'Workhub';
    const expiration =
      this.configService.get<string>('TRELLO_TOKEN_EXPIRATION')?.trim() ||
      '30days';
    const scope =
      this.configService.get<string>('TRELLO_SCOPES')?.trim() || 'read,account';

    const params = new URLSearchParams({
      expiration,
      name: appName,
      scope,
      response_type: 'token',
      key: apiKey,
      return_url: returnUrl.toString(),
      callback_method: 'fragment',
    });

    return successResponse({
      url: `${TRELLO_AUTHORIZE_URL}?${params.toString()}`,
    });
  }

  async connectWithToken(user: AuthenticatedUser, dto: ConnectTrelloDto) {
    const stateUserId = verifyOAuthState(dto.state, this.jwtSecret);
    if (!stateUserId || stateUserId !== user.id) {
      throw new BadRequestException('Invalid or expired Trello auth state');
    }

    const apiKey = this.getApiKey();
    const token = dto.token.trim();
    const member = await this.fetchMember(apiKey, token);
    const encryptedAccess = encrypt(token, this.encryptionKey);

    await this.prisma.trelloConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        trelloMemberId: member.id ?? null,
        trelloUsername: member.username ?? null,
        trelloFullName: member.fullName ?? null,
        trelloEmail: member.email ?? null,
        encryptedAccessToken: encryptedAccess,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_TRELLO_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        trelloMemberId: member.id ?? null,
        trelloUsername: member.username ?? null,
        trelloFullName: member.fullName ?? null,
        trelloEmail: member.email ?? null,
        encryptedAccessToken: encryptedAccess,
        status: IntegrationStatus.CONNECTED,
        lastSyncedAt: new Date(),
      },
    });

    await this.prisma.integration.upsert({
      where: {
        companyId_provider: {
          companyId: user.companyId,
          provider: IntegrationProvider.TRELLO,
        },
      },
      create: {
        companyId: user.companyId,
        provider: IntegrationProvider.TRELLO,
        status: IntegrationStatus.CONNECTED,
      },
      update: { status: IntegrationStatus.CONNECTED },
    });

    return successResponse(
      {
        connected: true,
        trelloEmail: member.email ?? null,
        trelloUsername: member.username ?? null,
        trelloFullName: member.fullName ?? null,
      },
      'Trello connected',
    );
  }

  async disconnect(user: AuthenticatedUser) {
    const connection = await this.prisma.trelloConnection.findUnique({
      where: { userId: user.id },
    });

    if (connection?.encryptedAccessToken) {
      try {
        const apiKey = this.getApiKey();
        const token = decrypt(connection.encryptedAccessToken, this.encryptionKey);
        await this.revokeToken(apiKey, token);
      } catch {
        // Continue disconnecting even if token revoke fails.
      }
    }

    await this.prisma.trelloConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.trelloConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.TRELLO,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Trello disconnected');
  }

  async getBoards(user: AuthenticatedUser) {
    const connection = await this.requireConnection(user);
    const { apiKey, token } = this.getCredentials(connection);

    const boards = await this.trelloFetch<TrelloBoardResponse[]>(
      `/members/me/boards?fields=id,name,desc,url,closed,dateLastActivity&filter=open`,
      apiKey,
      token,
    );

    const mapped: TrelloBoard[] = (boards ?? []).map((board) => ({
      id: board.id,
      name: board.name,
      description: board.desc?.trim() ? board.desc : null,
      url: board.url ?? null,
      closed: board.closed === true,
      lastActivityAt: board.dateLastActivity ?? null,
    }));

    await this.prisma.trelloConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      boards: mapped,
    });
  }

  async getBoardDetail(user: AuthenticatedUser, boardId: string) {
    const connection = await this.requireConnection(user);
    const { apiKey, token } = this.getCredentials(connection);
    const safeBoardId = boardId.trim();

    if (!/^[a-zA-Z0-9]+$/.test(safeBoardId)) {
      throw new BadRequestException('Invalid Trello board id');
    }

    const board = await this.trelloFetch<TrelloBoardResponse>(
      `/boards/${safeBoardId}?fields=id,name,url,closed`,
      apiKey,
      token,
    );

    if (!board?.id || board.closed) {
      throw new BadRequestException('Board not found or closed');
    }

    const [lists, cards] = await Promise.all([
      this.trelloFetch<TrelloListResponse[]>(
        `/boards/${safeBoardId}/lists?fields=id,name,closed,pos&filter=open`,
        apiKey,
        token,
      ),
      this.trelloFetch<TrelloCardResponse[]>(
        `/boards/${safeBoardId}/cards?fields=id,name,desc,url,idList,due,closed,dateLastActivity,cover&filter=open`,
        apiKey,
        token,
      ),
    ]);

    const cardsByList = new Map<string, TrelloCardSummary[]>();
    for (const card of cards ?? []) {
      if (!card.idList || card.closed) continue;
      const parsed = this.parseDescription(card.desc ?? null);
      const coverUrl =
        this.pickCoverUrl(card.cover?.scaled) ?? parsed.imageUrls[0] ?? null;
      const summary: TrelloCardSummary = {
        id: card.id,
        name: card.name,
        description: card.desc?.trim() ? card.desc : null,
        descriptionText: parsed.text,
        imageUrls: parsed.imageUrls,
        coverUrl,
        url: card.url ?? null,
        dueAt: card.due ?? null,
        lastActivityAt: card.dateLastActivity ?? null,
      };
      const existing = cardsByList.get(card.idList) ?? [];
      existing.push(summary);
      cardsByList.set(card.idList, existing);
    }

    const mappedLists: TrelloListWithCards[] = (lists ?? [])
      .filter((list) => !list.closed)
      .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
      .map((list) => ({
        id: list.id,
        name: list.name,
        cards: cardsByList.get(list.id) ?? [],
      }));

    const detail: TrelloBoardDetail = {
      id: board.id,
      name: board.name,
      url: board.url ?? null,
      lists: mappedLists,
    };

    await this.prisma.trelloConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      board: detail,
    });
  }

  async fetchMedia(user: AuthenticatedUser, rawUrl: string) {
    const connection = await this.requireConnection(user);
    const { apiKey, token } = this.getCredentials(connection);

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid media URL');
    }

    if (!this.isAllowedMediaHost(parsed.hostname)) {
      throw new BadRequestException('Media host is not allowed');
    }

    let fetchUrl = rawUrl;
    if (
      parsed.hostname === 'trello.com' ||
      parsed.hostname.endsWith('.trello.com')
    ) {
      parsed.searchParams.set('key', apiKey);
      parsed.searchParams.set('token', token);
      fetchUrl = parsed.toString();
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new BadRequestException('Unable to load Trello media');
    }

    const contentType =
      response.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType };
  }

  private isAllowedMediaHost(hostname: string) {
    const host = hostname.toLowerCase();
    return (
      host === 'trello.com' ||
      host.endsWith('.trello.com') ||
      host === 'trello-attachments.s3.amazonaws.com' ||
      host.endsWith('.amazonaws.com') ||
      host.endsWith('.trello.services')
    );
  }

  private parseDescription(description: string | null) {
    if (!description?.trim()) {
      return { text: null as string | null, imageUrls: [] as string[] };
    }

    const imageUrls: string[] = [];
    const text = description
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, _alt, url: string) => {
        const cleaned = url.trim();
        if (cleaned) imageUrls.push(cleaned);
        return '';
      })
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      text: text || null,
      imageUrls,
    };
  }

  private pickCoverUrl(scaled?: TrelloScaledCover[] | null) {
    if (!scaled?.length) return null;
    const sorted = [...scaled].sort(
      (a, b) => (b.width ?? 0) - (a.width ?? 0),
    );
    return sorted.find((item) => item.url)?.url ?? null;
  }

  private async requireConnection(user: AuthenticatedUser) {
    const connection = await this.prisma.trelloConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Trello account is not connected');
    }

    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Trello token is missing. Please reconnect your account.',
      );
    }

    return connection;
  }

  private getCredentials(connection: {
    encryptedAccessToken: string | null;
  }) {
    const apiKey = this.getApiKey();
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Trello token is missing. Please reconnect your account.',
      );
    }
    return {
      apiKey,
      token: decrypt(connection.encryptedAccessToken, this.encryptionKey),
    };
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_TRELLO_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showBoards:
        typeof raw.showBoards === 'boolean'
          ? raw.showBoards
          : DEFAULT_TRELLO_PREFERENCES.showBoards,
    } satisfies TrelloPreferences;
  }

  private async fetchMember(apiKey: string, token: string) {
    return this.trelloFetch<TrelloMemberResponse>(
      '/members/me?fields=id,username,fullName,email,url,avatarUrl',
      apiKey,
      token,
    );
  }

  private async revokeToken(apiKey: string, token: string) {
    await this.trelloFetch(`/tokens/${encodeURIComponent(token)}`, apiKey, token, {
      method: 'DELETE',
    });
  }

  private async trelloFetch<T>(
    path: string,
    apiKey: string,
    token: string,
    init?: RequestInit,
  ): Promise<T> {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${TRELLO_API_BASE}${path}${separator}key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException(
          'Trello access was denied. Reconnect your Trello account.',
        );
      }
      throw new BadRequestException(
        body || `Trello request failed (${response.status})`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
