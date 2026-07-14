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
import { MOCK_OUTLOOK_MESSAGES } from './constants/mock-messages.constant';
import { UpdateOutlookPreferencesDto } from './dto/update-outlook-preferences.dto';
import {
  DEFAULT_OUTLOOK_PREFERENCES,
  OutlookMessage,
  OutlookPreferences,
  OutlookProfile,
} from './types/outlook-preferences.type';

const OUTLOOK_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const OUTLOOK_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
const DEFAULT_SCOPES = 'Mail.Read User.Read offline_access';

interface OutlookTokenResponse {
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

interface GraphMessageItem {
  id: string;
  conversationId?: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  webLink?: string;
  from?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
}

interface GraphMessagesResponse {
  value?: GraphMessageItem[];
}

@Injectable()
export class OutlookService {
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
    const mode = this.configService.get<string>('OUTLOOK_MODE', 'mock');
    if (mode === 'mock') return true;
    if (mode !== 'live') return true;
    return !this.configService.get<string>('OUTLOOK_CLIENT_ID');
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.outlookConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      mockMode: this.isMockMode(),
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      outlookEmail: connection?.outlookEmail ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateOutlookPreferencesDto,
  ) {
    const connection = await this.prisma.outlookConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Outlook account is not connected');
    }

    const preferences: OutlookPreferences = {
      showProfile: dto.showProfile,
      showInbox: dto.showInbox,
    };

    await this.prisma.outlookConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    if (this.isMockMode()) {
      throw new BadRequestException(
        'Outlook OAuth is disabled in mock mode. Use the mock connect action instead.',
      );
    }

    const clientId = this.configService.get<string>('OUTLOOK_CLIENT_ID');
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Outlook is not configured');
    }

    const clientSecret = this.configService.get<string>('OUTLOOK_CLIENT_SECRET');
    if (!clientSecret) {
      throw new BadRequestException(
        'OUTLOOK_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('OUTLOOK_SCOPES')?.trim() ||
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
      url: `${OUTLOOK_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const email = await this.fetchOutlookEmail(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.outlookConnection.upsert({
      where: { userId },
      create: {
        userId,
        outlookEmail: email,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_OUTLOOK_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        outlookEmail: email,
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
            provider: IntegrationProvider.OUTLOOK,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.OUTLOOK,
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

    await this.prisma.outlookConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        outlookEmail: user.email,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_OUTLOOK_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        outlookEmail: user.email,
        status: IntegrationStatus.CONNECTED,
        lastSyncedAt: new Date(),
      },
    });

    await this.prisma.integration.upsert({
      where: {
        companyId_provider: {
          companyId: user.companyId,
          provider: IntegrationProvider.OUTLOOK,
        },
      },
      create: {
        companyId: user.companyId,
        provider: IntegrationProvider.OUTLOOK,
        status: IntegrationStatus.CONNECTED,
      },
      update: { status: IntegrationStatus.CONNECTED },
    });

    return successResponse(
      { connected: true, mockMode: true, outlookEmail: user.email },
      'Outlook connected (mock mode)',
    );
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.outlookConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.outlookConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.OUTLOOK,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Outlook disconnected');
  }

  async getProfile(user: AuthenticatedUser) {
    const connection = await this.prisma.outlookConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        profile: null as OutlookProfile | null,
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        profile: {
          email: connection.outlookEmail,
          displayName: user.firstName
            ? `${user.firstName} ${user.lastName}`.trim()
            : null,
        },
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const profile = await this.fetchOutlookProfile(accessToken);

    return successResponse({
      connected: true,
      mockMode: false,
      profile,
    });
  }

  async getMessages(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.outlookConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        messages: [] as OutlookMessage[],
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        outlookEmail: connection.outlookEmail,
        messages: MOCK_OUTLOOK_MESSAGES.slice(0, limit),
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const messages = await this.fetchOutlookMessages(accessToken, limit);

    await this.prisma.outlookConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      mockMode: false,
      outlookEmail: connection.outlookEmail,
      messages,
    });
  }

  private resolvePreferences(prefs: unknown): OutlookPreferences {
    if (!prefs || typeof prefs !== 'object') {
      return DEFAULT_OUTLOOK_PREFERENCES;
    }

    const record = prefs as Record<string, unknown>;
    return {
      showProfile:
        typeof record.showProfile === 'boolean'
          ? record.showProfile
          : DEFAULT_OUTLOOK_PREFERENCES.showProfile,
      showInbox:
        typeof record.showInbox === 'boolean'
          ? record.showInbox
          : DEFAULT_OUTLOOK_PREFERENCES.showInbox,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'OUTLOOK_REDIRECT_URI',
      callbackPath: '/api/integrations/outlook/callback',
    });
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<OutlookTokenResponse> {
    const clientId = this.configService.get<string>('OUTLOOK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('OUTLOOK_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Outlook is not configured');
    }

    const response = await fetch(OUTLOOK_TOKEN_URL, {
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
        `Failed to exchange Outlook authorization code: ${error}`,
      );
    }

    return response.json() as Promise<OutlookTokenResponse>;
  }

  private async fetchOutlookEmail(accessToken: string): Promise<string | null> {
    const profile = await this.fetchOutlookProfile(accessToken);
    return profile.email;
  }

  private async fetchOutlookProfile(
    accessToken: string,
  ): Promise<OutlookProfile> {
    const response = await fetch(
      `${GRAPH_API_URL}/me?$select=displayName,mail,userPrincipalName`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Outlook profile');
    }

    const data = (await response.json()) as GraphUserResponse;
    return {
      email: data.mail ?? data.userPrincipalName ?? null,
      displayName: data.displayName ?? null,
    };
  }

  private async fetchOutlookMessages(
    accessToken: string,
    limit: number,
  ): Promise<OutlookMessage[]> {
    const params = new URLSearchParams({
      $top: String(limit),
      $orderby: 'receivedDateTime desc',
      $select:
        'id,conversationId,subject,from,bodyPreview,receivedDateTime,isRead,webLink',
    });

    const response = await fetch(
      `${GRAPH_API_URL}/me/mailFolders/inbox/messages?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Outlook messages');
    }

    const data = (await response.json()) as GraphMessagesResponse;
    return (data.value ?? []).map((message) => this.mapGraphMessage(message));
  }

  private mapGraphMessage(message: GraphMessageItem): OutlookMessage {
    const fromName = message.from?.emailAddress?.name?.trim() || 'Unknown sender';
    const fromEmail = message.from?.emailAddress?.address?.trim() ?? null;

    return {
      id: message.id,
      conversationId: message.conversationId ?? message.id,
      subject: message.subject?.trim() || '(No subject)',
      from: fromName,
      fromEmail,
      snippet: message.bodyPreview?.trim() ?? '',
      receivedAt: message.receivedDateTime
        ? new Date(message.receivedDateTime).toISOString()
        : new Date().toISOString(),
      isUnread: message.isRead === false,
      webViewLink:
        message.webLink ?? 'https://outlook.office.com/mail/inbox',
    };
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
        'Outlook session expired. Please reconnect.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.outlookConnection.update({
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
  ): Promise<OutlookTokenResponse> {
    const clientId = this.configService.get<string>('OUTLOOK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('OUTLOOK_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Outlook is not configured');
    }

    const response = await fetch(OUTLOOK_TOKEN_URL, {
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
        'Failed to refresh Outlook token. Please reconnect.',
      );
    }

    return response.json() as Promise<OutlookTokenResponse>;
  }
}
