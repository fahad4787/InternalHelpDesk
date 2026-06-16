import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationProvider, IntegrationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { successResponse } from '../../common/utils/api-response.util';
import { INTEGRATION_PROVIDERS } from './constants/integration-providers.constant';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const [connected, googleConnection] = await Promise.all([
      this.prisma.integration.findMany({
        where: { companyId: user.companyId },
      }),
      this.prisma.googleCalendarConnection.findUnique({
        where: { userId: user.id },
      }),
    ]);

    const connectedMap = new Map(
      connected.map((i) => [i.provider, i]),
    );

    const integrations = INTEGRATION_PROVIDERS.map((provider) => {
      const existing = connectedMap.get(provider.provider);

      if (provider.provider === IntegrationProvider.GOOGLE_CALENDAR) {
        const userConnected =
          googleConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: googleConnection?.updatedAt ?? null,
        };
      }

      return {
        ...provider,
        status: existing?.status ?? IntegrationStatus.NOT_CONNECTED,
        connectedAt: existing?.updatedAt ?? null,
      };
    });

    return successResponse(integrations);
  }

  async connect(
    user: AuthenticatedUser,
    provider: IntegrationProvider,
    config: Record<string, unknown> = {},
  ) {
    const meta = INTEGRATION_PROVIDERS.find((p) => p.provider === provider);
    if (!meta) throw new NotFoundException('Integration provider not found');

    const integration = await this.prisma.integration.upsert({
      where: {
        companyId_provider: { companyId: user.companyId, provider },
      },
      create: {
        companyId: user.companyId,
        provider,
        status: IntegrationStatus.NOT_CONNECTED,
        config: config as Prisma.InputJsonValue,
      },
      update: { config: config as Prisma.InputJsonValue },
    });

    return successResponse(
      {
        ...integration,
        message: `${meta.name} integration placeholder — connect flow not yet implemented`,
      },
      'Integration configuration saved',
    );
  }

  async disconnect(user: AuthenticatedUser, provider: IntegrationProvider) {
    const integration = await this.prisma.integration.findUnique({
      where: {
        companyId_provider: { companyId: user.companyId, provider },
      },
    });

    if (!integration) throw new NotFoundException('Integration not found');

    await this.prisma.integration.update({
      where: { id: integration.id },
      data: { status: IntegrationStatus.NOT_CONNECTED, config: {} },
    });

    return successResponse(null, 'Integration disconnected');
  }
}
