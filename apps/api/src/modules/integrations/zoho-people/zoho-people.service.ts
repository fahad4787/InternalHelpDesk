import { BadRequestException, Injectable } from '@nestjs/common';
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
import { UpdateZohoPeoplePreferencesDto } from './dto/update-zoho-people-preferences.dto';
import {
  DEFAULT_ZOHO_PEOPLE_PREFERENCES,
  ZohoPeopleEmployee,
  ZohoPeopleLeave,
  ZohoPeoplePreferences,
} from './types/zoho-people-preferences.type';

const DEFAULT_ACCOUNTS_URL = 'https://accounts.zoho.com';
const DEFAULT_API_DOMAIN = 'https://www.zohoapis.com';
const DEFAULT_ZOHO_PEOPLE_SCOPES = [
  'ZOHOPEOPLE.forms.READ',
  'ZOHOPEOPLE.employee.ALL',
  'ZOHOPEOPLE.leave.READ',
].join(',');

interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  api_domain?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
}

@Injectable()
export class ZohoPeopleService {
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
    const connection = await this.prisma.zohoPeopleConnection.findUnique({
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
    dto: UpdateZohoPeoplePreferencesDto,
  ) {
    const connection = await this.prisma.zohoPeopleConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Zoho People account is not connected');
    }

    const preferences: ZohoPeoplePreferences = {
      showEmployees: dto.showEmployees,
      showLeave: dto.showLeave,
    };

    await this.prisma.zohoPeopleConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService
      .get<string>('ZOHO_PEOPLE_CLIENT_ID')
      ?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Zoho People is not configured. Set ZOHO_PEOPLE_CLIENT_ID and ZOHO_PEOPLE_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('ZOHO_PEOPLE_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'ZOHO_PEOPLE_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const state = createOAuthState(user.id, this.jwtSecret);
    const scopes =
      this.configService.get<string>('ZOHO_PEOPLE_SCOPES')?.trim() ||
      DEFAULT_ZOHO_PEOPLE_SCOPES;
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
    const profile = await this.fetchMyDetails(tokens.access_token, apiDomain);

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;
    const expiresIn = tokens.expires_in ?? 3_600;

    await this.prisma.zohoPeopleConnection.upsert({
      where: { userId },
      create: {
        userId,
        zohoUserId: profile.id,
        zohoEmail: profile.email,
        apiDomain,
        accountsUrl,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_ZOHO_PEOPLE_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        zohoUserId: profile.id,
        zohoEmail: profile.email,
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
            provider: IntegrationProvider.ZOHO_PEOPLE,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.ZOHO_PEOPLE,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.zohoPeopleConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.zohoPeopleConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.ZOHO_PEOPLE,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Zoho People disconnected');
  }

  async getEmployees(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.zohoPeopleConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        employees: [] as ZohoPeopleEmployee[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const apiDomain = connection.apiDomain || DEFAULT_API_DOMAIN;
    const employees = await this.fetchEmployees(accessToken, apiDomain, limit);

    await this.prisma.zohoPeopleConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      zohoEmail: connection.zohoEmail,
      employees,
    });
  }

  async getLeave(user: AuthenticatedUser, limit = 10) {
    const connection = await this.prisma.zohoPeopleConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return successResponse({
        connected: false,
        leave: [] as ZohoPeopleLeave[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const apiDomain = connection.apiDomain || DEFAULT_API_DOMAIN;
    const leave = await this.fetchLeave(accessToken, apiDomain, limit);

    await this.prisma.zohoPeopleConnection.update({
      where: { userId: user.id },
      data: { lastSyncedAt: new Date() },
    });

    return successResponse({
      connected: true,
      zohoEmail: connection.zohoEmail,
      leave,
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_ZOHO_PEOPLE_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showEmployees:
        typeof raw.showEmployees === 'boolean'
          ? raw.showEmployees
          : DEFAULT_ZOHO_PEOPLE_PREFERENCES.showEmployees,
      showLeave:
        typeof raw.showLeave === 'boolean'
          ? raw.showLeave
          : DEFAULT_ZOHO_PEOPLE_PREFERENCES.showLeave,
    } satisfies ZohoPeoplePreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'ZOHO_PEOPLE_REDIRECT_URI',
      callbackPath: '/api/integrations/zoho-people/callback',
    });
  }

  private getAccountsUrl(): string {
    return this.normalizeAccountsUrl(
      this.configService.get<string>('ZOHO_PEOPLE_ACCOUNTS_URL')?.trim() ||
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

  private peopleHostFromApiDomain(apiDomain: string): string {
    try {
      const host = new URL(apiDomain).hostname.replace(
        'www.zohoapis',
        'people.zoho',
      );
      return `https://${host}`;
    } catch {
      return 'https://people.zoho.com';
    }
  }

  private async exchangeCodeForTokens(code: string, accountsUrl: string) {
    const clientId = this.configService.get<string>('ZOHO_PEOPLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'ZOHO_PEOPLE_CLIENT_SECRET',
    );
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
        payload.error || 'Failed to exchange Zoho People authorization code',
      );
    }

    return payload;
  }

  private async refreshAccessToken(refreshToken: string, accountsUrl: string) {
    const clientId = this.configService.get<string>('ZOHO_PEOPLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'ZOHO_PEOPLE_CLIENT_SECRET',
    );

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
          'Failed to refresh Zoho People access token. Please reconnect.',
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
        'Zoho People token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'Zoho People session expired. Please reconnect your account.',
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

    await this.prisma.zohoPeopleConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        ...(apiDomain ? { apiDomain } : {}),
      },
    });

    return tokens.access_token;
  }

  private async fetchMyDetails(
    accessToken: string,
    apiDomain: string,
  ): Promise<{ id: string | null; email: string | null }> {
    try {
      const peopleHost = this.peopleHostFromApiDomain(apiDomain);
      const payload = await this.zohoFetch<Record<string, unknown>>(
        `${peopleHost}/people/api/getMyDetails`,
        accessToken,
      );
      const result =
        (payload.response as { result?: Record<string, unknown> } | undefined)
          ?.result ?? payload;
      const email =
        typeof result.EmailID === 'string'
          ? result.EmailID
          : typeof result.email === 'string'
            ? result.email
            : null;
      const id =
        typeof result.Zoho_ID === 'string' || typeof result.Zoho_ID === 'number'
          ? String(result.Zoho_ID)
          : typeof result.ZUID === 'string' || typeof result.ZUID === 'number'
            ? String(result.ZUID)
            : null;
      return { id, email };
    } catch {
      return { id: null, email: null };
    }
  }

  private pickField(
    record: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return null;
  }

  private async fetchEmployees(
    accessToken: string,
    apiDomain: string,
    limit: number,
  ): Promise<ZohoPeopleEmployee[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const peopleHost = this.peopleHostFromApiDomain(apiDomain);
    const params = new URLSearchParams({
      sIndex: '1',
      limit: String(capped),
    });

    const payload = await this.zohoFetch<{
      response?: {
        result?: Array<Record<string, Array<Record<string, unknown>>>>;
      };
    }>(
      `${peopleHost}/people/api/forms/employee/getRecords?${params.toString()}`,
      accessToken,
    );

    const rows = payload.response?.result ?? [];
    const employees: ZohoPeopleEmployee[] = [];

    for (const row of rows) {
      for (const [recordId, entries] of Object.entries(row)) {
        const record = Array.isArray(entries) ? entries[0] : null;
        if (!record) continue;
        const first = this.pickField(record, ['FirstName', 'First_Name']);
        const last = this.pickField(record, ['LastName', 'Last_Name']);
        const name =
          [first, last].filter(Boolean).join(' ').trim() ||
          this.pickField(record, ['EmployeeID', 'Employee_ID', 'EmailID']) ||
          'Unnamed employee';
        employees.push({
          id: recordId,
          name,
          email: this.pickField(record, ['EmailID', 'Email', 'Work_Email']),
          employeeId: this.pickField(record, ['EmployeeID', 'Employee_ID']),
          department: this.pickField(record, ['Department', 'Department_Name']),
          designation: this.pickField(record, [
            'Designation',
            'Designation_Name',
          ]),
          webUrl: `${peopleHost}/zp#attendance/employee-profile/${recordId}`,
        });
      }
    }

    return employees.slice(0, limit);
  }

  private formatPeopleDate(date: Date): string {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const dd = String(date.getDate()).padStart(2, '0');
    return `${dd}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  private async fetchLeave(
    accessToken: string,
    apiDomain: string,
    limit: number,
  ): Promise<ZohoPeopleLeave[]> {
    const capped = Math.min(Math.max(limit, 1), 50);
    const peopleHost = this.peopleHostFromApiDomain(apiDomain);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    const params = new URLSearchParams({
      from: this.formatPeopleDate(from),
      to: this.formatPeopleDate(to),
      dataSelect: 'ALL',
      limit: String(capped),
      startIndex: '0',
    });

    const payload = await this.zohoFetch<Record<string, unknown>>(
      `${peopleHost}/people/api/v2/leavetracker/leaves/records?${params.toString()}`,
      accessToken,
    );

    const leave: ZohoPeopleLeave[] = [];
    for (const [id, value] of Object.entries(payload)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const record = value as Record<string, unknown>;
      leave.push({
        id,
        employeeName:
          this.pickField(record, ['Employee', 'EmployeeName', 'employee']) ||
          'Employee',
        leaveType: this.pickField(record, ['Leavetype', 'LeaveType', 'Type']),
        fromDate: this.pickField(record, ['From', 'from']),
        toDate: this.pickField(record, ['To', 'to']),
        days:
          this.pickField(record, ['Days', 'Daystaken', 'LeaveCount']) ??
          (typeof record.Days === 'object' && record.Days
            ? String(Object.keys(record.Days as object).length)
            : null),
        approvalStatus: this.pickField(record, [
          'ApprovalStatus',
          'Status',
          'approvalStatus',
        ]),
        webUrl: `${peopleHost}/zp#leave/listview`,
      });
    }

    return leave.slice(0, limit);
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
          'Zoho People access was denied. Reconnect your Zoho People account.',
        );
      }
      if (response.status === 204) {
        return {} as T;
      }
      throw new BadRequestException(
        body || `Zoho People request failed (${response.status})`,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }
}
