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
import { slackService } from '@/services/slack.service';
import { trelloService } from '@/services/trello.service';
import { workdayService } from '@/services/workday.service';
import { zoomService } from '@/services/zoom.service';
import { dropboxService } from '@/services/dropbox.service';
import { boxService } from '@/services/box.service';
import { hubspotService } from '@/services/hubspot.service';
import { resolveVisibleDashboardWidgets } from '@/lib/dashboard-widget-utils';

const STATUS_STALE_MS = 120_000;

const statusQueryOptions = {
  staleTime: STATUS_STALE_MS,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

function isStatusPending(query: { isPending: boolean; isError: boolean }) {
  return query.isPending && !query.isError;
}

export function useDashboardVisibleWidgets(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const googleQuery = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => googleCalendarService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const jiraQuery = useQuery({
    queryKey: ['jira-status'],
    queryFn: () => jiraService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const trelloQuery = useQuery({
    queryKey: ['trello-status'],
    queryFn: () => trelloService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const asanaQuery = useQuery({
    queryKey: ['asana-status'],
    queryFn: () => asanaService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const mondayQuery = useQuery({
    queryKey: ['monday-status'],
    queryFn: () => mondayService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const clickupQuery = useQuery({
    queryKey: ['clickup-status'],
    queryFn: () => clickupService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const calendlyQuery = useQuery({
    queryKey: ['calendly-status'],
    queryFn: () => calendlyService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const slackQuery = useQuery({
    queryKey: ['slack-status'],
    queryFn: () => slackService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const zoomQuery = useQuery({
    queryKey: ['zoom-status'],
    queryFn: () => zoomService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const outlookQuery = useQuery({
    queryKey: ['outlook-status'],
    queryFn: () => outlookService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const dropboxQuery = useQuery({
    queryKey: ['dropbox-status'],
    queryFn: () => dropboxService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const boxQuery = useQuery({
    queryKey: ['box-status'],
    queryFn: () => boxService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const hubspotQuery = useQuery({
    queryKey: ['hubspot-status'],
    queryFn: () => hubspotService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const workdayQuery = useQuery({
    queryKey: ['workday-status'],
    queryFn: () => workdayService.getStatus(),
    ...statusQueryOptions,
    enabled,
  });

  const visibleWidgetIds = useMemo(
    () =>
      resolveVisibleDashboardWidgets({
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
        dropbox: dropboxQuery.data?.data,
        box: boxQuery.data?.data,
        hubspot: hubspotQuery.data?.data,
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
      dropboxQuery.data?.data,
      boxQuery.data?.data,
      hubspotQuery.data?.data,
      workdayQuery.data?.data,
    ],
  );

  const isLoading =
    enabled &&
    (isStatusPending(googleQuery) ||
      isStatusPending(jiraQuery) ||
      isStatusPending(trelloQuery) ||
      isStatusPending(asanaQuery) ||
      isStatusPending(mondayQuery) ||
      isStatusPending(clickupQuery) ||
      isStatusPending(calendlyQuery) ||
      isStatusPending(slackQuery) ||
      isStatusPending(zoomQuery) ||
      isStatusPending(outlookQuery) ||
      isStatusPending(dropboxQuery) ||
      isStatusPending(boxQuery) ||
      isStatusPending(hubspotQuery) ||
      isStatusPending(workdayQuery));

  return {
    visibleWidgetIds,
    isLoading,
    statuses: {
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
      dropbox: dropboxQuery.data?.data,
      box: boxQuery.data?.data,
      hubspot: hubspotQuery.data?.data,
      workday: workdayQuery.data?.data,
    },
  };
}
