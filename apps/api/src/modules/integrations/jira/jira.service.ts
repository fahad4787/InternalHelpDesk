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
import { createOAuthState, verifyOAuthState } from '../google-calendar/utils/oauth-state.util';
import {
  getMockAssignedIssues,
  getMockReportedIssues,
  MOCK_JIRA_PROJECTS,
} from './constants/mock-issues.constant';
import { UpdateJiraPreferencesDto } from './dto/update-jira-preferences.dto';
import {
  DEFAULT_JIRA_PREFERENCES,
  JiraPreferences,
} from './types/jira-preferences.type';
import { JiraIssue, JiraProfile, JiraProject } from './types/jira-issue.type';

const JIRA_AUTH_URL = 'https://auth.atlassian.com/authorize';
const JIRA_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';
const JIRA_ACCESSIBLE_RESOURCES_URL =
  'https://api.atlassian.com/oauth/token/accessible-resources';

interface JiraTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface JiraAccessibleResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
}

interface JiraMeResponse {
  accountId?: string;
  emailAddress?: string;
  displayName?: string;
}

interface JiraSearchIssueFields {
  summary?: string;
  status?: { name?: string };
  priority?: { name?: string };
  issuetype?: { name?: string };
  assignee?: { displayName?: string };
  reporter?: { displayName?: string };
  updated?: string;
}

interface JiraSearchIssue {
  id: string;
  key: string;
  fields?: JiraSearchIssueFields;
}

interface JiraSearchResponse {
  issues?: JiraSearchIssue[];
}

interface JiraProjectResponse {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
  self?: string;
}

