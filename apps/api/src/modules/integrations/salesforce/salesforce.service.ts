import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { IntegrationProvider, IntegrationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/types/api-response.type';
import { decrypt, encrypt } from '../../../common/utils/encryption.util';
import { successResponse } from '../../../common/utils/api-response.util';
import {
  createOAuthStateWithData,
  verifyOAuthStateWithData,
} from '../google-calendar/utils/oauth-state.util';
import { resolveOAuthRedirectUri } from '../utils/resolve-oauth-redirect-uri.util';
import { UpdateSalesforcePreferencesDto } from './dto/update-salesforce-preferences.dto';
import {
  DEFAULT_SALESFORCE_PREFERENCES,
  SalesforceAccount,
  SalesforceContact,
  SalesforceOpportunity,
  SalesforcePreferences,
} from './types/salesforce-preferences.type';

const DEFAULT_SCOPES = 'api refresh_token id';
const API_VERSION = 'v59.0';

interface SalesforceTokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id?: string;
  issued_at?: string;
  token_type?: string;
}

interface SalesforceIdentity {
  user_id?: string;
  email?: string;
  display_name?: string;
  username?: string;
}

interface SoqlResponse<T> {
  records?: T[];
}

@Injectable()
export class SalesforceService {
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
    const connection = await this.prisma.salesforceConnection.findUnique({
      where: { userId: user.id },
    });

