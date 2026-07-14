'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { asanaService } from '@/services/asana.service';
import { calendlyService } from '@/services/calendly.service';
import { googleCalendarService } from '@/services/google-calendar.service';
import { jiraService } from '@/services/jira.service';
import { outlookService } from '@/services/outlook.service';
import { slackService } from '@/services/slack.service';
import { trelloService } from '@/services/trello.service';
import { workdayService } from '@/services/workday.service';
import { zoomService } from '@/services/zoom.service';
import { dropboxService } from '@/services/dropbox.service';
import { resolveVisibleDashboardWidgets } from '@/lib/dashboard-widget-utils';

const STATUS_STALE_MS = 60_000;

export function useDashboardVisibleWidgets() {
  const googleQuery = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => googleCalendarService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const jiraQuery = useQuery({
    queryKey: ['jira-status'],
    queryFn: () => jiraService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const trelloQuery = useQuery({
    queryKey: ['trello-status'],
    queryFn: () => trelloService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const asanaQuery = useQuery({
    queryKey: ['asana-status'],
    queryFn: () => asanaService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const calendlyQuery = useQuery({
    queryKey: ['calendly-status'],
    queryFn: () => calendlyService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const slackQuery = useQuery({
    queryKey: ['slack-status'],
    queryFn: () => slackService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const zoomQuery = useQuery({
    queryKey: ['zoom-status'],
    queryFn: () => zoomService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const outlookQuery = useQuery({
    queryKey: ['outlook-status'],
    queryFn: () => outlookService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const dropboxQuery = useQuery({
    queryKey: ['dropbox-status'],
    queryFn: () => dropboxService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const workdayQuery = useQuery({
    queryKey: ['workday-status'],
    queryFn: () => workdayService.getStatus(),
    staleTime: STATUS_STALE_MS,
  });

  const visibleWidgetIds = useMemo(
    () =>
      resolveVisibleDashboardWidgets({
        google: googleQuery.data?.data,
        jira: jiraQuery.data?.data,
        trello: trelloQuery.data?.data,
        asana: asanaQuery.data?.data,
        calendly: calendlyQuery.data?.data,
        slack: slackQuery.data?.data,
        zoom: zoomQuery.data?.data,
        outlook: outlookQuery.data?.data,
        dropbox: dropboxQuery.data?.data,
        workday: workdayQuery.data?.data,
      }),
    [
      googleQuery.data?.data,
      jiraQuery.data?.data,
      trelloQuery.data?.data,
      asanaQuery.data?.data,
      calendlyQuery.data?.data,
      slackQuery.data?.data,
      zoomQuery.data?.data,
      outlookQuery.data?.data,
      dropboxQuery.data?.data,
      workdayQuery.data?.data,
    ],
  );

  const isLoading =
    googleQuery.isLoading ||
    jiraQuery.isLoading ||
    trelloQuery.isLoading ||
    asanaQuery.isLoading ||
    calendlyQuery.isLoading ||
    slackQuery.isLoading ||
    zoomQuery.isLoading ||
    outlookQuery.isLoading ||
    dropboxQuery.isLoading ||
    workdayQuery.isLoading;

  return {
    visibleWidgetIds,
    isLoading,
    statuses: {
      google: googleQuery.data?.data,
      jira: jiraQuery.data?.data,
      trello: trelloQuery.data?.data,
      asana: asanaQuery.data?.data,
      calendly: calendlyQuery.data?.data,
      slack: slackQuery.data?.data,
      zoom: zoomQuery.data?.data,
      outlook: outlookQuery.data?.data,
      dropbox: dropboxQuery.data?.data,
      workday: workdayQuery.data?.data,
    },
  };
}