@Injectable()
export class JiraService {
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
    const mode = this.configService.get<string>('JIRA_MODE', 'live');
    if (mode === 'mock') return true;
    if (mode !== 'live') return true;
    return !this.configService.get<string>('JIRA_CLIENT_ID');
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.jiraConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      mockMode: this.isMockMode(),
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      jiraEmail: connection?.jiraEmail ?? null,
      jiraSiteUrl: connection?.jiraSiteUrl ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateJiraPreferencesDto,
  ) {
    const connection = await this.prisma.jiraConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Jira account is not connected');
    }

    const preferences: JiraPreferences = {
      showProfile: dto.showProfile,
      showAssignedIssues: dto.showAssignedIssues,
      showReportedIssues: dto.showReportedIssues,
      showProjects: dto.showProjects,
    };

    await this.prisma.jiraConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    if (this.isMockMode()) {
      throw new BadRequestException(
        'Jira OAuth is disabled in mock mode. Use the mock connect action instead.',
      );
    }

    const clientId = this.configService.get<string>('JIRA_CLIENT_ID');
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Jira is not configured');
    }

    const clientSecret = this.configService.get<string>('JIRA_CLIENT_SECRET');
    if (!clientSecret) {
      throw new BadRequestException(
        'JIRA_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('JIRA_SCOPES')?.trim() ??
      'read:jira-work write:jira-work read:jira-user offline_access';

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
      prompt: 'consent',
    });

    return successResponse({
      url: `${JIRA_AUTH_URL}?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const resource = await this.fetchAccessibleResource(tokens.access_token);
    const profile = await this.fetchJiraMyself(
      tokens.access_token,
      resource.id,
    );

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.jiraConnection.upsert({
      where: { userId },
      create: {
        userId,
        jiraEmail: profile.email,
        jiraAccountId: profile.accountId,
        jiraCloudId: resource.id,
        jiraSiteUrl: resource.url,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences: DEFAULT_JIRA_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        jiraEmail: profile.email,
        jiraAccountId: profile.accountId,
        jiraCloudId: resource.id,
        jiraSiteUrl: resource.url,
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
            provider: IntegrationProvider.JIRA,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.JIRA,
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

    await this.prisma.jiraConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        jiraEmail: user.email,
        jiraSiteUrl: 'https://example.atlassian.net',
        status: IntegrationStatus.CONNECTED,
        preferences: DEFAULT_JIRA_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        jiraEmail: user.email,
        jiraSiteUrl: 'https://example.atlassian.net',
        status: IntegrationStatus.CONNECTED,
        lastSyncedAt: new Date(),
      },
    });

    await this.prisma.integration.upsert({
      where: {
        companyId_provider: {
          companyId: user.companyId,
          provider: IntegrationProvider.JIRA,
        },
      },
      create: {
        companyId: user.companyId,
        provider: IntegrationProvider.JIRA,
        status: IntegrationStatus.CONNECTED,
      },
      update: { status: IntegrationStatus.CONNECTED },
    });

    return successResponse(
      {
        connected: true,
        mockMode: true,
        jiraEmail: user.email,
        jiraSiteUrl: 'https://example.atlassian.net',
      },
      'Jira connected (mock mode)',
    );
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.jiraConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.jiraConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.JIRA,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Jira disconnected');
  }

  async getProfile(user: AuthenticatedUser) {
    const connection = await this.prisma.jiraConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        profile: null as JiraProfile | null,
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        profile: {
          accountId: 'mock-account',
          email: connection.jiraEmail,
          displayName: 'Mock Jira User',
          siteUrl: connection.jiraSiteUrl,
          siteName: 'Example Jira Site',
        } satisfies JiraProfile,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    if (!connection.jiraCloudId) {
      throw new BadRequestException('Jira site is not configured. Please reconnect.');
    }
    const me = await this.fetchJiraMyself(accessToken, connection.jiraCloudId);

    return successResponse({
      connected: true,
      mockMode: false,
      profile: {
        accountId: me.accountId,
        email: me.email ?? connection.jiraEmail,
        displayName: me.displayName,
        siteUrl: connection.jiraSiteUrl,
        siteName: this.extractSiteName(connection.jiraSiteUrl),
      } satisfies JiraProfile,
    });
  }

  async getIssues(
    user: AuthenticatedUser,
    type: 'assigned' | 'reported' = 'assigned',
  ) {
    const connection = await this.prisma.jiraConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        issues: [] as JiraIssue[],
      });
    }

    if (this.isMockMode()) {
      const issues =
        type === 'reported'
          ? getMockReportedIssues()
          : getMockAssignedIssues();

      return successResponse({
        connected: true,
        mockMode: true,
        jiraSiteUrl: connection.jiraSiteUrl,
        issues,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const jql =
      type === 'reported'
        ? 'reporter = currentUser() ORDER BY updated DESC'
        : 'assignee = currentUser() ORDER BY updated DESC';
    const issues = await this.fetchIssues(
      accessToken,
      connection.jiraCloudId!,
      connection.jiraSiteUrl,
      jql,
    );

    await this.prisma.jiraConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      mockMode: false,
      jiraSiteUrl: connection.jiraSiteUrl,
      issues,
    });
  }

  async getProjects(user: AuthenticatedUser) {
    const connection = await this.prisma.jiraConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        mockMode: this.isMockMode(),
        projects: [] as JiraProject[],
      });
    }

    if (this.isMockMode()) {
      return successResponse({
        connected: true,
        mockMode: true,
        jiraSiteUrl: connection.jiraSiteUrl,
        projects: MOCK_JIRA_PROJECTS,
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const projects = await this.fetchProjects(
      accessToken,
      connection.jiraCloudId!,
      connection.jiraSiteUrl,
    );

    await this.prisma.jiraConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      mockMode: false,
      jiraSiteUrl: connection.jiraSiteUrl,
      projects,
    });
  }

  private resolvePreferences(value: unknown): JiraPreferences {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_JIRA_PREFERENCES };
    }

    const prefs = value as Record<string, unknown>;
    return {
      showProfile:
        typeof prefs.showProfile === 'boolean'
          ? prefs.showProfile
          : DEFAULT_JIRA_PREFERENCES.showProfile,
      showAssignedIssues:
        typeof prefs.showAssignedIssues === 'boolean'
          ? prefs.showAssignedIssues
          : DEFAULT_JIRA_PREFERENCES.showAssignedIssues,
      showReportedIssues:
        typeof prefs.showReportedIssues === 'boolean'
          ? prefs.showReportedIssues
          : DEFAULT_JIRA_PREFERENCES.showReportedIssues,
      showProjects:
        typeof prefs.showProjects === 'boolean'
          ? prefs.showProjects
          : DEFAULT_JIRA_PREFERENCES.showProjects,
    };
  }

  private getRedirectUri(): string {
    return (
      this.configService.get<string>('JIRA_REDIRECT_URI') ??
      `http://127.0.0.1:${this.configService.get<number>('PORT', 3001)}/api/integrations/jira/callback`
    );
  }

  private async jiraFetch(
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
        `Jira API request failed (${message}). Check your internet connection and try again.`,
      );
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<JiraTokenResponse> {
    const clientId = this.configService.get<string>('JIRA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('JIRA_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    const response = await this.jiraFetch(JIRA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Jira token exchange failed: ${error}`);
    }

    return response.json() as Promise<JiraTokenResponse>;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<JiraTokenResponse> {
    const clientId = this.configService.get<string>('JIRA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('JIRA_CLIENT_SECRET');

    const response = await this.jiraFetch(JIRA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Failed to refresh Jira token. Please reconnect.',
      );
    }

    return response.json() as Promise<JiraTokenResponse>;
  }

  private async fetchAccessibleResource(
    accessToken: string,
  ): Promise<JiraAccessibleResource> {
    const response = await this.jiraFetch(JIRA_ACCESSIBLE_RESOURCES_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Jira accessible resources');
    }

    const resources = (await response.json()) as JiraAccessibleResource[];
    const resource = resources[0];
    if (!resource) {
      throw new BadRequestException(
        'No accessible Jira sites found for this account',
      );
    }

    return resource;
  }

  private async fetchJiraMyself(
    accessToken: string,
    cloudId: string,
  ): Promise<{
    accountId: string | null;
    email: string | null;
    displayName: string | null;
  }> {
    const response = await this.jiraFetch(this.getApiBase(cloudId, '/myself'), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to fetch Jira profile: ${this.parseJiraError(error)}`,
      );
    }

    const data = (await response.json()) as JiraMeResponse;
    return {
      accountId: data.accountId ?? null,
      email: data.emailAddress ?? null,
      displayName: data.displayName ?? null,
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
      throw new BadRequestException('Jira session expired. Please reconnect.');
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const tokens = await this.refreshAccessToken(refreshToken);

    await this.prisma.jiraConnection.update({
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

  private getApiBase(cloudId: string, path: string): string {
    return `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3${path}`;
  }

  private mapIssue(
    issue: JiraSearchIssue,
    siteUrl?: string | null,
  ): JiraIssue {
    const fields = issue.fields ?? {};
    return {
      id: issue.id,
      key: issue.key,
      summary: fields.summary ?? 'Untitled issue',
      status: fields.status?.name ?? 'Unknown',
      priority: fields.priority?.name ?? null,
      issueType: fields.issuetype?.name ?? 'Issue',
      assignee: fields.assignee?.displayName ?? null,
      reporter: fields.reporter?.displayName ?? null,
      updatedAt: fields.updated ?? new Date().toISOString(),
      webUrl: siteUrl ? `${siteUrl.replace(/\/$/, '')}/browse/${issue.key}` : null,
    };
  }

  private async fetchIssues(
    accessToken: string,
    cloudId: string,
    siteUrl: string | null,
    jql: string,
    maxResults = 30,
  ): Promise<JiraIssue[]> {
    const response = await this.jiraFetch(
      this.getApiBase(cloudId, '/search/jql'),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jql,
          maxResults,
          fields: [
            'summary',
            'status',
            'priority',
            'issuetype',
            'assignee',
            'reporter',
            'updated',
          ],
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to fetch Jira issues: ${this.parseJiraError(error)}`,
      );
    }

    const data = (await response.json()) as JiraSearchResponse;
    return (data.issues ?? []).map((issue) => this.mapIssue(issue, siteUrl));
  }

  private async fetchProjects(
    accessToken: string,
    cloudId: string,
    siteUrl: string | null,
  ): Promise<JiraProject[]> {
    const response = await this.jiraFetch(this.getApiBase(cloudId, '/project'), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to fetch Jira projects: ${this.parseJiraError(error)}`,
      );
    }

    const data = (await response.json()) as JiraProjectResponse[];
    return data.map((project) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      projectType: project.projectTypeKey ?? null,
      webUrl: siteUrl
        ? `${siteUrl.replace(/\/$/, '')}/browse/${project.key}`
        : null,
    }));
  }

  private extractSiteName(siteUrl?: string | null): string | null {
    if (!siteUrl) return null;
    try {
      const hostname = new URL(siteUrl).hostname;
      return hostname.split('.')[0] ?? hostname;
    } catch {
      return siteUrl;
    }
  }

  private parseJiraError(raw: string): string {
    try {
      const parsed = JSON.parse(raw) as {
        message?: string;
        errorMessages?: string[];
      };
      if (parsed.errorMessages?.length) {
        return parsed.errorMessages.join(', ');
      }
      return parsed.message ?? raw;
    } catch {
      return raw || 'Unknown Jira API error';
    }
  }
}

export type { JiraIssue, JiraProject, JiraProfile };
