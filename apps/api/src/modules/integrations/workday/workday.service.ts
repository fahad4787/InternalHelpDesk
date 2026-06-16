import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentSource,
  IntegrationProvider,
  IntegrationStatus,
  Prisma,
  SyncLogStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/types/api-response.type';
import { decrypt, encrypt } from '../../../common/utils/encryption.util';
import { paginate, successResponse } from '../../../common/utils/api-response.util';
import { KnowledgeBaseService } from '../../knowledge-base/knowledge-base.service';
import { ConnectWorkdayDto, TestWorkdayConnectionDto } from './dto/connect-workday.dto';
import { WorkdayArticlesQueryDto } from './dto/sync-workday.dto';
import {
  WORKDAY_ERRORS,
  WORKDAY_INTEGRATION_TYPE,
} from './constants/workday.constants';
import {
  WorkdayConnectionConfig,
  WorkdayStatusResponse,
  WorkdaySyncSummary,
} from './types/workday-article.type';
import { WorkdayProviderResolver } from './workday.provider';

@Injectable()
export class WorkdayService {
  private encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private knowledgeBaseService: KnowledgeBaseService,
    private providerResolver: WorkdayProviderResolver,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'dev-encryption-key-change-in-production',
    );
  }

  async getStatus(user: AuthenticatedUser) {
    const connection = await this.prisma.workdayConnection.findUnique({
      where: { companyId: user.companyId },
    });

    const status: WorkdayStatusResponse = {
      connected: connection?.status === IntegrationStatus.CONNECTED,
      mockMode: this.providerResolver.isMockMode(),
      status: connection?.status ?? IntegrationStatus.NOT_CONNECTED,
      tenantUrl: connection?.tenantUrl ?? null,
      clientId: connection?.clientId ?? null,
      hasClientSecret: !!connection?.encryptedClientSecret,
      environment: connection?.environment ?? 'SANDBOX',
      lastTestedAt: connection?.lastTestedAt?.toISOString() ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      totalSyncedArticles: connection?.totalSyncedArticles ?? 0,
    };

    return successResponse(status);
  }

  async connect(user: AuthenticatedUser, dto: ConnectWorkdayDto) {
    const encryptedSecret = dto.clientSecret
      ? encrypt(dto.clientSecret, this.encryptionKey)
      : undefined;

    const existing = await this.prisma.workdayConnection.findUnique({
      where: { companyId: user.companyId },
    });

    const connection = await this.prisma.workdayConnection.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        tenantUrl: dto.tenantUrl,
        clientId: dto.clientId,
        encryptedClientSecret: encryptedSecret,
        environment: dto.environment ?? 'SANDBOX',
        status: IntegrationStatus.CONNECTED,
      },
      update: {
        ...(dto.tenantUrl !== undefined && { tenantUrl: dto.tenantUrl }),
        ...(dto.clientId !== undefined && { clientId: dto.clientId }),
        ...(encryptedSecret !== undefined && { encryptedClientSecret: encryptedSecret }),
        ...(dto.environment !== undefined && { environment: dto.environment }),
        status: IntegrationStatus.CONNECTED,
      },
    });

    await this.prisma.integration.upsert({
      where: {
        companyId_provider: {
          companyId: user.companyId,
          provider: IntegrationProvider.WORKDAY,
        },
      },
      create: {
        companyId: user.companyId,
        provider: IntegrationProvider.WORKDAY,
        status: IntegrationStatus.CONNECTED,
        config: {
          tenantUrl: connection.tenantUrl,
          environment: connection.environment,
          mockMode: this.providerResolver.isMockMode(),
        } as Prisma.InputJsonValue,
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        config: {
          tenantUrl: connection.tenantUrl,
          environment: connection.environment,
          mockMode: this.providerResolver.isMockMode(),
        } as Prisma.InputJsonValue,
      },
    });

    return successResponse(
      {
        id: connection.id,
        tenantUrl: connection.tenantUrl,
        clientId: connection.clientId,
        hasClientSecret: !!(connection.encryptedClientSecret ?? encryptedSecret),
        environment: connection.environment,
        status: connection.status,
        mockMode: this.providerResolver.isMockMode(),
      },
      'Workday connection saved',
    );
  }

  async testConnection(user: AuthenticatedUser, dto?: TestWorkdayConnectionDto) {
    const connection = await this.prisma.workdayConnection.findUnique({
      where: { companyId: user.companyId },
    });
    const config = await this.resolveConfig(user, dto);
    const provider = this.providerResolver.resolve();

    try {
      const ok = await provider.testConnection(config);

      if (connection) {
        await this.prisma.workdayConnection.update({
          where: { companyId: user.companyId },
          data: {
            lastTestedAt: new Date(),
            status: ok ? IntegrationStatus.CONNECTED : IntegrationStatus.ERROR,
          },
        });
      }

      if (!ok) throw new BadRequestException(WORKDAY_ERRORS.CONNECTION_FAILED);

      return successResponse(
        { success: true, mockMode: this.providerResolver.isMockMode() },
        'Connection test successful',
      );
    } catch (error) {
      const connection = await this.prisma.workdayConnection.findUnique({
        where: { companyId: user.companyId },
      });
      if (connection) {
        await this.prisma.workdayConnection.update({
          where: { companyId: user.companyId },
          data: { status: IntegrationStatus.ERROR, lastTestedAt: new Date() },
        });
      }
      throw error;
    }
  }

  async syncArticles(user: AuthenticatedUser): Promise<ReturnType<typeof successResponse>> {
    const connection = await this.prisma.workdayConnection.findUnique({
      where: { companyId: user.companyId },
    });

    if (!connection) {
      throw new NotFoundException('Workday connection not configured');
    }

    const config = this.buildConfig(connection);
    const provider = this.providerResolver.resolve();
    const startedAt = new Date();

    const syncLog = await this.prisma.integrationSyncLog.create({
      data: {
        companyId: user.companyId,
        integrationType: WORKDAY_INTEGRATION_TYPE,
        status: SyncLogStatus.IN_PROGRESS,
        startedAt,
      },
    });

    let summary: WorkdaySyncSummary = {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      status: 'SUCCESS',
    };

    try {
      const articles = await provider.syncArticles(config);
      summary.total = articles.length;

      for (const article of articles) {
        try {
          const result = await this.knowledgeBaseService.syncExternalDocument({
            companyId: user.companyId,
            uploadedById: user.id,
            title: article.title,
            content: article.content,
            source: DocumentSource.WORKDAY,
            externalId: article.externalId,
            sourceUrl: article.sourceUrl,
            category: article.category,
            tags: article.tags,
          });

          if (result.created) summary.created++;
          else summary.updated++;
        } catch {
          summary.failed++;
        }
      }

      summary.status =
        summary.failed === 0
          ? 'SUCCESS'
          : summary.failed === summary.total
            ? 'FAILED'
            : 'PARTIAL';

      const completedAt = new Date();
      const syncStatus =
        summary.status === 'SUCCESS'
          ? SyncLogStatus.SUCCESS
          : summary.status === 'FAILED'
            ? SyncLogStatus.FAILED
            : SyncLogStatus.PARTIAL;

      await this.prisma.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: syncStatus,
          message: `Synced ${summary.created + summary.updated} of ${summary.total} articles`,
          totalItems: summary.total,
          createdCount: summary.created,
          updatedCount: summary.updated,
          failedCount: summary.failed,
          completedAt,
        },
      });

      await this.prisma.workdayConnection.update({
        where: { companyId: user.companyId },
        data: {
          lastSyncedAt: completedAt,
          totalSyncedArticles: summary.created + summary.updated,
          status: IntegrationStatus.CONNECTED,
        },
      });

      return successResponse(
        { ...summary, syncLogId: syncLog.id, mockMode: this.providerResolver.isMockMode() },
        'Workday sync completed',
      );
    } catch (error) {
      await this.prisma.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncLogStatus.FAILED,
          message: error instanceof Error ? error.message : WORKDAY_ERRORS.SYNC_FAILED,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async getSyncLogs(user: AuthenticatedUser) {
    const logs = await this.prisma.integrationSyncLog.findMany({
      where: {
        companyId: user.companyId,
        integrationType: WORKDAY_INTEGRATION_TYPE,
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return successResponse(logs);
  }

  async getArticles(user: AuthenticatedUser, query: WorkdayArticlesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      companyId: user.companyId,
      source: DocumentSource.WORKDAY,
      ...(query.search && {
        title: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [articles, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastSyncedAt: 'desc' },
        select: {
          id: true,
          title: true,
          externalId: true,
          sourceUrl: true,
          category: true,
          tags: true,
          status: true,
          lastSyncedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { chunks: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    const result = paginate(articles, total, page, limit);
    return successResponse(result.data, 'Workday articles retrieved', result.meta);
  }

  async reset(user: AuthenticatedUser) {
    const documentsRemoved = await this.knowledgeBaseService.removeBySource(
      user.companyId,
      DocumentSource.WORKDAY,
    );

    const syncLogsRemoved = await this.prisma.integrationSyncLog.deleteMany({
      where: {
        companyId: user.companyId,
        integrationType: WORKDAY_INTEGRATION_TYPE,
      },
    });

    await this.prisma.workdayConnection.deleteMany({
      where: { companyId: user.companyId },
    });

    await this.prisma.integration.updateMany({
      where: {
        companyId: user.companyId,
        provider: IntegrationProvider.WORKDAY,
      },
      data: {
        status: IntegrationStatus.NOT_CONNECTED,
        config: {},
      },
    });

    return successResponse(
      {
        documentsRemoved,
        syncLogsRemoved: syncLogsRemoved.count,
      },
      'Workday integration reset',
    );
  }

  private async resolveConfig(
    user: AuthenticatedUser,
    dto?: TestWorkdayConnectionDto,
  ): Promise<WorkdayConnectionConfig> {
    const connection = await this.prisma.workdayConnection.findUnique({
      where: { companyId: user.companyId },
    });

    if (!connection && !dto?.tenantUrl && !this.providerResolver.isMockMode()) {
      throw new NotFoundException('Workday connection not configured');
    }

    const clientSecret =
      dto?.clientSecret ??
      (connection?.encryptedClientSecret
        ? decrypt(connection.encryptedClientSecret, this.encryptionKey)
        : '');

    return {
      tenantUrl: dto?.tenantUrl ?? connection?.tenantUrl ?? '',
      clientId: dto?.clientId ?? connection?.clientId ?? '',
      clientSecret,
      environment: (dto?.environment ?? connection?.environment ?? 'SANDBOX') as
        | 'SANDBOX'
        | 'PRODUCTION',
    };
  }

  private buildConfig(connection: {
    tenantUrl: string | null;
    clientId: string | null;
    encryptedClientSecret: string | null;
    environment: string;
  }): WorkdayConnectionConfig {
    return {
      tenantUrl: connection.tenantUrl ?? '',
      clientId: connection.clientId ?? '',
      clientSecret: connection.encryptedClientSecret
        ? decrypt(connection.encryptedClientSecret, this.encryptionKey)
        : '',
      environment: connection.environment as 'SANDBOX' | 'PRODUCTION',
    };
  }
}
