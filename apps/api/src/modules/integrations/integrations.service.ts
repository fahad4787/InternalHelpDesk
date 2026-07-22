import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationProvider, IntegrationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { successResponse } from '../../common/utils/api-response.util';
import { INTEGRATION_PROVIDERS } from './constants/integration-providers.constant';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  /** One missing/failed connection table must not 500 the whole integrations list. */
  private async softQuery<T>(query: Promise<T>, fallback: T): Promise<T> {
    try {
      return await query;
    } catch {
      return fallback;
    }
  }

  async findAll(user: AuthenticatedUser) {
    const [
      connected,
      googleConnection,
      zoomConnection,
      jiraConnection,
      trelloConnection,
      asanaConnection,
      mondayConnection,
      clickupConnection,
      calendlyConnection,
      slackConnection,
      outlookConnection,
      teamsConnection,
      dropboxConnection,
      boxConnection,
      hubspotConnection,
      workdayConnection,
    ] = await Promise.all([
      this.softQuery(
        this.prisma.integration.findMany({
          where: { companyId: user.companyId },
        }),
        [],
      ),
      this.softQuery(
        this.prisma.googleCalendarConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.zoomConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.jiraConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.trelloConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.asanaConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.mondayConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.clickUpConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.calendlyConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.slackConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.outlookConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.teamsConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.dropboxConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.boxConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.hubSpotConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.workdayConnection.findUnique({
          where: { companyId: user.companyId },
        }),
        null,
      ),
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

      if (provider.provider === IntegrationProvider.ZOOM) {
        const userConnected =
          zoomConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: zoomConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.JIRA) {
        const userConnected =
          jiraConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: jiraConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.TRELLO) {
        const userConnected =
          trelloConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: trelloConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.ASANA) {
        const userConnected =
          asanaConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: asanaConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.MONDAY) {
        const userConnected =
          mondayConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: mondayConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.CLICKUP) {
        const userConnected =
          clickupConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: clickupConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.CALENDLY) {
        const userConnected =
          calendlyConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: calendlyConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.SLACK) {
        const userConnected =
          slackConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: slackConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.OUTLOOK) {
        const userConnected =
          outlookConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: outlookConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.MICROSOFT_TEAMS) {
        const userConnected =
          teamsConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: teamsConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.DROPBOX) {
        const userConnected =
          dropboxConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: dropboxConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.BOX) {
        const userConnected =
          boxConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: boxConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.HUBSPOT) {
        const userConnected =
          hubspotConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: hubspotConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.WORKDAY) {
        const userConnected =
          workdayConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: workdayConnection?.updatedAt ?? null,
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
