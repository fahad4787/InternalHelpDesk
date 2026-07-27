'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { asanaService } from '@/services/asana.service';
import { mondayService } from '@/services/monday.service';
import { clickupService } from '@/services/clickup.service';
import { calendlyService } from '@/services/calendly.service';
import { googleCalendarService } from '@/services/google-calendar.service';
import { jiraService } from '@/services/jira.service';
import { outlookService } from '@/services/outlook.service';
import { teamsService } from '@/services/teams.service';
import { slackService } from '@/services/slack.service';
import { trelloService } from '@/services/trello.service';
import { workdayService } from '@/services/workday.service';
import { zoomService } from '@/services/zoom.service';
import { dropboxService } from '@/services/dropbox.service';
import { boxService } from '@/services/box.service';
import { oneDriveService } from '@/services/onedrive.service';
import { sharePointService } from '@/services/sharepoint.service';
import { hubspotService } from '@/services/hubspot.service';
import { salesforceService } from '@/services/salesforce.service';
import { dynamicsService } from '@/services/dynamics.service';
import { zohoCrmService } from '@/services/zoho-crm.service';
import { zohoPeopleService } from '@/services/zoho-people.service';
import { integrationsService } from '@/services/integrations.service';
import { resolveVisibleDashboardWidgets } from '@/lib/dashboard-widget-utils';

const STATUS_STALE_MS = 120_000;

