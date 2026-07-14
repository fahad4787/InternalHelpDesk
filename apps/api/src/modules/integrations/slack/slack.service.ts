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
import { MOCK_SLACK_CHANNELS } from './constants/mock-channels.constant';
import { getMockMessagesForChannel } from './constants/mock-messages.constant';
import { UpdateSlackPreferencesDto } from './dto/update-slack-preferences.dto';
import { SlackChannel, SlackMessage, SlackProfile } from './types/slack-channel.type';
import {
  DEFAULT_SLACK_PREFERENCES,
  SlackPreferences,
} from './types/slack-preferences.type';

const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  bot_user_id?: string;
  team?: { id?: string; name?: string };
  authed_user?: { id?: string; access_token?: string };
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
}

interface SlackUserResponse extends SlackApiResponse {
  user?: {
    id?: string;
    profile?: {
      email?: string;
      real_name?: string;
      display_name?: string;
    };
  };
}

interface SlackConversationsResponse extends SlackApiResponse {
  channels?: Array<{
    id: string;
    name?: string;
    num_members?: number;
    is_private?: boolean;
    is_im?: boolean;
    is_mpim?: boolean;
    user?: string;
    updated?: number;
    latest?: { ts?: string };
  }>;
  response_metadata?: {
    next_cursor?: string;
  };
}

interface SlackHistoryResponse extends SlackApiResponse {
  messages?: Array<{
    type?: string;
    user?: string;
    username?: string;
    text?: string;
    ts?: string;
    bot_id?: string;
  }>;
}

interface SlackPostMessageResponse extends SlackApiResponse {
  ts?: string;
  message?: {
    text?: string;
    user?: string;
    ts?: string;
  };
}

