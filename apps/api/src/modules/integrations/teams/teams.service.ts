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
import { ensureTeamsConnectionTable } from './ensure-teams-connection-table';
import { UpdateTeamsPreferencesDto } from './dto/update-teams-preferences.dto';
import {
  DEFAULT_TEAMS_PREFERENCES,
  TeamsChat,
  TeamsPreferences,
  TeamsProfile,
  TeamsTeam,
} from './types/teams-preferences.type';

const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
const DEFAULT_SCOPES =
  'User.Read offline_access Team.ReadBasic.All Channel.ReadBasic.All Chat.Read ChannelMessage.Read.All';
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'ymail.com',
]);
const TEAMS_WORK_ACCOUNT_REQUIRED =
  'Teams and chats require a Microsoft 365 work or school account with a Teams license. Personal Microsoft accounts (for example Gmail, Outlook.com, or teams.live.com) can sign in, but Microsoft Graph cannot return their teams or chats.';

function isPersonalMicrosoftAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.trim().split('@')[1]?.toLowerCase();
  return Boolean(domain && PERSONAL_EMAIL_DOMAINS.has(domain));
}

function isGraphPersonalAccountError(body: string): boolean {
  const normalized = body.toLowerCase();
  return (
    normalized.includes('no authorization information present') ||
    normalized.includes('personal microsoft account') ||
    normalized.includes('failed to get license')
  );
}

interface TeamsTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GraphUserResponse {
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

interface GraphTeamItem {
  id: string;
  displayName?: string;
  description?: string;
  webUrl?: string;
}

interface GraphChatItem {
  id: string;
  topic?: string;
  chatType?: string;
  webUrl?: string;
  lastUpdatedDateTime?: string;
  lastMessagePreview?: {
    body?: { content?: string };
  };
  members?: Array<{
    displayName?: string;
    userId?: string;
  }>;
}

@Injectable()
export class TeamsService {
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
    await ensureTeamsConnectionTable(this.prisma);
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      teamsEmail: connection?.teamsEmail ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateTeamsPreferencesDto,
  ) {
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Microsoft Teams is not connected');
    }

    const preferences: TeamsPreferences = {
      showTeams: dto.showTeams,
      showChats: dto.showChats,
    };