const statusQueryOptions = {
  staleTime: STATUS_STALE_MS,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

function isStatusPending(query: { isPending: boolean; isError: boolean; fetchStatus: string }) {
  return query.isPending && !query.isError && query.fetchStatus !== 'idle';
}

/** Map Integration.provider → status query gate key. */
const PROVIDER_STATUS_KEY: Record<string, string> = {
  GOOGLE_CALENDAR: 'google',
  JIRA: 'jira',
  TRELLO: 'trello',
  ASANA: 'asana',
  MONDAY: 'monday',
  CLICKUP: 'clickup',
  CALENDLY: 'calendly',
  SLACK: 'slack',
  ZOOM: 'zoom',
  OUTLOOK: 'outlook',
  MICROSOFT_TEAMS: 'teams',
  DROPBOX: 'dropbox',
  BOX: 'box',
  ONEDRIVE: 'onedrive',
  SHAREPOINT: 'sharepoint',
  HUBSPOT: 'hubspot',
  SALESFORCE: 'salesforce',
  DYNAMICS_365: 'dynamics',
  ZOHO_CRM: 'zohoCrm',
  ZOHO_PEOPLE: 'zohoPeople',
  WORKDAY: 'workday',
};

export function useDashboardVisibleWidgets(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const integrationsQuery = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsService.getAll(),
    staleTime: STATUS_STALE_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled,
  });

  const connectedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const item of integrationsQuery.data?.data ?? []) {
      if (item.status !== 'CONNECTED') continue;
      const key = PROVIDER_STATUS_KEY[item.provider];
      if (key) keys.add(key);
    }
    return keys;
  }, [integrationsQuery.data?.data]);

  const listReady = Boolean(integrationsQuery.data);
  const statusEnabled = (key: string) =>
    enabled && listReady && connectedKeys.has(key);

  const googleQuery = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => googleCalendarService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('google'),
  });

  const jiraQuery = useQuery({
    queryKey: ['jira-status'],
    queryFn: () => jiraService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('jira'),
  });

  const trelloQuery = useQuery({
    queryKey: ['trello-status'],
    queryFn: () => trelloService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('trello'),
  });

  const asanaQuery = useQuery({
    queryKey: ['asana-status'],
    queryFn: () => asanaService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('asana'),
  });

  const mondayQuery = useQuery({
    queryKey: ['monday-status'],
    queryFn: () => mondayService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('monday'),
  });

  const clickupQuery = useQuery({
    queryKey: ['clickup-status'],
    queryFn: () => clickupService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('clickup'),
  });

  const calendlyQuery = useQuery({
    queryKey: ['calendly-status'],
    queryFn: () => calendlyService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('calendly'),
  });

  const slackQuery = useQuery({
    queryKey: ['slack-status'],
    queryFn: () => slackService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('slack'),
  });

  const zoomQuery = useQuery({
    queryKey: ['zoom-status'],
    queryFn: () => zoomService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('zoom'),
  });

  const outlookQuery = useQuery({
    queryKey: ['outlook-status'],
    queryFn: () => outlookService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('outlook'),
  });

  const teamsQuery = useQuery({
    queryKey: ['teams-status'],
    queryFn: () => teamsService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('teams'),
  });

  const dropboxQuery = useQuery({
    queryKey: ['dropbox-status'],
    queryFn: () => dropboxService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('dropbox'),
  });

  const boxQuery = useQuery({
    queryKey: ['box-status'],
    queryFn: () => boxService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('box'),
  });

  const oneDriveQuery = useQuery({
    queryKey: ['onedrive-status'],
    queryFn: () => oneDriveService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('onedrive'),
  });

  const sharePointQuery = useQuery({
    queryKey: ['sharepoint-status'],
    queryFn: () => sharePointService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('sharepoint'),
  });

  const hubspotQuery = useQuery({
    queryKey: ['hubspot-status'],
    queryFn: () => hubspotService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('hubspot'),
  });

  const salesforceQuery = useQuery({
    queryKey: ['salesforce-status'],
    queryFn: () => salesforceService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('salesforce'),
  });

  const dynamicsQuery = useQuery({
    queryKey: ['dynamics-status'],
    queryFn: () => dynamicsService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('dynamics'),
  });

  const zohoCrmQuery = useQuery({
    queryKey: ['zoho-crm-status'],
    queryFn: () => zohoCrmService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('zohoCrm'),
  });

  const zohoPeopleQuery = useQuery({
    queryKey: ['zoho-people-status'],
    queryFn: () => zohoPeopleService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('zohoPeople'),
  });

  const workdayQuery = useQuery({
    queryKey: ['workday-status'],
    queryFn: () => workdayService.getStatus(),
    ...statusQueryOptions,
    enabled: statusEnabled('workday'),
  });

  const statuses = useMemo(
    () => ({
      google: googleQuery.data?.data,
      jira: jiraQuery.data?.data,
      trello: trelloQuery.data?.data,
      asana: asanaQuery.data?.data,
      monday: mondayQuery.data?.data,
      clickup: clickupQuery.data?.data,
      calendly: calendlyQuery.data?.data,
      slack: slackQuery.data?.data,
      zoom: zoomQuery.data?.data,
      outlook: outlookQuery.data?.data,
      teams: teamsQuery.data?.data,
      dropbox: dropboxQuery.data?.data,
      box: boxQuery.data?.data,
      onedrive: oneDriveQuery.data?.data,
      sharepoint: sharePointQuery.data?.data,
      hubspot: hubspotQuery.data?.data,
      salesforce: salesforceQuery.data?.data,
      dynamics: dynamicsQuery.data?.data,
      zohoCrm: zohoCrmQuery.data?.data,
      zohoPeople: zohoPeopleQuery.data?.data,
      workday: workdayQuery.data?.data,
    }),
    [
      googleQuery.data?.data,
      jiraQuery.data?.data,
      trelloQuery.data?.data,
      asanaQuery.data?.data,
      mondayQuery.data?.data,
      clickupQuery.data?.data,
      calendlyQuery.data?.data,
      slackQuery.data?.data,
      zoomQuery.data?.data,
      outlookQuery.data?.data,
      teamsQuery.data?.data,
      dropboxQuery.data?.data,
      boxQuery.data?.data,
      oneDriveQuery.data?.data,
      sharePointQuery.data?.data,
      hubspotQuery.data?.data,
      salesforceQuery.data?.data,
      dynamicsQuery.data?.data,
      zohoCrmQuery.data?.data,
      zohoPeopleQuery.data?.data,
      workdayQuery.data?.data,
    ],
  );

  const visibleWidgetIds = useMemo(
    () => resolveVisibleDashboardWidgets(statuses),
    [statuses],
  );

  const connectedStatusQueries = [
    statusEnabled('google') && googleQuery,
    statusEnabled('jira') && jiraQuery,
    statusEnabled('trello') && trelloQuery,
    statusEnabled('asana') && asanaQuery,
    statusEnabled('monday') && mondayQuery,
    statusEnabled('clickup') && clickupQuery,
    statusEnabled('calendly') && calendlyQuery,
    statusEnabled('slack') && slackQuery,
    statusEnabled('zoom') && zoomQuery,
    statusEnabled('outlook') && outlookQuery,
    statusEnabled('teams') && teamsQuery,
    statusEnabled('dropbox') && dropboxQuery,
    statusEnabled('box') && boxQuery,
    statusEnabled('onedrive') && oneDriveQuery,
    statusEnabled('sharepoint') && sharePointQuery,
    statusEnabled('hubspot') && hubspotQuery,
    statusEnabled('salesforce') && salesforceQuery,
    statusEnabled('dynamics') && dynamicsQuery,
    statusEnabled('zohoCrm') && zohoCrmQuery,
    statusEnabled('zohoPeople') && zohoPeopleQuery,
    statusEnabled('workday') && workdayQuery,
  ].filter(Boolean) as Array<{ isPending: boolean; isError: boolean; fetchStatus: string }>;

  /** Only block first paint on the integrations list — not every provider status. */
  const isBootstrapping =
    enabled && integrationsQuery.isPending && !integrationsQuery.data;

  const isResolvingWidgets =
    enabled &&
    listReady &&
    connectedStatusQueries.some((query) => isStatusPending(query));

  return {
    visibleWidgetIds,
    /** True until GET /integrations returns (or fails). */
    isBootstrapping,
    /** True while connected providers' preference statuses are still loading. */
    isResolvingWidgets,
    /** @deprecated Prefer isBootstrapping for skeletons; kept for callers. */
    isLoading: isBootstrapping,
    connectedCount: connectedKeys.size,
    statuses,
  };
}
