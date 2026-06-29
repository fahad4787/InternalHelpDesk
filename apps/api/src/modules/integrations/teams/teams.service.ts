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
import { MOCK_TEAMS_CHANNELS } from './constants/mock-channels.constant';
import { getMockMessagesForChannel } from './constants/mock-messages.constant';
import { UpdateTeamsPreferencesDto } from './dto/update-teams-preferences.dto';
import {
  TeamsChannel,
  TeamsMessage,
  TeamsProfile,
} from './types/teams-channel.type';
import {
  DEFAULT_TEAMS_PREFERENCES,
  TeamsPreferences,
} from './types/teams-preferences.type';

const TEAMS_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TEAMS_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

interface TeamsOAuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GraphUserResponse {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

interface GraphTeamsResponse {
  value?: Array<{
    id: string;
    displayName: string;
  }>;
}

interface GraphChannelsResponse {
  value?: Array<{
    id: string;
    displayName: string;
    membershipType?: string;
  }>;
}

interface GraphMessagesResponse {
  value?: Array<{
    id: string;
    createdDateTime?: string;
    from?: {
      user?: {
        id?: string;
        displayName?: string;
      };
    };
    body?: {
      content?: string;
      contentType?: string;
    };
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
    this.jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'dev-secret',
    );
  }

  isMockMode(): boolean {
    const mode = this.configService.get<string>('TEAMS_MODE', 'mock');
    if (mode === 'mock') return true;
    if (mode !== 'live') return true;
    return !this.configService.get<string>('TEAMS_CLIENT_ID');
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      mockMode: this.isMockMode(),
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      teamsEmail: connection?.teamsEmail ?? null,
      tenantName: connection?.tenantName ?? null,
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
      showProfile: dto.showProfile,
      showChannels: dto.showChannels,
    };

    await this.prisma.teamsConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    if (this.isMockMode()) {
      throw new BadRequestException(
        'Teams OAuth is disabled in mock mode. Use the mock connect action instead.',
      );
    }