    await this.prisma.teamsConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('TEAMS_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Teams is not configured. Set TEAMS_CLIENT_ID and TEAMS_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('TEAMS_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'TEAMS_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('TEAMS_SCOPES')?.trim() || DEFAULT_SCOPES;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes,
      state,
    });

    return successResponse({
      url: `${this.getAuthBaseUrl()}/authorize?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    await ensureTeamsConnectionTable(this.prisma);

    const tokens = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchTeamsProfile(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.teamsConnection.upsert({
      where: { userId },
      create: {
        userId,
        teamsEmail: profile.email,
        teamsUserId: null,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_TEAMS_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        teamsEmail: profile.email,
        teamsUserId: null,
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
            provider: IntegrationProvider.MICROSOFT_TEAMS,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.MICROSOFT_TEAMS,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.teamsConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.teamsConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.MICROSOFT_TEAMS,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Microsoft Teams disconnected');
  }

  async getTeams(user: AuthenticatedUser) {
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        teams: [] as TeamsTeam[],
      });
    }

    if (isPersonalMicrosoftAccount(connection.teamsEmail)) {
      throw new BadRequestException(TEAMS_WORK_ACCOUNT_REQUIRED);
    }

    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Teams session expired. Please reconnect your account.',
      );
    }

    const accessToken = await this.getValidAccessToken(connection);
    const teams = await this.fetchJoinedTeams(accessToken);

    await this.prisma.teamsConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      teams,
    });
  }

  async getChats(user: AuthenticatedUser, limit = 15) {
    await ensureTeamsConnectionTable(this.prisma);
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        chats: [] as TeamsChat[],
      });
    }

    if (isPersonalMicrosoftAccount(connection.teamsEmail)) {
      throw new BadRequestException(TEAMS_WORK_ACCOUNT_REQUIRED);
    }

    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Teams session expired. Please reconnect your account.',
      );
    }

    const accessToken = await this.getValidAccessToken(connection);
    const chats = await this.fetchChats(accessToken, limit);

    await this.prisma.teamsConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      chats,
    });
  }

  private resolvePreferences(prefs: unknown): TeamsPreferences {
    if (!prefs || typeof prefs !== 'object') {
      return DEFAULT_TEAMS_PREFERENCES;
    }

    const record = prefs as Record<string, unknown>;
    return {
      showTeams:
        typeof record.showTeams === 'boolean'
          ? record.showTeams
          : DEFAULT_TEAMS_PREFERENCES.showTeams,
      showChats:
        typeof record.showChats === 'boolean'
          ? record.showChats
          : DEFAULT_TEAMS_PREFERENCES.showChats,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'TEAMS_REDIRECT_URI',
      callbackPath: '/api/integrations/teams/callback',
    });
  }

  private getTenantId(): string {
    return (
      this.configService.get<string>('TEAMS_TENANT_ID')?.trim() || 'common'
    );
  }

  private getAuthBaseUrl(): string {
    return `https://login.microsoftonline.com/${this.getTenantId()}/oauth2/v2.0`;
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<TeamsTokenResponse> {
    const clientId = this.configService.get<string>('TEAMS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TEAMS_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Teams is not configured');
    }

    const response = await fetch(`${this.getAuthBaseUrl()}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to exchange Teams authorization code: ${error}`,
      );
    }

    return response.json() as Promise<TeamsTokenResponse>;
  }

  private async fetchTeamsProfile(accessToken: string): Promise<TeamsProfile> {
    const response = await fetch(
      `${GRAPH_API_URL}/me?$select=displayName,mail,userPrincipalName`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Teams profile');
    }

    const data = (await response.json()) as GraphUserResponse;
    return {
      email: data.mail ?? data.userPrincipalName ?? null,
      displayName: data.displayName ?? null,
    };
  }

  private async fetchJoinedTeams(accessToken: string): Promise<TeamsTeam[]> {
    const response = await fetch(
      `${GRAPH_API_URL}/me/joinedTeams?$select=id,displayName,description,webUrl`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      const error = await response.text();
      if (isGraphPersonalAccountError(error)) {
        throw new BadRequestException(TEAMS_WORK_ACCOUNT_REQUIRED);
      }
      throw new BadRequestException(`Failed to fetch Teams: ${error}`);
    }

    const data = (await response.json()) as { value?: GraphTeamItem[] };
    return (data.value ?? []).map((team) => ({
      id: team.id,
      displayName: team.displayName?.trim() || 'Untitled team',
      description: team.description?.trim() || null,
      webUrl: team.webUrl ?? null,
    }));
  }

  private async fetchChats(
    accessToken: string,
    limit: number,
  ): Promise<TeamsChat[]> {
    const params = new URLSearchParams({
      $top: String(Math.min(Math.max(limit, 1), 50)),
      $expand: 'lastMessagePreview,members',
      $orderby: 'lastUpdatedDateTime desc',
    });

    const response = await fetch(`${GRAPH_API_URL}/me/chats?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ConsistencyLevel: 'eventual',
      },
    });

    if (!response.ok) {
      const primaryError = await response.text();
      if (isGraphPersonalAccountError(primaryError)) {
        throw new BadRequestException(TEAMS_WORK_ACCOUNT_REQUIRED);
      }

      // Fallback without $orderby (some tenants reject advanced query).
      const fallbackParams = new URLSearchParams({
        $top: String(Math.min(Math.max(limit, 1), 50)),
        $expand: 'lastMessagePreview,members',
      });
      const fallback = await fetch(`${GRAPH_API_URL}/me/chats?${fallbackParams}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!fallback.ok) {
        const error = await fallback.text();
        if (isGraphPersonalAccountError(error)) {
          throw new BadRequestException(TEAMS_WORK_ACCOUNT_REQUIRED);
        }
        throw new BadRequestException(`Failed to fetch Teams chats: ${error}`);
      }
      const fallbackData = (await fallback.json()) as {
        value?: GraphChatItem[];
      };
      return this.mapChats(fallbackData.value ?? [], limit);
    }

    const data = (await response.json()) as { value?: GraphChatItem[] };
    return this.mapChats(data.value ?? [], limit);
  }

  private mapChats(items: GraphChatItem[], limit: number): TeamsChat[] {
    return items.slice(0, limit).map((chat) => {
      const preview = chat.lastMessagePreview?.body?.content
        ?.replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || null;

      const memberName = (chat.members ?? [])
        .map((m) => m.displayName?.trim())
        .find((name) => Boolean(name));

      const topic =
        chat.topic?.trim() ||
        memberName ||
        (chat.chatType === 'oneOnOne' ? 'Direct chat' : 'Group chat');

      return {
        id: chat.id,
        topic,
        chatType: chat.chatType ?? 'unknown',
        webUrl:
          chat.webUrl ??
          `https://teams.microsoft.com/l/chat/${encodeURIComponent(chat.id)}/conversations`,
        lastMessagePreview: preview,
        lastUpdatedAt: chat.lastUpdatedDateTime
          ? new Date(chat.lastUpdatedDateTime).toISOString()
          : null,
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
        'Teams session expired. Please reconnect.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.teamsConnection.update({
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
  ): Promise<TeamsTokenResponse> {
    const clientId = this.configService.get<string>('TEAMS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TEAMS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Teams is not configured');
    }

    const response = await fetch(`${this.getAuthBaseUrl()}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Failed to refresh Teams token. Please reconnect.',
      );
    }

    return response.json() as Promise<TeamsTokenResponse>;
  }
}