@Injectable()
export class SlackService {
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
    const mode = this.configService.get<string>('SLACK_MODE', 'mock');
    if (mode === 'mock') return true;
    if (mode !== 'live') return true;
    return !this.configService.get<string>('SLACK_CLIENT_ID');
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.slackConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      mockMode: this.isMockMode(),
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      slackEmail: connection?.slackEmail ?? null,
      teamName: connection?.teamName ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateSlackPreferencesDto,
  ) {
    const connection = await this.prisma.slackConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Slack workspace is not connected');
    }

    const preferences: SlackPreferences = {
      showChannels: dto.showChannels,
      showDirectMessages: dto.showDirectMessages,
    };

    await this.prisma.slackConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    if (this.isMockMode()) {
      throw new BadRequestException(
        'Slack OAuth is disabled in mock mode. Use the mock connect action instead.',
      );
    }

    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Slack is not configured');
    }

    const clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');
    if (!clientSecret) {
      throw new BadRequestException(
        'SLACK_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const botScopes =
      this.configService.get<string>('SLACK_SCOPES')?.trim() ?? 'chat:write';
    const userScopes =
      this.configService.get<string>('SLACK_USER_SCOPES')?.trim() ??
      'channels:read,groups:read,im:read,mpim:read,channels:history,groups:history,im:history,mpim:history,chat:write,users:read,team:read';

    const params = new URLSearchParams({
      client_id: clientId,
      scope: botScopes,
      user_scope: userScopes,
      redirect_uri: redirectUri,
      state,
    });

    return successResponse({
      url: `${SLACK_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const oauth = await this.exchangeCodeForTokens(code);
    if (!oauth.access_token) {
      throw new BadRequestException('Slack did not return an access token');
    }

    const profile = await this.fetchSlackProfile(
      oauth.access_token,
      oauth.authed_user?.id,
      oauth.team,
    );

    const encryptedAccess = encrypt(oauth.access_token, this.encryptionKey);
    const userAccessToken = oauth.authed_user?.access_token ?? null;
    const encryptedUserAccess =
      userAccessToken != null
        ? encrypt(userAccessToken, this.encryptionKey)
        : null;

    await this.prisma.slackConnection.upsert({
      where: { userId },
      create: {
        userId,
        slackUserId: profile.userId,
        slackEmail: profile.email,
        teamId: profile.teamId,
        teamName: profile.teamName,
        botUserId: oauth.bot_user_id ?? null,
        encryptedAccessToken: encryptedAccess,
        encryptedUserAccessToken: encryptedUserAccess,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_SLACK_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        slackUserId: profile.userId,
        slackEmail: profile.email,
        teamId: profile.teamId,
        teamName: profile.teamName,
        botUserId: oauth.bot_user_id ?? null,
        encryptedAccessToken: encryptedAccess,
        encryptedUserAccessToken: encryptedUserAccess,
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
            provider: IntegrationProvider.SLACK,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.SLACK,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async connectMock(user: AuthenticatedUser) {
    if (!this.isMockMode()) {
      throw new BadRequestException('Mock connect is only available in mock mode');
    }

    await this.prisma.slackConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        slackEmail: user.email,
        teamId: 'T-MOCK',
        teamName: 'Acme Workspace',
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_SLACK_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        slackEmail: user.email,
        teamId: 'T-MOCK',
        teamName: 'Acme Workspace',
        status: IntegrationStatus.CONNECTED,
        lastSyncedAt: new Date(),
      },
    });

    await this.prisma.integration.upsert({
      where: {
        companyId_provider: {
          companyId: user.companyId,
          provider: IntegrationProvider.SLACK,
        },
      },
      create: {
        companyId: user.companyId,
        provider: IntegrationProvider.SLACK,
        status: IntegrationStatus.CONNECTED,
      },
      update: { status: IntegrationStatus.CONNECTED },
    });

    return successResponse(
      {
        connected: true,
        mockMode: true,
        slackEmail: user.email,
        teamName: 'Acme Workspace',
      },
      'Slack connected (mock mode)',
    );
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.slackConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.slackConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.SLACK,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Slack disconnected');
  }

  async getProfile(user: AuthenticatedUser) {
    const connection = await this.prisma.slackConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        profile: null as SlackProfile | null,
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        profile: {
          userId: 'U-MOCK',
          email: connection.slackEmail,
          displayName: 'Mock Slack User',
          teamId: connection.teamId,
          teamName: connection.teamName,
        } satisfies SlackProfile,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const profile = await this.fetchSlackProfile(
      accessToken,
      connection.slackUserId ?? undefined,
      {
        id: connection.teamId ?? undefined,
        name: connection.teamName ?? undefined,
      },
    );

    return successResponse({
      connected: true,
      mockMode: false,
      profile,
    });
  }

  async getChannels(user: AuthenticatedUser) {
    const connection = await this.prisma.slackConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        channels: [] as SlackChannel[],
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        channels: MOCK_SLACK_CHANNELS,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const channels = await this.fetchChannels(accessToken);

    await this.prisma.slackConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      mockMode: false,
      channels,
    });
  }

  async getChannelMessages(user: AuthenticatedUser, channelId: string) {
    const connection = await this.prisma.slackConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        channelId,
        messages: [] as SlackMessage[],
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        channelId,
        messages: getMockMessagesForChannel(channelId),
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const messages = await this.fetchChannelMessages(accessToken, channelId);

    return successResponse({
      connected: true,
      mockMode: false,
      channelId,
      messages,
    });
  }

  async sendChannelMessage(
    user: AuthenticatedUser,
    channelId: string,
    text: string,
  ) {
    const connection = await this.prisma.slackConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Slack workspace is not connected');
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Message cannot be empty');
    }

    if (this.isMockMode()) {
      const message: SlackMessage = {
        id: `mock-${Date.now()}`,
        text: trimmed,
        userId: connection.slackUserId,
        userName: connection.slackEmail?.split('@')[0] ?? 'You',
        timestamp: new Date().toISOString(),
      };
      return successResponse({ channelId, message }, 'Message sent');
    }

    const accessToken = await this.getPostingAccessToken(connection);
    const message = await this.postSlackMessage(accessToken, channelId, trimmed);

    return successResponse({ channelId, message }, 'Message sent');
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined): SlackPreferences {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return DEFAULT_SLACK_PREFERENCES;
    }

    const prefs = value as Partial<SlackPreferences> & { showChannels?: boolean };
    const showChannels =
      prefs.showChannels ?? DEFAULT_SLACK_PREFERENCES.showChannels;
    return {
      showChannels,
      showDirectMessages:
        prefs.showDirectMessages ?? showChannels ?? DEFAULT_SLACK_PREFERENCES.showDirectMessages,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'SLACK_REDIRECT_URI',
      callbackPath: '/api/integrations/slack/callback',
    });
  }

  private async exchangeCodeForTokens(code: string): Promise<SlackOAuthResponse> {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Slack is not configured');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(SLACK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await response.json()) as SlackOAuthResponse;
    if (!response.ok || !data.ok) {
      throw new BadRequestException(data.error ?? 'Slack token exchange failed');
    }

    return data;
  }

  private async fetchSlackProfile(
    accessToken: string,
    userId?: string,
    team?: { id?: string; name?: string },
  ): Promise<SlackProfile> {
    if (!userId) {
      return {
        userId: null,
        email: null,
        displayName: null,
        teamId: team?.id ?? null,
        teamName: team?.name ?? null,
      };
    }

    const response = await fetch(
      `https://slack.com/api/users.info?user=${encodeURIComponent(userId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const data = (await response.json()) as SlackUserResponse;
    if (!data.ok) {
      return {
        userId,
        email: null,
        displayName: null,
        teamId: team?.id ?? null,
        teamName: team?.name ?? null,
      };
    }

    return {
      userId,
      email: data.user?.profile?.email ?? null,
      displayName:
        data.user?.profile?.real_name ??
        data.user?.profile?.display_name ??
        null,
      teamId: team?.id ?? null,
      teamName: team?.name ?? null,
    };
  }

  private async fetchChannels(accessToken: string): Promise<SlackChannel[]> {
    const rawChannels: NonNullable<SlackConversationsResponse['channels']> = [];
    let cursor: string | undefined;

    do {
      const params = new URLSearchParams({
        types: 'public_channel,private_channel,im,mpim',
        exclude_archived: 'true',
        limit: '200',
      });
      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(
        `https://slack.com/api/users.conversations?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const data = (await response.json()) as SlackConversationsResponse;
      if (!data.ok || !data.channels) {
        if (data.error === 'missing_scope') {
          throw new BadRequestException(
            'Slack is missing conversation permissions. Add user token scopes (im:read, mpim:read, groups:read) in Slack, reinstall the app, then disconnect and reconnect here.',
          );
        }
        throw new BadRequestException(data.error ?? 'Failed to load Slack channels');
      }

      rawChannels.push(...data.channels);
      cursor = data.response_metadata?.next_cursor || undefined;
    } while (cursor);

    const dmUserIds = [
      ...new Set(
        rawChannels
          .filter((channel) => channel.is_im === true && channel.user)
          .map((channel) => channel.user as string),
      ),
    ];
    const userNames = await this.resolveUserNames(accessToken, dmUserIds);

    const channels = rawChannels.map((channel) => {
      const isDirectMessage = channel.is_im === true;
      const isGroupDm = channel.is_mpim === true;
      const kind = isDirectMessage ? 'dm' : isGroupDm ? 'group_dm' : 'channel';
      const dmName =
        isDirectMessage && channel.user
          ? userNames.get(channel.user) ?? 'Direct message'
          : null;

      return {
        id: channel.id,
        name: dmName ?? channel.name ?? 'conversation',
        memberCount: channel.num_members ?? (isDirectMessage ? 2 : 0),
        isPrivate: channel.is_private === true || isDirectMessage || isGroupDm,
        kind,
      } satisfies SlackChannel;
    });

    return this.sortConversations(channels);
  }

  private sortConversations(channels: SlackChannel[]): SlackChannel[] {
    const sorter = (a: SlackChannel, b: SlackChannel) => a.name.localeCompare(b.name);

    const workspaceChannels = channels
      .filter((channel) => channel.kind === 'channel')
      .sort(sorter);
    const directMessages = channels
      .filter((channel) => channel.kind === 'dm' || channel.kind === 'group_dm')
      .sort(sorter);

    return [...workspaceChannels, ...directMessages];
  }

  private async fetchChannelMessages(
    accessToken: string,
    channelId: string,
  ): Promise<SlackMessage[]> {
    const response = await fetch(
      `https://slack.com/api/conversations.history?channel=${encodeURIComponent(channelId)}&limit=25`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const data = (await response.json()) as SlackHistoryResponse;
    if (!data.ok || !data.messages) {
      if (data.error === 'missing_scope') {
        throw new BadRequestException(
          'Slack is missing message permissions. Add channels:history and groups:history scopes, reinstall the app, then disconnect and reconnect here.',
        );
      }
      if (data.error === 'not_in_channel') {
        throw new BadRequestException(
          'Invite the Internal Helpdesk bot to this channel in Slack, then try again.',
        );
      }
      throw new BadRequestException(data.error ?? 'Failed to load Slack messages');
    }

    const chatMessages = data.messages.filter(
      (message) => message.type === 'message' && message.text,
    );

    const userIds = [
      ...new Set(
        chatMessages
          .map((message) => message.user)
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];

    const userNames = await this.resolveUserNames(accessToken, userIds);

    return chatMessages
      .map((message) => ({
        id: message.ts ?? `${channelId}-${message.text}`,
        text: message.text ?? '',
        userId: message.user ?? null,
        userName:
          (message.user ? userNames.get(message.user) : null) ??
          message.username ??
          (message.bot_id ? 'Bot' : null),
        timestamp: message.ts
          ? new Date(Number.parseFloat(message.ts) * 1000).toISOString()
          : new Date().toISOString(),
      }))
      .reverse();
  }

  private async resolveUserNames(
    accessToken: string,
    userIds: string[],
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();

    await Promise.all(
      userIds.map(async (userId) => {
        const response = await fetch(
          `https://slack.com/api/users.info?user=${encodeURIComponent(userId)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        const data = (await response.json()) as SlackUserResponse;
        if (!data.ok || !data.user) return;

        const displayName =
          data.user.profile?.real_name ??
          data.user.profile?.display_name ??
          userId;
        names.set(userId, displayName);
      }),
    );

    return names;
  }

  private async getPostingAccessToken(connection: {
    encryptedAccessToken: string | null;
    encryptedUserAccessToken?: string | null;
  }): Promise<string> {
    return this.getValidAccessToken(connection);
  }

  private async postSlackMessage(
    accessToken: string,
    channelId: string,
    text: string,
  ): Promise<SlackMessage> {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel: channelId, text }),
    });

    const data = (await response.json()) as SlackPostMessageResponse;
    if (!data.ok) {
      if (data.error === 'missing_scope') {
        throw new BadRequestException(
          'Slack is missing chat:write permission. Add chat:write to user token scopes, reinstall the app, then disconnect and reconnect here.',
        );
      }
      if (data.error === 'not_in_channel') {
        throw new BadRequestException(
          'You cannot post in this channel from HelpDesk. Open it in Slack first or invite the app.',
        );
      }
      throw new BadRequestException(data.error ?? 'Failed to send Slack message');
    }

    const userId = data.message?.user ?? null;
    let userName: string | null = null;
    if (userId) {
      const names = await this.resolveUserNames(accessToken, [userId]);
      userName = names.get(userId) ?? null;
    }

    const ts = data.ts ?? data.message?.ts;
    return {
      id: ts ?? `sent-${Date.now()}`,
      text: data.message?.text ?? text,
      userId,
      userName: userName ?? 'You',
      timestamp: ts
        ? new Date(Number.parseFloat(ts) * 1000).toISOString()
        : new Date().toISOString(),
    };
  }

  private async getValidAccessToken(connection: {
    encryptedAccessToken: string | null;
    encryptedUserAccessToken?: string | null;
  }): Promise<string> {
    if (connection.encryptedUserAccessToken) {
      return decrypt(connection.encryptedUserAccessToken, this.encryptionKey);
    }

    if (connection.encryptedAccessToken) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    throw new BadRequestException('Slack access token is missing');
  }
}
