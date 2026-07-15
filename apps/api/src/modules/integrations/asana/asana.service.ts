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
import { UpdateAsanaPreferencesDto } from './dto/update-asana-preferences.dto';
import {
  AsanaProfile,
  AsanaProject,
  AsanaProjectDetail,
  AsanaTask,
} from './types/asana-project.type';
import {
  DEFAULT_ASANA_PREFERENCES,
  AsanaPreferences,
} from './types/asana-preferences.type';

const ASANA_AUTH_URL = 'https://app.asana.com/-/oauth_authorize';
const ASANA_TOKEN_URL = 'https://app.asana.com/-/oauth_token';
const ASANA_REVOKE_URL = 'https://app.asana.com/-/oauth_revoke';
const ASANA_API_BASE = 'https://app.asana.com/api/1.0';

interface AsanaTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  data?: {
    id?: number | string;
    gid?: string;
    name?: string;
    email?: string;
  };
}

interface AsanaApiListResponse<T> {
  data?: T[];
  next_page?: { offset?: string } | null;
}

interface AsanaApiSingleResponse<T> {
  data?: T;
}

@Injectable()
export class AsanaService {
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
    const connection = await this.prisma.asanaConnection.findUnique({
      where: { userId: user.id },
    });

    const connected = connection?.status === IntegrationStatus.CONNECTED;

    let workspaceNames: string[] = [];
    if (connected && connection) {
      try {
        const accessToken = await this.getValidAccessToken(connection);
        workspaceNames = await this.fetchWorkspaceNames(accessToken);
      } catch {
        workspaceNames = [];
      }
    }

