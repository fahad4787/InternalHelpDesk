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
import { UpdateDynamicsPreferencesDto } from './dto/update-dynamics-preferences.dto';
import {
  DEFAULT_DYNAMICS_PREFERENCES,
  DynamicsAccount,
  DynamicsContact,
  DynamicsOpportunity,
  DynamicsPreferences,
  DynamicsProfile,
} from './types/dynamics-preferences.type';

interface DynamicsTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface DataverseListResponse<T> {
  value?: T[];
}

interface DataverseContactRow {
  contactid?: string;
  fullname?: string;
  emailaddress1?: string;
  telephone1?: string;
  jobtitle?: string;
  modifiedon?: string;
}

interface DataverseAccountRow {
  accountid?: string;
  name?: string;
  telephone1?: string;
  websiteurl?: string;
  address1_city?: string;
  modifiedon?: string;
}

interface DataverseOpportunityRow {
  opportunityid?: string;
  name?: string;
  estimatedvalue?: number;
  closeprobability?: number;
  estimatedclosedate?: string;
  statuscode?: number;
  modifiedon?: string;
}

@Injectable()
export class DynamicsService {
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
    const connection = await this.prisma.dynamicsConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      dynamicsEmail: connection?.dynamicsEmail ?? null,
      orgUrl: connection?.orgUrl ?? this.getOrgUrl(),
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateDynamicsPreferencesDto,
  ) {
    const connection = await this.prisma.dynamicsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Microsoft Dynamics 365 is not connected');
    }

    const preferences: DynamicsPreferences = {
      showContacts: dto.showContacts,
      showAccounts: dto.showAccounts,
      showOpportunities: dto.showOpportunities,
    };

    await this.prisma.dynamicsConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService
      .get<string>('DYNAMICS_CLIENT_ID')
      ?.trim();
    const redirectUri = this.getRedirectUri();
    const orgUrl = this.getOrgUrl();

    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Dynamics is not configured. Set DYNAMICS_CLIENT_ID and DYNAMICS_REDIRECT_URI.',
      );
    }

    if (!orgUrl) {
      throw new BadRequestException(
        'Dynamics org URL is missing. Set DYNAMICS_ORG_URL (e.g. https://yourorg.crm.dynamics.com).',
      );
    }

    const clientSecret = this.configService
      .get<string>('DYNAMICS_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'DYNAMICS_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes = this.getScopes(orgUrl);
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

    const orgUrl = this.getOrgUrl();
    if (!orgUrl) {
      throw new BadRequestException(
        'Dynamics org URL is missing. Set DYNAMICS_ORG_URL.',
      );
    }

    const tokens = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchDynamicsProfile(tokens.access_token, orgUrl);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;

    await this.prisma.dynamicsConnection.upsert({
      where: { userId },
      create: {
        userId,
        dynamicsEmail: profile.email,
        dynamicsUserId: profile.dynamicsUserId,
        orgUrl,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_DYNAMICS_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        dynamicsEmail: profile.email,
        dynamicsUserId: profile.dynamicsUserId,
        orgUrl,
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
            provider: IntegrationProvider.DYNAMICS_365,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.DYNAMICS_365,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.dynamicsConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.dynamicsConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.DYNAMICS_365,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Microsoft Dynamics 365 disconnected');
  }

  async getContacts(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.dynamicsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        contacts: [] as DynamicsContact[],
      });
    }

    const orgUrl = connection.orgUrl || this.getOrgUrl();
    if (!orgUrl) {
      throw new BadRequestException('Dynamics org URL is missing');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const contacts = await this.fetchContacts(accessToken, orgUrl, limit);

    await this.prisma.dynamicsConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      dynamicsEmail: connection.dynamicsEmail,
      contacts,
    });
  }

  async getAccounts(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.dynamicsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        accounts: [] as DynamicsAccount[],
      });
    }

    const orgUrl = connection.orgUrl || this.getOrgUrl();
    if (!orgUrl) {
      throw new BadRequestException('Dynamics org URL is missing');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const accounts = await this.fetchAccounts(accessToken, orgUrl, limit);

    await this.prisma.dynamicsConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      dynamicsEmail: connection.dynamicsEmail,
      accounts,
    });
  }

  async getOpportunities(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.dynamicsConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        opportunities: [] as DynamicsOpportunity[],
      });
    }

    const orgUrl = connection.orgUrl || this.getOrgUrl();
    if (!orgUrl) {
      throw new BadRequestException('Dynamics org URL is missing');
    }

    const accessToken = await this.getValidAccessToken(connection);
    const opportunities = await this.fetchOpportunities(
      accessToken,
      orgUrl,
      limit,
    );

    await this.prisma.dynamicsConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      dynamicsEmail: connection.dynamicsEmail,
      opportunities,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_DYNAMICS_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showContacts:
        typeof raw.showContacts === 'boolean'
          ? raw.showContacts
          : DEFAULT_DYNAMICS_PREFERENCES.showContacts,
      showAccounts:
        typeof raw.showAccounts === 'boolean'
          ? raw.showAccounts
          : DEFAULT_DYNAMICS_PREFERENCES.showAccounts,
      showOpportunities:
        typeof raw.showOpportunities === 'boolean'
          ? raw.showOpportunities
          : DEFAULT_DYNAMICS_PREFERENCES.showOpportunities,
    } satisfies DynamicsPreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'DYNAMICS_REDIRECT_URI',
      callbackPath: '/api/integrations/dynamics/callback',
    });
  }

  private getOrgUrl(): string | null {
    const raw = this.configService.get<string>('DYNAMICS_ORG_URL')?.trim();
    if (!raw) return null;
    return raw.replace(/\/+$/, '');
  }

  private getScopes(orgUrl: string): string {
    const configured = this.configService.get<string>('DYNAMICS_SCOPES')?.trim();
    if (configured) return configured;
    return `${orgUrl}/user_impersonation offline_access`;
  }

  private getTenantId(): string {
    return (
      this.configService.get<string>('DYNAMICS_TENANT_ID')?.trim() || 'common'
    );
  }

  private getAuthBaseUrl(): string {
    return `https://login.microsoftonline.com/${this.getTenantId()}/oauth2/v2.0`;
  }

  private apiBase(orgUrl: string): string {
    return `${orgUrl}/api/data/v9.2`;
  }

  private recordUrl(
    orgUrl: string,
    entityLogicalName: string,
    id: string,
  ): string {
    return `${orgUrl}/main.aspx?etn=${encodeURIComponent(entityLogicalName)}&id=${encodeURIComponent(id)}&pagetype=entityrecord`;
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<DynamicsTokenResponse> {
    const clientId = this.configService.get<string>('DYNAMICS_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'DYNAMICS_CLIENT_SECRET',
    );
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Dynamics is not configured');
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
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to exchange Dynamics authorization code: ${error}`,
      );
    }

    return response.json() as Promise<DynamicsTokenResponse>;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<DynamicsTokenResponse> {
    const clientId = this.configService.get<string>('DYNAMICS_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'DYNAMICS_CLIENT_SECRET',
    );
    const orgUrl = this.getOrgUrl();
    if (!clientId || !clientSecret || !orgUrl) {
      throw new BadRequestException('Dynamics is not configured');
    }

    const response = await fetch(`${this.getAuthBaseUrl()}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: this.getScopes(orgUrl),
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || 'Failed to refresh Dynamics access token. Please reconnect.',
      );
    }

    return response.json() as Promise<DynamicsTokenResponse>;
  }

  private async getValidAccessToken(connection: {
    userId: string;
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
  }) {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Dynamics token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'Dynamics session expired. Please reconnect your account.',
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

    await this.prisma.dynamicsConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  }

  private async fetchDynamicsProfile(
    accessToken: string,
    orgUrl: string,
  ): Promise<DynamicsProfile> {
    const whoAmI = await this.dataverseFetch<{ UserId?: string }>(
      `${this.apiBase(orgUrl)}/WhoAmI`,
      accessToken,
    );

    const userId = whoAmI.UserId ?? null;
    if (!userId) {
      return { email: null, dynamicsUserId: null };
    }

    const user = await this.dataverseFetch<{
      internalemailaddress?: string;
      fullname?: string;
    }>(
      `${this.apiBase(orgUrl)}/systemusers(${userId})?$select=internalemailaddress,fullname`,
      accessToken,
    );

    return {
      email: user.internalemailaddress ?? null,
      dynamicsUserId: userId,
    };
  }

  private async fetchContacts(
    accessToken: string,
    orgUrl: string,
    limit: number,
  ): Promise<DynamicsContact[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      $select: 'fullname,emailaddress1,telephone1,jobtitle,modifiedon',
      $orderby: 'modifiedon desc',
      $top: String(capped),
    });

    const payload = await this.dataverseFetch<
      DataverseListResponse<DataverseContactRow>
    >(
      `${this.apiBase(orgUrl)}/contacts?${params.toString()}`,
      accessToken,
    );

    return (payload.value ?? []).map((row) => {
      const id = row.contactid ?? '';
      return {
        id,
        name: row.fullname?.trim() || 'Untitled contact',
        email: row.emailaddress1 ?? null,
        phone: row.telephone1 ?? null,
        jobTitle: row.jobtitle ?? null,
        updatedAt: row.modifiedon ?? new Date().toISOString(),
        webUrl: id ? this.recordUrl(orgUrl, 'contact', id) : null,
      };
    });
  }

  private async fetchAccounts(
    accessToken: string,
    orgUrl: string,
    limit: number,
  ): Promise<DynamicsAccount[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      $select: 'name,telephone1,websiteurl,address1_city,modifiedon',
      $orderby: 'modifiedon desc',
      $top: String(capped),
    });

    const payload = await this.dataverseFetch<
      DataverseListResponse<DataverseAccountRow>
    >(
      `${this.apiBase(orgUrl)}/accounts?${params.toString()}`,
      accessToken,
    );

    return (payload.value ?? []).map((row) => {
      const id = row.accountid ?? '';
      return {
        id,
        name: row.name?.trim() || 'Untitled account',
        phone: row.telephone1 ?? null,
        website: row.websiteurl ?? null,
        city: row.address1_city ?? null,
        updatedAt: row.modifiedon ?? new Date().toISOString(),
        webUrl: id ? this.recordUrl(orgUrl, 'account', id) : null,
      };
    });
  }

  private async fetchOpportunities(
    accessToken: string,
    orgUrl: string,
    limit: number,
  ): Promise<DynamicsOpportunity[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      $select:
        'name,estimatedvalue,closeprobability,estimatedclosedate,statuscode,modifiedon',
      $orderby: 'modifiedon desc',
      $top: String(capped),
    });

    const payload = await this.dataverseFetch<
      DataverseListResponse<DataverseOpportunityRow>
    >(
      `${this.apiBase(orgUrl)}/opportunities?${params.toString()}`,
      accessToken,
    );

    return (payload.value ?? []).map((row) => {
      const id = row.opportunityid ?? '';
      return {
        id,
        name: row.name?.trim() || 'Untitled opportunity',
        estimatedValue:
          typeof row.estimatedvalue === 'number' ? row.estimatedvalue : null,
        closeProbability:
          typeof row.closeprobability === 'number'
            ? row.closeprobability
            : null,
        estimatedCloseDate: row.estimatedclosedate ?? null,
        statusCode: typeof row.statuscode === 'number' ? row.statuscode : null,
        updatedAt: row.modifiedon ?? new Date().toISOString(),
        webUrl: id ? this.recordUrl(orgUrl, 'opportunity', id) : null,
      };
    });
  }

  private async dataverseFetch<T>(
    url: string,
    accessToken: string,
  ): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || `Dynamics request failed (${response.status})`,
      );
    }

    return (await response.json()) as T;
  }
}
