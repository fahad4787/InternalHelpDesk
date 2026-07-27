import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationProvider, IntegrationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/types/api-response.type';
import { decrypt, encrypt, resolveEncryptionKey } from '../../../common/utils/encryption.util';
import { successResponse } from '../../../common/utils/api-response.util';
import {
  createOAuthState,
  verifyOAuthState,
} from '../google-calendar/utils/oauth-state.util';
import { resolveOAuthRedirectUri } from '../utils/resolve-oauth-redirect-uri.util';
import { UpdateZohoCrmPreferencesDto } from './dto/update-zoho-crm-preferences.dto';
import {
  DEFAULT_ZOHO_CRM_PREFERENCES,
  ZohoCrmContact,
  ZohoCrmDeal,
  ZohoCrmLead,
  ZohoCrmPreferences,
} from './types/zoho-crm-preferences.type';

const DEFAULT_ACCOUNTS_URL = 'https://accounts.zoho.com';
const DEFAULT_API_DOMAIN = 'https://www.zohoapis.com';
const DEFAULT_ZOHO_CRM_SCOPES = [
  'ZohoCRM.modules.contacts.READ',
  'ZohoCRM.modules.deals.READ',
  'ZohoCRM.modules.leads.READ',
  'ZohoCRM.users.READ',
].join(',');

interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  api_domain?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
}

interface ZohoUserRecord {
  id?: string;
  email?: string;
  full_name?: string;
}

interface ZohoUsersResponse {
  users?: ZohoUserRecord[];
}

interface ZohoRecord {
  id?: string;
  Full_Name?: string;
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Company?: string;
  Title?: string;
  Phone?: string;
  Deal_Name?: string;
  Amount?: number | string | null;
  Stage?: string;
  Closing_Date?: string;
  Lead_Status?: string;
  Lead_Source?: string;
  Modified_Time?: string;
}

interface ZohoListResponse {
  data?: ZohoRecord[];
}