    return successResponse({
      connected,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      asanaEmail: connection?.asanaEmail ?? null,
      asanaName: connection?.asanaName ?? null,
      workspaceNames,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateAsanaPreferencesDto,
  ) {
    const connection = await this.prisma.asanaConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Asana account is not connected');
    }

    const preferences: AsanaPreferences = {
      showProjects: dto.showProjects,
    };

    await this.prisma.asanaConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('ASANA_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Asana is not configured. Set ASANA_CLIENT_ID and redirect URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('ASANA_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'ASANA_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes = this.configService.get<string>('ASANA_SCOPES')?.trim();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
    if (scopes) {
      params.set('scope', scopes);
    }

    return successResponse({
      url: `${ASANA_AUTH_URL}?${params.toString()}`,
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

    await this.prisma.asanaConnection.upsert({
      where: { userId },
      create: {
        userId,
        asanaUserGid: profile.gid,
        asanaEmail: profile.email,
        asanaName: profile.name,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_ASANA_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        asanaUserGid: profile.gid,
        asanaEmail: profile.email,
        asanaName: profile.name,
        encryptedAccessToken: encryptedAccess,
        ...(encryptedRefresh ? { encryptedRefreshToken: encryptedRefresh } : {}),
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
            provider: IntegrationProvider.ASANA,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.ASANA,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    const connection = await this.prisma.asanaConnection.findUnique({
      where: { userId: user.id },
    });

    if (connection?.encryptedAccessToken) {
      try {
        const token = decrypt(connection.encryptedAccessToken, this.encryptionKey);
        await fetch(ASANA_REVOKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token }).toString(),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {}
    }

    await this.prisma.asanaConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.asanaConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.ASANA,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Asana disconnected');
  }

  async getProjects(user: AuthenticatedUser) {
    const connection = await this.prisma.asanaConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        projects: [] as AsanaProject[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const projects = await this.fetchProjects(accessToken);
    await this.touchLastSynced(user.id);

    return successResponse({
      connected: true,
      projects,
    });
  }

  async getProjectDetail(user: AuthenticatedUser, projectGid: string) {
    const connection = await this.prisma.asanaConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Asana account is not connected');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const detail = await this.fetchProjectDetail(accessToken, projectGid);
    await this.touchLastSynced(user.id);

    return successResponse({
      connected: true,
      ...detail,
    });
  }

  async getMyTasks(user: AuthenticatedUser) {
    const connection = await this.prisma.asanaConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        tasks: [] as AsanaTask[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const tasks = await this.fetchMyTasks(accessToken);
    await this.touchLastSynced(user.id);

    return successResponse({
      connected: true,
      tasks,
    });
  }

  private resolvePreferences(value: unknown): AsanaPreferences {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_ASANA_PREFERENCES };
    }
    const prefs = value as Record<string, unknown>;
    return {
      showProjects:
        typeof prefs.showProjects === 'boolean'
          ? prefs.showProjects
          : DEFAULT_ASANA_PREFERENCES.showProjects,
    };
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'ASANA_REDIRECT_URI',
      callbackPath: '/api/integrations/asana/callback',
    });
  }

  private async touchLastSynced(userId: string) {
    await this.prisma.asanaConnection.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });
  }

  private async asanaFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Network request failed';
      throw new BadRequestException(
        `Asana API request failed (${message}). Check your internet connection and try again.`,
      );
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<AsanaTokenResponse> {
    const clientId = this.configService.get<string>('ASANA_CLIENT_ID')?.trim();
    const clientSecret = this.configService
      .get<string>('ASANA_CLIENT_SECRET')
      ?.trim();
    const redirectUri = this.getRedirectUri();

    const response = await this.asanaFetch(ASANA_TOKEN_URL, {
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
      throw new BadRequestException(`Asana token exchange failed: ${error}`);
    }

    return response.json() as Promise<AsanaTokenResponse>;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<AsanaTokenResponse> {
    const clientId = this.configService.get<string>('ASANA_CLIENT_ID')?.trim();
    const clientSecret = this.configService
      .get<string>('ASANA_CLIENT_SECRET')
      ?.trim();

    const response = await this.asanaFetch(ASANA_TOKEN_URL, {
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
        error || 'Failed to refresh Asana access token. Please reconnect.',
      );
    }

    return response.json() as Promise<AsanaTokenResponse>;
  }

  private async getValidAccessToken(connection: {
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
    userId: string;
  }): Promise<string> {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Asana session expired. Please reconnect.',
      );
    }

    const expiresSoon =
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt.getTime() < Date.now() + 60_000;

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

    await this.prisma.asanaConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encrypt(tokens.access_token, this.encryptionKey),
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
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

  private async apiGet<T>(
    accessToken: string,
    path: string,
  ): Promise<T> {
    const response = await this.asanaFetch(`${ASANA_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      if (error.includes('workspaces:read')) {
        throw new BadRequestException(
          'Asana token is missing workspace access. Disconnect, turn on Full permissions in the Asana app OAuth settings, Save, then Connect again and paste a new code.',
        );
      }
      throw new BadRequestException(`Asana API error: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  private async fetchWorkspaces(
    accessToken: string,
  ): Promise<Array<{ gid: string; name: string }>> {
    const mePayload = await this.apiGet<
      AsanaApiSingleResponse<{
        workspaces?: Array<{ gid: string; name?: string | null }>;
      }>
    >(accessToken, '/users/me?opt_fields=workspaces.gid,workspaces.name');

    return (mePayload.data?.workspaces ?? [])
      .map((workspace) => ({
        gid: workspace.gid,
        name: workspace.name?.trim() ?? '',
      }))
      .filter((workspace) => Boolean(workspace.gid && workspace.name));
  }

  private async fetchWorkspaceNames(accessToken: string): Promise<string[]> {
    const workspaces = await this.fetchWorkspaces(accessToken);
    return workspaces.map((workspace) => workspace.name);
  }

  private async fetchProfile(accessToken: string): Promise<AsanaProfile> {
    const payload = await this.apiGet<
      AsanaApiSingleResponse<{
        gid?: string;
        name?: string;
        email?: string;
      }>
    >(accessToken, '/users/me');

    return {
      gid: payload.data?.gid ?? null,
      name: payload.data?.name ?? null,
      email: payload.data?.email ?? null,
    };
  }

  private async fetchProjects(accessToken: string): Promise<AsanaProject[]> {
    const workspaces = await this.fetchWorkspaces(accessToken);
    if (workspaces.length === 0) return [];

    const projectsByWorkspace = await Promise.all(
      workspaces.map(async (workspace) => {
        const payload = await this.apiGet<
          AsanaApiListResponse<{
            gid: string;
            name: string;
            notes?: string | null;
            color?: string | null;
            archived?: boolean;
            permalink_url?: string | null;
            modified_at?: string | null;
          }>
        >(
          accessToken,
          `/workspaces/${encodeURIComponent(workspace.gid)}/projects?limit=100&archived=false&opt_fields=name,notes,color,archived,permalink_url,modified_at`,
        );

        return (payload.data ?? []).map((project) => ({
          gid: project.gid,
          name: project.name,
          notes: project.notes?.trim() ? project.notes : null,
          color: project.color ?? null,
          archived: project.archived === true,
          permalinkUrl: project.permalink_url ?? null,
          workspaceName: workspace.name,
          modifiedAt: project.modified_at ?? null,
          taskCount: 0,
        }));
      }),
    );

    return projectsByWorkspace.flat();
  }

  private async fetchProjectDetail(
    accessToken: string,
    projectGid: string,
  ): Promise<AsanaProjectDetail> {
    const [projectPayload, tasksPayload] = await Promise.all([
      this.apiGet<
        AsanaApiSingleResponse<{
          gid: string;
          name: string;
          notes?: string | null;
          color?: string | null;
          archived?: boolean;
          permalink_url?: string | null;
          modified_at?: string | null;
          workspace?: { name?: string | null } | null;
        }>
      >(
        accessToken,
        `/projects/${encodeURIComponent(projectGid)}?opt_fields=name,notes,color,archived,permalink_url,modified_at,workspace.name`,
      ),
      this.apiGet<
        AsanaApiListResponse<{
          gid: string;
          name: string;
          completed?: boolean;
          due_on?: string | null;
          modified_at?: string | null;
          permalink_url?: string | null;
          assignee?: { name?: string | null } | null;
        }>
      >(
        accessToken,
        `/projects/${encodeURIComponent(projectGid)}/tasks?limit=50&opt_fields=name,completed,due_on,modified_at,permalink_url,assignee.name`,
      ),
    ]);

    const projectNode = projectPayload.data;
    if (!projectNode) {
      throw new BadRequestException('Asana project not found');
    }

    const tasks = (tasksPayload.data ?? []).map((task) =>
      this.mapTask(task, projectNode.name),
    );

    return {
      project: {
        gid: projectNode.gid,
        name: projectNode.name,
        notes: projectNode.notes?.trim() ? projectNode.notes : null,
        color: projectNode.color ?? null,
        archived: projectNode.archived === true,
        permalinkUrl: projectNode.permalink_url ?? null,
        workspaceName: projectNode.workspace?.name ?? null,
        modifiedAt: projectNode.modified_at ?? null,
        taskCount: tasks.length,
      },
      tasks,
    };
  }

  private async fetchMyTasks(accessToken: string): Promise<AsanaTask[]> {
    const workspaces = await this.fetchWorkspaces(accessToken);
    if (workspaces.length === 0) return [];

    const me = await this.fetchProfile(accessToken);
    const taskChunks = await Promise.all(
      workspaces.map(async (workspace) => {
        try {
          const listPayload = await this.apiGet<
            AsanaApiSingleResponse<{ gid: string }>
          >(
            accessToken,
            `/users/me/user_task_list?workspace=${encodeURIComponent(workspace.gid)}&opt_fields=gid`,
          );

          const listGid = listPayload.data?.gid;
          if (listGid) {
            const tasksPayload = await this.apiGet<
              AsanaApiListResponse<{
                gid: string;
                name: string;
                completed?: boolean;
                due_on?: string | null;
                modified_at?: string | null;
                permalink_url?: string | null;
                assignee?: { name?: string | null } | null;
                projects?: Array<{ name?: string | null }>;
              }>
            >(
              accessToken,
              `/user_task_lists/${encodeURIComponent(listGid)}/tasks?limit=50&completed_since=now&opt_fields=name,completed,due_on,modified_at,permalink_url,assignee.name,projects.name`,
            );

            return (tasksPayload.data ?? []).map((task) =>
              this.mapTask(task, task.projects?.[0]?.name ?? null),
            );
          }
        } catch {
          // Fall through to workspace-scoped assignee query.
        }

        if (!me.gid) return [] as AsanaTask[];

        const payload = await this.apiGet<
          AsanaApiListResponse<{
            gid: string;
            name: string;
            completed?: boolean;
            due_on?: string | null;
            modified_at?: string | null;
            permalink_url?: string | null;
            assignee?: { name?: string | null } | null;
            projects?: Array<{ name?: string | null }>;
          }>
        >(
          accessToken,
          `/tasks?assignee=${encodeURIComponent(me.gid)}&workspace=${encodeURIComponent(workspace.gid)}&completed_since=now&limit=50&opt_fields=name,completed,due_on,modified_at,permalink_url,assignee.name,projects.name`,
        );

        return (payload.data ?? []).map((task) =>
          this.mapTask(task, task.projects?.[0]?.name ?? null),
        );
      }),
    );

    const seen = new Set<string>();
    return taskChunks
      .flat()
      .filter((task) => {
        if (seen.has(task.gid)) return false;
        seen.add(task.gid);
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const aDue = a.dueOn ?? '9999-99-99';
        const bDue = b.dueOn ?? '9999-99-99';
        return aDue.localeCompare(bDue);
      });
  }

  private mapTask(
    task: {
      gid: string;
      name: string;
      completed?: boolean;
      due_on?: string | null;
      modified_at?: string | null;
      permalink_url?: string | null;
      assignee?: { name?: string | null } | null;
    },
    projectName: string | null,
  ): AsanaTask {
    return {
      gid: task.gid,
      name: task.name,
      completed: task.completed === true,
      dueOn: task.due_on ?? null,
      assigneeName: task.assignee?.name ?? null,
      projectName,
      permalinkUrl: task.permalink_url ?? null,
      modifiedAt: task.modified_at ?? null,
    };
  }
}
