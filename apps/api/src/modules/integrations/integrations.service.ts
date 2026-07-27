import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { successResponse } from '../../common/utils/api-response.util';
import { INTEGRATION_PROVIDERS } from './constants/integration-providers.constant';
import { DEFAULT_GOOGLE_PREFERENCES } from './google-calendar/types/google-preferences.type';
import { DEFAULT_JIRA_PREFERENCES } from './jira/types/jira-preferences.type';
import { DEFAULT_TRELLO_PREFERENCES } from './trello/types/trello-preferences.type';
import { DEFAULT_ASANA_PREFERENCES } from './asana/types/asana-preferences.type';
import { DEFAULT_MONDAY_PREFERENCES } from './monday/types/monday-preferences.type';
import { DEFAULT_CLICKUP_PREFERENCES } from './clickup/types/clickup-preferences.type';
import { DEFAULT_CALENDLY_PREFERENCES } from './calendly/types/calendly-preferences.type';
import { DEFAULT_SLACK_PREFERENCES } from './slack/types/slack-preferences.type';
import { DEFAULT_ZOOM_PREFERENCES } from './zoom/types/zoom-preferences.type';
import { DEFAULT_OUTLOOK_PREFERENCES } from './outlook/types/outlook-preferences.type';
import { DEFAULT_TEAMS_PREFERENCES } from './teams/types/teams-preferences.type';
import { DEFAULT_DROPBOX_PREFERENCES } from './dropbox/types/dropbox-preferences.type';
import { DEFAULT_BOX_PREFERENCES } from './box/types/box-preferences.type';
import { DEFAULT_ONEDRIVE_PREFERENCES } from './onedrive/types/onedrive-preferences.type';
import { DEFAULT_SHAREPOINT_PREFERENCES } from './sharepoint/types/sharepoint-preferences.type';
import { DEFAULT_HUBSPOT_PREFERENCES } from './hubspot/types/hubspot-preferences.type';
import { DEFAULT_SALESFORCE_PREFERENCES } from './salesforce/types/salesforce-preferences.type';
import { DEFAULT_DYNAMICS_PREFERENCES } from './dynamics/types/dynamics-preferences.type';
import { DEFAULT_ZOHO_CRM_PREFERENCES } from './zoho-crm/types/zoho-crm-preferences.type';
import { DEFAULT_ZOHO_PEOPLE_PREFERENCES } from './zoho-people/types/zoho-people-preferences.type';
import { mergeBooleanPreferences } from './utils/merge-boolean-preferences.util';

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
      oneDriveConnection,
      sharePointConnection,
      salesforceConnection,
      dynamicsConnection,
      workdayConnection,
      zohoCrmConnection,
      zohoPeopleConnection,
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
        this.prisma.oneDriveConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.sharePointConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.salesforceConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.dynamicsConnection.findUnique({
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
      this.softQuery(
        this.prisma.zohoCrmConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.zohoPeopleConnection.findUnique({
          where: { userId: user.id },
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

      if (provider.provider === IntegrationProvider.ONEDRIVE) {
        const userConnected =
          oneDriveConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: oneDriveConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.SHAREPOINT) {
        const userConnected =
          sharePointConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: sharePointConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.SALESFORCE) {
        const userConnected =
          salesforceConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: salesforceConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.DYNAMICS_365) {
        const userConnected =
          dynamicsConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: dynamicsConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.ZOHO_CRM) {
        const userConnected =
          zohoCrmConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: zohoCrmConnection?.updatedAt ?? null,
        };
      }

      if (provider.provider === IntegrationProvider.ZOHO_PEOPLE) {
        const userConnected =
          zohoPeopleConnection?.status === IntegrationStatus.CONNECTED;
        return {
          ...provider,
          status: userConnected
            ? IntegrationStatus.CONNECTED
            : IntegrationStatus.NOT_CONNECTED,
          connectedAt: zohoPeopleConnection?.updatedAt ?? null,
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

  /**
   * Single round-trip for Home dashboard widget visibility.
   * Returns connected + preferences (+ gate emails) keyed like the web resolver.
   */
  async getDashboardStatus(user: AuthenticatedUser) {
    const [
      googleConnection,
      jiraConnection,
      trelloConnection,
      asanaConnection,
      mondayConnection,
      clickupConnection,
      calendlyConnection,
      slackConnection,
      zoomConnection,
      outlookConnection,
      teamsConnection,
      dropboxConnection,
      boxConnection,
      oneDriveConnection,
      sharePointConnection,
      hubspotConnection,
      salesforceConnection,
      dynamicsConnection,
      zohoCrmConnection,
      zohoPeopleConnection,
      workdayConnection,
    ] = await Promise.all([
      this.softQuery(
        this.prisma.googleCalendarConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.jiraConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.trelloConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.asanaConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.mondayConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.clickUpConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.calendlyConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.slackConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.zoomConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.outlookConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.teamsConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.dropboxConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.boxConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.oneDriveConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.sharePointConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.hubSpotConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.salesforceConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.dynamicsConnection.findUnique({
          where: { userId: user.id },
        }),
        null,
      ),
      this.softQuery(
        this.prisma.zohoCrmConnection.findUnique({ where: { userId: user.id } }),
        null,
      ),
      this.softQuery(
        this.prisma.zohoPeopleConnection.findUnique({
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

    const isConnected = (status?: IntegrationStatus | null) =>
      status === IntegrationStatus.CONNECTED;

    const synced = (value?: Date | null) => value?.toISOString() ?? null;

    return successResponse({
      google: {
        connected: isConnected(googleConnection?.status),
        googleEmail: googleConnection?.googleEmail ?? null,
        lastSyncedAt: synced(googleConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_GOOGLE_PREFERENCES,
          googleConnection?.preferences,
        ),
      },
      jira: {
        connected: isConnected(jiraConnection?.status),
        lastSyncedAt: synced(jiraConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_JIRA_PREFERENCES,
          jiraConnection?.preferences,
        ),
      },
      trello: {
        connected: isConnected(trelloConnection?.status),
        lastSyncedAt: synced(trelloConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_TRELLO_PREFERENCES,
          trelloConnection?.preferences,
        ),
      },
      asana: {
        connected: isConnected(asanaConnection?.status),
        lastSyncedAt: synced(asanaConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_ASANA_PREFERENCES,
          asanaConnection?.preferences,
        ),
      },
      monday: {
        connected: isConnected(mondayConnection?.status),
        lastSyncedAt: synced(mondayConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_MONDAY_PREFERENCES,
          mondayConnection?.preferences,
        ),
      },
      clickup: {
        connected: isConnected(clickupConnection?.status),
        lastSyncedAt: synced(clickupConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_CLICKUP_PREFERENCES,
          clickupConnection?.preferences,
        ),
      },
      calendly: {
        connected: isConnected(calendlyConnection?.status),
        lastSyncedAt: synced(calendlyConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_CALENDLY_PREFERENCES,
          calendlyConnection?.preferences,
        ),
      },
      slack: {
        connected: isConnected(slackConnection?.status),
        lastSyncedAt: synced(slackConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_SLACK_PREFERENCES,
          slackConnection?.preferences,
        ),
      },
      zoom: {
        connected: isConnected(zoomConnection?.status),
        lastSyncedAt: synced(zoomConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_ZOOM_PREFERENCES,
          zoomConnection?.preferences,
        ),
      },
      outlook: {
        connected: isConnected(outlookConnection?.status),
        lastSyncedAt: synced(outlookConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_OUTLOOK_PREFERENCES,
          outlookConnection?.preferences,
        ),
      },
      teams: {
        connected: isConnected(teamsConnection?.status),
        teamsEmail: teamsConnection?.teamsEmail ?? null,
        lastSyncedAt: synced(teamsConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_TEAMS_PREFERENCES,
          teamsConnection?.preferences,
        ),
      },
      dropbox: {
        connected: isConnected(dropboxConnection?.status),
        lastSyncedAt: synced(dropboxConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_DROPBOX_PREFERENCES,
          dropboxConnection?.preferences,
        ),
      },
      box: {
        connected: isConnected(boxConnection?.status),
        lastSyncedAt: synced(boxConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_BOX_PREFERENCES,
          boxConnection?.preferences,
        ),
      },
      onedrive: {
        connected: isConnected(oneDriveConnection?.status),
        lastSyncedAt: synced(oneDriveConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_ONEDRIVE_PREFERENCES,
          oneDriveConnection?.preferences,
        ),
      },
      sharepoint: {
        connected: isConnected(sharePointConnection?.status),
        sharepointEmail: sharePointConnection?.sharepointEmail ?? null,
        lastSyncedAt: synced(sharePointConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_SHAREPOINT_PREFERENCES,
          sharePointConnection?.preferences,
        ),
      },
      hubspot: {
        connected: isConnected(hubspotConnection?.status),
        lastSyncedAt: synced(hubspotConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_HUBSPOT_PREFERENCES,
          hubspotConnection?.preferences,
        ),
      },
      salesforce: {
        connected: isConnected(salesforceConnection?.status),
        lastSyncedAt: synced(salesforceConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_SALESFORCE_PREFERENCES,
          salesforceConnection?.preferences,
        ),
      },
      dynamics: {
        connected: isConnected(dynamicsConnection?.status),
        lastSyncedAt: synced(dynamicsConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_DYNAMICS_PREFERENCES,
          dynamicsConnection?.preferences,
        ),
      },
      zohoCrm: {
        connected: isConnected(zohoCrmConnection?.status),
        lastSyncedAt: synced(zohoCrmConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_ZOHO_CRM_PREFERENCES,
          zohoCrmConnection?.preferences,
        ),
      },
      zohoPeople: {
        connected: isConnected(zohoPeopleConnection?.status),
        lastSyncedAt: synced(zohoPeopleConnection?.lastSyncedAt),
        preferences: mergeBooleanPreferences(
          DEFAULT_ZOHO_PEOPLE_PREFERENCES,
          zohoPeopleConnection?.preferences,
        ),
      },
      workday: {
        connected: isConnected(workdayConnection?.status),
        lastSyncedAt: synced(workdayConnection?.lastSyncedAt),
      },
    });
  }

  async connect(
    user: AuthenticatedUser,
    provider: IntegrationProvider,
    _config: Record<string, unknown> = {},
  ) {
    const meta = INTEGRATION_PROVIDERS.find((p) => p.provider === provider);
    if (!meta) throw new NotFoundException('Integration provider not found');

    throw new BadRequestException(
      `${meta.name} must be connected from its integration page using the provider’s own connect flow.`,
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