@Injectable()
export class ZohoCrmService {
  private encryptionKey: string;
  private jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = resolveEncryptionKey(this.configService);
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret');
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.zohoCrmConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      zohoEmail: connection?.zohoEmail ?? null,
      apiDomain: connection?.apiDomain ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateZohoCrmPreferencesDto,
  ) {
    const connection = await this.prisma.zohoCrmConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Zoho CRM account is not connected');
    }

    const preferences: ZohoCrmPreferences = {
      showContacts: dto.showContacts,
      showDeals: dto.showDeals,
      showLeads: dto.showLeads,
    };

    await this.prisma.zohoCrmConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService.get<string>('ZOHO_CRM_CLIENT_ID')?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Zoho CRM is not configured. Set ZOHO_CRM_CLIENT_ID and ZOHO_CRM_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('ZOHO_CRM_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'ZOHO_CRM_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('ZOHO_CRM_SCOPES')?.trim() ||
      DEFAULT_ZOHO_CRM_SCOPES;
    const accountsUrl = this.getAccountsUrl();

    const params = new URLSearchParams({
      scope: scopes,
      client_id: clientId,
      response_type: 'code',
      access_type: 'offline',
      redirect_uri: redirectUri,
      prompt: 'consent',
      state,
    });

    return successResponse({
      url: `${accountsUrl}/oauth/v2/auth?${params.toString()}`,
    });
  }

  async handleCallback(
    code: string,
    state: string,
    accountsServer?: string,
  ) {
    const userId = verifyOAuthState(state, this.jwtSecret);
    if (!userId) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    const accountsUrl = this.normalizeAccountsUrl(
      accountsServer || this.getAccountsUrl(),
    );
    const tokens = await this.exchangeCodeForTokens(code, accountsUrl);
    const apiDomain = (tokens.api_domain || DEFAULT_API_DOMAIN).replace(
      /\/$/,
      '',
    );
    const userInfo = await this.fetchCurrentUser(tokens.access_token, apiDomain);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;
    const expiresIn = tokens.expires_in ?? 3_600;

    await this.prisma.zohoCrmConnection.upsert({
      where: { userId },
      create: {
        userId,
        zohoUserId: userInfo.id ?? null,
        zohoEmail: userInfo.email ?? null,
        apiDomain,
        accountsUrl,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_ZOHO_CRM_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        zohoUserId: userInfo.id ?? null,
        zohoEmail: userInfo.email ?? null,
        apiDomain,
        accountsUrl,
        encryptedAccessToken: encryptedAccess,
        ...(encryptedRefresh ? { encryptedRefreshToken: encryptedRefresh } : {}),
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
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
            provider: IntegrationProvider.ZOHO_CRM,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.ZOHO_CRM,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.zohoCrmConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.zohoCrmConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.ZOHO_CRM,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Zoho CRM disconnected');
  }

  async getContacts(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.zohoCrmConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        contacts: [] as ZohoCrmContact[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const apiDomain = connection.apiDomain || DEFAULT_API_DOMAIN;
    const contacts = await this.fetchContacts(accessToken, apiDomain, limit);

    await this.prisma.zohoCrmConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      zohoEmail: connection.zohoEmail,
      contacts,
    });
  }

  async getDeals(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.zohoCrmConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        deals: [] as ZohoCrmDeal[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const apiDomain = connection.apiDomain || DEFAULT_API_DOMAIN;
    const deals = await this.fetchDeals(accessToken, apiDomain, limit);

    await this.prisma.zohoCrmConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      zohoEmail: connection.zohoEmail,
      deals,
    });
  }

  async getLeads(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.zohoCrmConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        leads: [] as ZohoCrmLead[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const apiDomain = connection.apiDomain || DEFAULT_API_DOMAIN;
    const leads = await this.fetchLeads(accessToken, apiDomain, limit);

    await this.prisma.zohoCrmConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      zohoEmail: connection.zohoEmail,
      leads,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_ZOHO_CRM_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showContacts:
        typeof raw.showContacts === 'boolean'
          ? raw.showContacts
          : DEFAULT_ZOHO_CRM_PREFERENCES.showContacts,
      showDeals:
        typeof raw.showDeals === 'boolean'
          ? raw.showDeals
          : DEFAULT_ZOHO_CRM_PREFERENCES.showDeals,
      showLeads:
        typeof raw.showLeads === 'boolean'
          ? raw.showLeads
          : DEFAULT_ZOHO_CRM_PREFERENCES.showLeads,
    } satisfies ZohoCrmPreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'ZOHO_CRM_REDIRECT_URI',
      callbackPath: '/api/integrations/zoho-crm/callback',
    });
  }

  private getAccountsUrl(): string {
    return this.normalizeAccountsUrl(
      this.configService.get<string>('ZOHO_CRM_ACCOUNTS_URL')?.trim() ||
        DEFAULT_ACCOUNTS_URL,
    );
  }

  private normalizeAccountsUrl(value: string): string {
    const trimmed = value.trim().replace(/\/$/, '');
    if (!trimmed) return DEFAULT_ACCOUNTS_URL;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  private async exchangeCodeForTokens(code: string, accountsUrl: string) {
    const clientId = this.configService.get<string>('ZOHO_CRM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOHO_CRM_CLIENT_SECRET');
    const redirectUri = this.getRedirectUri();

    const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        redirect_uri: redirectUri,
        code,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const payload = (await response.json()) as ZohoTokenResponse;
    if (!response.ok || !payload.access_token) {
      throw new BadRequestException(
        payload.error || 'Failed to exchange Zoho CRM authorization code',
      );
    }

    return payload;
  }

  private async refreshAccessToken(
    refreshToken: string,
    accountsUrl: string,
  ) {
    const clientId = this.configService.get<string>('ZOHO_CRM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOHO_CRM_CLIENT_SECRET');

    const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const payload = (await response.json()) as ZohoTokenResponse;
    if (!response.ok || !payload.access_token) {
      throw new BadRequestException(
        payload.error ||
          'Failed to refresh Zoho CRM access token. Please reconnect.',
      );
    }

    return payload;
  }

  private async getValidAccessToken(connection: {
    userId: string;
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
    accountsUrl: string | null;
    apiDomain: string | null;
  }) {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Zoho CRM token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'Zoho CRM session expired. Please reconnect your account.',
      );
    }

    const refreshToken = decrypt(
      connection.encryptedRefreshToken,
      this.encryptionKey,
    );
    const accountsUrl = this.normalizeAccountsUrl(
      connection.accountsUrl || this.getAccountsUrl(),
    );
    const tokens = await this.refreshAccessToken(refreshToken, accountsUrl);
    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const expiresIn = tokens.expires_in ?? 3_600;
    const apiDomain = tokens.api_domain
      ? tokens.api_domain.replace(/\/$/, '')
      : connection.apiDomain;

    await this.prisma.zohoCrmConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        ...(apiDomain ? { apiDomain } : {}),
      },
    });

    return tokens.access_token;
  }

  private async fetchCurrentUser(
    accessToken: string,
    apiDomain: string,
  ): Promise<ZohoUserRecord> {
    try {
      const payload = await this.zohoFetch<ZohoUsersResponse>(
        `${apiDomain}/crm/v2/users?type=CurrentUser`,
        accessToken,
      );
      return payload.users?.[0] ?? {};
    } catch {
      return {};
    }
  }

  private buildRecordUrl(
    apiDomain: string,
    module: 'Contacts' | 'Deals' | 'Leads',
    id: string,
  ): string | null {
    if (!id) return null;
    try {
      const host = new URL(apiDomain).hostname.replace(
        'www.zohoapis',
        'crm.zoho',
      );
      return `https://${host}/crm/tab/${module}/${id}`;
    } catch {
      return `https://crm.zoho.com/crm/tab/${module}/${id}`;
    }
  }

  private recordName(record: ZohoRecord, fallback: string): string {
    const full = record.Full_Name?.trim();
    if (full) return full;
    const parts = [record.First_Name, record.Last_Name]
      .filter(Boolean)
      .join(' ')
      .trim();
    return parts || fallback;
  }

  private async fetchContacts(
    accessToken: string,
    apiDomain: string,
    limit: number,
  ): Promise<ZohoCrmContact[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      per_page: String(capped),
      fields:
        'Full_Name,First_Name,Last_Name,Email,Company,Title,Phone,Modified_Time',
      sort_by: 'Modified_Time',
      sort_order: 'desc',
    });

    const payload = await this.zohoFetch<ZohoListResponse>(
      `${apiDomain}/crm/v2/Contacts?${params.toString()}`,
      accessToken,
    );

    return (payload.data ?? []).slice(0, limit).map((entry) => {
      const id = entry.id ?? '';
      return {
        id,
        name: this.recordName(entry, entry.Email || 'Unnamed contact'),
        email: entry.Email ?? null,
        company: entry.Company ?? null,
        title: entry.Title ?? null,
        phone: entry.Phone ?? null,
        updatedAt: entry.Modified_Time ?? new Date().toISOString(),
        webUrl: this.buildRecordUrl(apiDomain, 'Contacts', id),
      };
    });
  }

  private async fetchDeals(
    accessToken: string,
    apiDomain: string,
    limit: number,
  ): Promise<ZohoCrmDeal[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      per_page: String(capped),
      fields: 'Deal_Name,Amount,Stage,Closing_Date,Modified_Time',
      sort_by: 'Modified_Time',
      sort_order: 'desc',
    });

    const payload = await this.zohoFetch<ZohoListResponse>(
      `${apiDomain}/crm/v2/Deals?${params.toString()}`,
      accessToken,
    );

    return (payload.data ?? []).slice(0, limit).map((entry) => {
      const id = entry.id ?? '';
      return {
        id,
        name: entry.Deal_Name || 'Untitled deal',
        amount:
          entry.Amount === null || entry.Amount === undefined
            ? null
            : String(entry.Amount),
        stage: entry.Stage ?? null,
        closingDate: entry.Closing_Date ?? null,
        updatedAt: entry.Modified_Time ?? new Date().toISOString(),
        webUrl: this.buildRecordUrl(apiDomain, 'Deals', id),
      };
    });
  }

  private async fetchLeads(
    accessToken: string,
    apiDomain: string,
    limit: number,
  ): Promise<ZohoCrmLead[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const params = new URLSearchParams({
      per_page: String(capped),
      fields:
        'Full_Name,First_Name,Last_Name,Email,Company,Lead_Status,Lead_Source,Modified_Time',
      sort_by: 'Modified_Time',
      sort_order: 'desc',
    });

    const payload = await this.zohoFetch<ZohoListResponse>(
      `${apiDomain}/crm/v2/Leads?${params.toString()}`,
      accessToken,
    );

    return (payload.data ?? []).slice(0, limit).map((entry) => {
      const id = entry.id ?? '';
      return {
        id,
        name: this.recordName(entry, entry.Email || 'Unnamed lead'),
        email: entry.Email ?? null,
        company: entry.Company ?? null,
        status: entry.Lead_Status ?? null,
        source: entry.Lead_Source ?? null,
        updatedAt: entry.Modified_Time ?? new Date().toISOString(),
        webUrl: this.buildRecordUrl(apiDomain, 'Leads', id),
      };
    });
  }

  private async zohoFetch<T>(
    url: string,
    accessToken: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException(
          'Zoho CRM access was denied. Reconnect your Zoho CRM account.',
        );
      }
      // Empty module lists often return 204/204-like; Zoho may return 204 or empty
      if (response.status === 204) {
        return { data: [] } as T;
      }
      throw new BadRequestException(
        body || `Zoho CRM request failed (${response.status})`,
      );
    }

    if (response.status === 204) {
      return { data: [] } as T;
    }

    return (await response.json()) as T;
  }
}