    return successResponse({
      connected: connection?.status === IntegrationStatus.CONNECTED,
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      salesforceEmail: connection?.salesforceEmail ?? null,
      instanceUrl: connection?.instanceUrl ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      preferences: this.resolvePreferences(connection?.preferences),
    });
  }

  async updatePreferences(
    user: AuthenticatedUser,
    dto: UpdateSalesforcePreferencesDto,
  ) {
    const connection = await this.prisma.salesforceConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Salesforce is not connected');
    }

    const preferences: SalesforcePreferences = {
      showContacts: dto.showContacts,
      showAccounts: dto.showAccounts,
      showOpportunities: dto.showOpportunities,
    };

    await this.prisma.salesforceConnection.update({
      where: { userId: user.id },
      data: { preferences: preferences as unknown as Prisma.InputJsonValue },
    });

    return successResponse(preferences, 'Preferences updated');
  }

  getAuthUrl(user: AuthenticatedUser) {
    const clientId = this.configService
      .get<string>('SALESFORCE_CLIENT_ID')
      ?.trim();
    const redirectUri = this.getRedirectUri();
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Salesforce is not configured. Set SALESFORCE_CLIENT_ID and SALESFORCE_REDIRECT_URI.',
      );
    }

    const clientSecret = this.configService
      .get<string>('SALESFORCE_CLIENT_SECRET')
      ?.trim();
    if (!clientSecret) {
      throw new BadRequestException(
        'SALESFORCE_CLIENT_SECRET is missing. Add it to your server environment.',
      );
    }

    const codeVerifier = this.createCodeVerifier();
    const codeChallenge = this.createCodeChallenge(codeVerifier);
    const state = createOAuthStateWithData(
      user.id,
      this.jwtSecret,
      codeVerifier,
    );
    const scopes =
      this.configService.get<string>('SALESFORCE_SCOPES')?.trim() ||
      DEFAULT_SCOPES;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return successResponse({
      url: `${this.getLoginUrl()}/services/oauth2/authorize?${params.toString()}`,
    });
  }

  async handleCallback(code: string, state: string) {
    const verified = verifyOAuthStateWithData(state, this.jwtSecret);
    if (!verified) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code, verified.data);
    const identity = await this.fetchIdentity(
      tokens.access_token,
      tokens.id ?? null,
    );

    const encryptedAccess = encrypt(tokens.access_token, this.encryptionKey);
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.encryptionKey)
      : undefined;
    const expiresAt = tokens.issued_at
      ? new Date(Number(tokens.issued_at) + 2 * 60 * 60 * 1000)
      : new Date(Date.now() + 2 * 60 * 60 * 1000);

    await this.prisma.salesforceConnection.upsert({
      where: { userId: verified.userId },
      create: {
        userId: verified.userId,
        salesforceUserId: identity.user_id ?? null,
        salesforceEmail: identity.email ?? identity.username ?? null,
        instanceUrl: tokens.instance_url,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        status: IntegrationStatus.CONNECTED,
        preferences:
          DEFAULT_SALESFORCE_PREFERENCES as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        salesforceUserId: identity.user_id ?? null,
        salesforceEmail: identity.email ?? identity.username ?? null,
        instanceUrl: tokens.instance_url,
        encryptedAccessToken: encryptedAccess,
        ...(encryptedRefresh ? { encryptedRefreshToken: encryptedRefresh } : {}),
        tokenExpiresAt: expiresAt,
        status: IntegrationStatus.CONNECTED,
        lastSyncedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: verified.userId },
      select: { companyId: true },
    });

    if (user) {
      await this.prisma.integration.upsert({
        where: {
          companyId_provider: {
            companyId: user.companyId,
            provider: IntegrationProvider.SALESFORCE,
          },
        },
        create: {
          companyId: user.companyId,
          provider: IntegrationProvider.SALESFORCE,
          status: IntegrationStatus.CONNECTED,
        },
        update: { status: IntegrationStatus.CONNECTED },
      });
    }

    return verified.userId;
  }

  async disconnect(user: AuthenticatedUser) {
    await this.prisma.salesforceConnection.deleteMany({
      where: { userId: user.id },
    });

    const otherConnections = await this.prisma.salesforceConnection.count({
      where: { user: { companyId: user.companyId } },
    });

    if (otherConnections === 0) {
      await this.prisma.integration.updateMany({
        where: {
          companyId: user.companyId,
          provider: IntegrationProvider.SALESFORCE,
        },
        data: { status: IntegrationStatus.NOT_CONNECTED },
      });
    }

    return successResponse(null, 'Salesforce disconnected');
  }

  async getContacts(user: AuthenticatedUser, limit = 10) {
    const connection = await this.requireConnection(user);
    if (!connection) {
      return successResponse({
        connected: false,
        contacts: [] as SalesforceContact[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const instanceUrl = connection.instanceUrl!;
    const capped = Math.min(Math.max(limit, 1), 50);
    const query = `SELECT Id, Name, Email, Phone, Title, LastModifiedDate FROM Contact ORDER BY LastModifiedDate DESC LIMIT ${capped}`;
    const payload = await this.soqlQuery<{
      Id: string;
      Name?: string;
      Email?: string;
      Phone?: string;
      Title?: string;
      LastModifiedDate?: string;
    }>(instanceUrl, accessToken, query);

    const contacts: SalesforceContact[] = (payload.records ?? []).map(
      (row) => ({
        id: row.Id,
        name: row.Name?.trim() || 'Untitled contact',
        email: row.Email ?? null,
        phone: row.Phone ?? null,
        title: row.Title ?? null,
        updatedAt: row.LastModifiedDate ?? new Date().toISOString(),
        webUrl: this.recordUrl(instanceUrl, 'Contact', row.Id),
      }),
    );

    await this.touchSync(user.id);

    return successResponse({
      connected: true,
      salesforceEmail: connection.salesforceEmail,
      contacts,
    });
  }

  async getAccounts(user: AuthenticatedUser, limit = 10) {
    const connection = await this.requireConnection(user);
    if (!connection) {
      return successResponse({
        connected: false,
        accounts: [] as SalesforceAccount[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const instanceUrl = connection.instanceUrl!;
    const capped = Math.min(Math.max(limit, 1), 50);
    const query = `SELECT Id, Name, Phone, Website, BillingCity, LastModifiedDate FROM Account ORDER BY LastModifiedDate DESC LIMIT ${capped}`;
    const payload = await this.soqlQuery<{
      Id: string;
      Name?: string;
      Phone?: string;
      Website?: string;
      BillingCity?: string;
      LastModifiedDate?: string;
    }>(instanceUrl, accessToken, query);

    const accounts: SalesforceAccount[] = (payload.records ?? []).map(
      (row) => ({
        id: row.Id,
        name: row.Name?.trim() || 'Untitled account',
        phone: row.Phone ?? null,
        website: row.Website ?? null,
        city: row.BillingCity ?? null,
        updatedAt: row.LastModifiedDate ?? new Date().toISOString(),
        webUrl: this.recordUrl(instanceUrl, 'Account', row.Id),
      }),
    );

    await this.touchSync(user.id);

    return successResponse({
      connected: true,
      salesforceEmail: connection.salesforceEmail,
      accounts,
    });
  }

  async getOpportunities(user: AuthenticatedUser, limit = 10) {
    const connection = await this.requireConnection(user);
    if (!connection) {
      return successResponse({
        connected: false,
        opportunities: [] as SalesforceOpportunity[],
      });
    }

    const accessToken = await this.getValidAccessToken(connection);
    const instanceUrl = connection.instanceUrl!;
    const capped = Math.min(Math.max(limit, 1), 50);
    const query = `SELECT Id, Name, Amount, StageName, CloseDate, Probability, LastModifiedDate FROM Opportunity ORDER BY LastModifiedDate DESC LIMIT ${capped}`;
    const payload = await this.soqlQuery<{
      Id: string;
      Name?: string;
      Amount?: number;
      StageName?: string;
      CloseDate?: string;
      Probability?: number;
      LastModifiedDate?: string;
    }>(instanceUrl, accessToken, query);

    const opportunities: SalesforceOpportunity[] = (payload.records ?? []).map(
      (row) => ({
        id: row.Id,
        name: row.Name?.trim() || 'Untitled opportunity',
        amount: typeof row.Amount === 'number' ? row.Amount : null,
        stageName: row.StageName ?? null,
        closeDate: row.CloseDate ?? null,
        probability:
          typeof row.Probability === 'number' ? row.Probability : null,
        updatedAt: row.LastModifiedDate ?? new Date().toISOString(),
        webUrl: this.recordUrl(instanceUrl, 'Opportunity', row.Id),
      }),
    );

    await this.touchSync(user.id);

    return successResponse({
      connected: true,
      salesforceEmail: connection.salesforceEmail,
      opportunities,
    });
  }

  private async requireConnection(user: AuthenticatedUser) {
    const connection = await this.prisma.salesforceConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      return null;
    }

    if (!connection.encryptedAccessToken || !connection.instanceUrl) {
      throw new BadRequestException(
        'Salesforce session expired. Please reconnect your account.',
      );
    }

    return connection;
  }

  private async touchSync(userId: string) {
    await this.prisma.salesforceConnection.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });
  }

  private resolvePreferences(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_SALESFORCE_PREFERENCES };
    }

    const raw = value as Record<string, unknown>;
    return {
      showContacts:
        typeof raw.showContacts === 'boolean'
          ? raw.showContacts
          : DEFAULT_SALESFORCE_PREFERENCES.showContacts,
      showAccounts:
        typeof raw.showAccounts === 'boolean'
          ? raw.showAccounts
          : DEFAULT_SALESFORCE_PREFERENCES.showAccounts,
      showOpportunities:
        typeof raw.showOpportunities === 'boolean'
          ? raw.showOpportunities
          : DEFAULT_SALESFORCE_PREFERENCES.showOpportunities,
    } satisfies SalesforcePreferences;
  }

  private getRedirectUri(): string {
    return resolveOAuthRedirectUri(this.configService, {
      envKey: 'SALESFORCE_REDIRECT_URI',
      callbackPath: '/api/integrations/salesforce/callback',
    });
  }

  private getLoginUrl(): string {
    return (
      this.configService.get<string>('SALESFORCE_LOGIN_URL')?.trim() ||
      'https://login.salesforce.com'
    ).replace(/\/+$/, '');
  }

  private createCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  private createCodeChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
  }

  private recordUrl(
    instanceUrl: string,
    objectName: string,
    id: string,
  ): string {
    return `${instanceUrl.replace(/\/+$/, '')}/lightning/r/${objectName}/${id}/view`;
  }

  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<SalesforceTokenResponse> {
    const clientId = this.configService.get<string>('SALESFORCE_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SALESFORCE_CLIENT_SECRET',
    );
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Salesforce is not configured');
    }

    const response = await fetch(
      `${this.getLoginUrl()}/services/oauth2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
          code_verifier: codeVerifier,
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        `Failed to exchange Salesforce authorization code: ${body}`,
      );
    }

    return response.json() as Promise<SalesforceTokenResponse>;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<SalesforceTokenResponse> {
    const clientId = this.configService.get<string>('SALESFORCE_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SALESFORCE_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Salesforce is not configured');
    }

    const response = await fetch(
      `${this.getLoginUrl()}/services/oauth2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || 'Failed to refresh Salesforce access token. Please reconnect.',
      );
    }

    return response.json() as Promise<SalesforceTokenResponse>;
  }

  private async getValidAccessToken(connection: {
    userId: string;
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
    instanceUrl: string | null;
  }) {
    if (!connection.encryptedAccessToken) {
      throw new BadRequestException(
        'Salesforce token is missing. Please reconnect your account.',
      );
    }

    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (stillValid) {
      return decrypt(connection.encryptedAccessToken, this.encryptionKey);
    }

    if (!connection.encryptedRefreshToken) {
      throw new BadRequestException(
        'Salesforce session expired. Please reconnect your account.',
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

    await this.prisma.salesforceConnection.update({
      where: { userId: connection.userId },
      data: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        instanceUrl: tokens.instance_url || connection.instanceUrl,
        tokenExpiresAt: tokens.issued_at
          ? new Date(Number(tokens.issued_at) + 2 * 60 * 60 * 1000)
          : new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });

    return tokens.access_token;
  }

  private async fetchIdentity(
    accessToken: string,
    identityUrl: string | null,
  ): Promise<SalesforceIdentity> {
    if (!identityUrl) return {};

    const response = await fetch(identityUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      return {};
    }

    return (await response.json()) as SalesforceIdentity;
  }

  private async soqlQuery<T>(
    instanceUrl: string,
    accessToken: string,
    query: string,
  ): Promise<SoqlResponse<T>> {
    const url = `${instanceUrl.replace(/\/+$/, '')}/services/data/${API_VERSION}/query?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        body || `Salesforce query failed (${response.status})`,
      );
    }

    return (await response.json()) as SoqlResponse<T>;
  }
}
