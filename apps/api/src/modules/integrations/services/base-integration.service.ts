import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  IntegrationConfig,
  IntegrationProviderService,
} from '../interfaces/integration-provider.interface';

export abstract class BaseIntegrationService implements IntegrationProviderService {
  abstract readonly provider: IntegrationProvider;

  constructor(protected prisma: PrismaService) {}

  async connect(companyId: string, config: IntegrationConfig): Promise<void> {
    await this.prisma.integration.upsert({
      where: { companyId_provider: { companyId, provider: this.provider } },
      create: {
        companyId,
        provider: this.provider,
        status: IntegrationStatus.CONNECTED,
        config: config as object,
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        config: config as object,
      },
    });
  }

  async disconnect(companyId: string): Promise<void> {
    await this.prisma.integration.update({
      where: { companyId_provider: { companyId, provider: this.provider } },
      data: { status: IntegrationStatus.NOT_CONNECTED, config: {} },
    });
  }

  async getStatus(companyId: string): Promise<string> {
    const integration = await this.prisma.integration.findUnique({
      where: { companyId_provider: { companyId, provider: this.provider } },
    });
    return integration?.status ?? IntegrationStatus.NOT_CONNECTED;
  }
}