    const clientId = this.configService.get<string>('TEAMS_CLIENT_ID');
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Microsoft Teams is not configured');
    }

    const clientSecret = this.configService.get<string>('TEAMS_CLIENT_SECRET');
    if (!clientSecret) {
      throw new BadRequestException(
        'TEAMS_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('TEAMS_SCOPES')?.trim() ??
      'User.Read Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Read.All offline_access';

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes,
      state,
    });

    return successResponse({
      url: `${TEAMS_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      throw new BadRequestException('Microsoft did not return an access token');
    }

    const profile = await this.fetchTeamsProfile(tokens.access_token);
    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : null;
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await this.prisma.teamsConnection.upsert({
      where: { userId },
      create: {
        userId,
        teamsUserId: profile.userId,
        teamsEmail: profile.email,
        tenantId: profile.tenantId,
        tenantName: profile.tenantName,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_TEAMS_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        teamsUserId: profile.userId,
        teamsEmail: profile.email,
        tenantId: profile.tenantId,
        tenantName: profile.tenantName,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt,
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

  async connectMock(user: AuthenticatedUser) {
    if (!this.isMockMode()) {
      throw new BadRequestException(
        'Mock connect is only available in mock mode',
      );
    }

    await this.prisma.teamsConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        teamsEmail: user.email,
        tenantId: 'TENANT-MOCK',
        tenantName: 'Acme Microsoft Tenant',
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_TEAMS_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        teamsEmail: user.email,
        tenantId: 'TENANT-MOCK',
        tenantName: 'Acme Microsoft Tenant',
        status: IntegrationStatus.CONNECTED,
        lastSyncedAt: new Date(),
      },
    });

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

    return successResponse(
      {
        connected: true,
        mockMode: true,
        teamsEmail: user.email,
        tenantName: 'Acme Microsoft Tenant',
      },
      'Microsoft Teams connected (mock mode)',
    );
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

  async getProfile(user: AuthenticatedUser) {
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        profile: null as TeamsProfile | null,
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        profile: {
          userId: 'U-MOCK',
          email: connection.teamsEmail,
          displayName: 'Mock Teams User',
          tenantId: connection.tenantId,
          tenantName: connection.tenantName,
        } satisfies TeamsProfile,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const profile = await this.fetchTeamsProfile(accessToken);

    return successResponse({
      connected: true,
      mockMode: false,
      profile,
    });
  }

  async getChannels(user: AuthenticatedUser) {
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        channels: [] as TeamsChannel[],
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        channels: MOCK_TEAMS_CHANNELS,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const channels = await this.fetchChannels(accessToken);

    await this.prisma.teamsConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      mockMode: false,
      channels,
    });
  }

  async getChannelMessages(
    user: AuthenticatedUser,
    teamId: string,
    channelId: string,
  ) {
    const connection = await this.prisma.teamsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        teamId,
        channelId,
        messages: [] as TeamsMessage[],
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        teamId,
        channelId,
        messages: getMockMessagesForChannel(teamId, channelId),
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const messages = await this.fetchChannelMessages(
      accessToken,
      teamId,
      channelId,
    );

    return successResponse({
      connected: true,
      mockMode: false,
      teamId,
      channelId,
      messages,
    });
  }

  private resolvePreferences(
    value: Prisma.JsonValue | null | undefined,
  ): TeamsPreferences {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return DEFAULT_TEAMS_PREFERENCES;
    }

    const prefs = value as Partial<TeamsPreferences>;
    return {
      showProfile: prefs.showProfile ?? DEFAULT_TEAMS_PREFERENCES.showProfile,
      showChannels:
        prefs.showChannels ?? DEFAULT_TEAMS_PREFERENCES.showChannels,
    };
  }

  private getRedirectUri(): string | undefined {
    return (
      this.configService.get<string>('TEAMS_REDIRECT_URI') ??
      `http://127.0.0.1:${this.configService.get<number>('PORT', 3001)}/api/integrations/teams/callback`
    );
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<TeamsOAuthResponse> {
    const clientId = this.configService.get<string>('TEAMS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TEAMS_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Microsoft Teams is not configured');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(TEAMS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await response.json()) as TeamsOAuthResponse;
    if (!response.ok || data.error) {
      throw new BadRequestException(
        data.error_description ?? data.error ?? 'Microsoft token exchange failed',
      );
    }

    return data;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<TeamsOAuthResponse> {
    const clientId = this.configService.get<string>('TEAMS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TEAMS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Microsoft Teams is not configured');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(TEAMS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await response.json()) as TeamsOAuthResponse;
    if (!response.ok || data.error || !data.access_token) {
      throw new BadRequestException(
        data.error_description ?? data.error ?? 'Microsoft token refresh failed',
      );
    }

    return data;
  }

  private async fetchTeamsProfile(accessToken: string): Promise<TeamsProfile> {
    const response = await fetch(`${GRAPH_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await response.json()) as GraphUserResponse;
    if (!response.ok) {
      throw new BadRequestException('Failed to load Microsoft profile');
    }

    const organization = await this.fetchOrganization(accessToken);

    return {
      userId: data.id ?? null,
      email: data.mail ?? data.userPrincipalName ?? null,
      displayName: data.displayName ?? null,
      tenantId: organization.tenantId,
      tenantName: organization.tenantName,
    };
  }

  private async fetchOrganization(accessToken: string): Promise<{
    tenantId: string | null;
    tenantName: string | null;
  }> {
    const response = await fetch(`${GRAPH_API_BASE}/organization`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return { tenantId: null, tenantName: null };
    }

    const data = (await response.json()) as {
      value?: Array<{ id?: string; displayName?: string }>;
    };

    const org = data.value?.[0];
    return {
      tenantId: org?.id ?? null,
      tenantName: org?.displayName ?? null,
    };
  }

  private async fetchChannels(accessToken: string): Promise<TeamsChannel[]> {
    const teamsResponse = await fetch(`${GRAPH_API_BASE}/me/joinedTeams`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const teamsData = (await teamsResponse.json()) as GraphTeamsResponse;
    if (!teamsResponse.ok || !teamsData.value) {
      throw new BadRequestException(
        'Failed to load Microsoft Teams. Ensure Team.ReadBasic.All scope is granted.',
      );
    }

    const channels: TeamsChannel[] = [];

    for (const team of teamsData.value) {
      const channelsResponse = await fetch(
        `${GRAPH_API_BASE}/teams/${encodeURIComponent(team.id)}/channels`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const channelsData =
        (await channelsResponse.json()) as GraphChannelsResponse;

      if (!channelsResponse.ok || !channelsData.value) {
        continue;
      }

      for (const channel of channelsData.value) {
        channels.push({
          id: channel.id,
          name: channel.displayName,
          teamId: team.id,
          teamName: team.displayName,
          memberCount: 0,
          isPrivate: channel.membershipType === 'private',
        });
      }
    }

    return channels;
  }

  private async fetchChannelMessages(
    accessToken: string,
    teamId: string,
    channelId: string,
  ): Promise<TeamsMessage[]> {
    const response = await fetch(
      `${GRAPH_API_BASE}/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages?$top=25`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const data = (await response.json()) as GraphMessagesResponse;
    if (!response.ok || !data.value) {
      throw new BadRequestException(
        'Failed to load Teams messages. Ensure ChannelMessage.Read.All scope is granted.',
      );
    }

    return data.value
      .map((message) => ({
        id: message.id,
        text: this.normalizeMessageBody(message.body?.content ?? ''),
        userId: message.from?.user?.id ?? null,
        userName: message.from?.user?.displayName ?? null,
        timestamp: message.createdDateTime ?? new Date().toISOString(),
      }))
      .reverse();
  }

  private normalizeMessageBody(content: string): string {
    return content
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async getValidAccessToken(connection: {
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
    userId: string;
  }): Promise<string> {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException('Microsoft Teams access token is missing');
    }

    const expiresSoon =
      connection.tokenExpiresAt != null &&
      connection.tokenExpiresAt.getTime() - Date.now() < 60_000;

    if (!expiresSoon) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.teamsConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encrypt(tokens.access_token!, this.encryptionKey),
        ...(tokens.refresh_token
          ? {
              encryptedRefreshToken: encrypt(
                tokens.refresh_token,
                this.encryptionKey,
              ),
            }
          : {}),
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
    });

    return tokens.access_token!;
  }
}
