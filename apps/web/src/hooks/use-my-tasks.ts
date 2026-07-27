'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { asanaService } from '@/services/asana.service';
import { clickupService } from '@/services/clickup.service';
import { jiraService } from '@/services/jira.service';
import { trelloService } from '@/services/trello.service';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import {
  mapAsanaTaskToMyTask,
  mapClickUpTaskToMyTask,
  mapJiraIssueToMyTask,
  mapTrelloCardToMyTask,
  sortMyTasks,
} from '@/lib/my-tasks';
import type { MyTaskItem } from '@/types/my-tasks';

const TASK_STALE_MS = 60_000;

function isCold(query: { isPending: boolean; data: unknown }) {
  return query.isPending && !query.data;
}

export function useMyTasks() {
  const { statuses, isBootstrapping } = useDashboardVisibleWidgets();

  const jiraConnected = statuses.jira?.connected === true;
  const asanaConnected = statuses.asana?.connected === true;
  const clickupConnected = statuses.clickup?.connected === true;
  const trelloConnected = statuses.trello?.connected === true;

  const jiraQuery = useQuery({
    queryKey: ['jira-issues', 'assigned'],
    queryFn: () => jiraService.getIssues('assigned'),
    enabled: jiraConnected,
    staleTime: TASK_STALE_MS,
    placeholderData: (previous) => previous,
  });

  const asanaQuery = useQuery({
    queryKey: ['asana-tasks'],
    queryFn: () => asanaService.getMyTasks(),
    enabled: asanaConnected,
    staleTime: TASK_STALE_MS,
    placeholderData: (previous) => previous,
  });

  const clickupQuery = useQuery({
    queryKey: ['clickup-tasks'],
    queryFn: () => clickupService.getMyTasks(),
    enabled: clickupConnected,
    staleTime: TASK_STALE_MS,
    placeholderData: (previous) => previous,
  });

  const trelloQuery = useQuery({
    queryKey: ['trello-cards'],
    queryFn: () => trelloService.getMyCards(),
    enabled: trelloConnected,
    staleTime: TASK_STALE_MS,
    placeholderData: (previous) => previous,
  });

  const tasks: MyTaskItem[] = useMemo(() => {
    const items: MyTaskItem[] = [];

    if (jiraConnected) {
      for (const issue of jiraQuery.data?.data?.issues ?? []) {
        items.push(mapJiraIssueToMyTask(issue));
      }
    }

    if (asanaConnected) {
      for (const task of asanaQuery.data?.data?.tasks ?? []) {
        if (task.completed) continue;
        items.push(mapAsanaTaskToMyTask(task));
      }
    }

    if (clickupConnected) {
      for (const task of clickupQuery.data?.data?.tasks ?? []) {
        items.push(mapClickUpTaskToMyTask(task));
      }
    }

    if (trelloConnected) {
      for (const card of trelloQuery.data?.data?.cards ?? []) {
        items.push(mapTrelloCardToMyTask(card));
      }
    }

    return sortMyTasks(items);
  }, [
    jiraConnected,
    asanaConnected,
    clickupConnected,
    trelloConnected,
    jiraQuery.data?.data?.issues,
    asanaQuery.data?.data?.tasks,
    clickupQuery.data?.data?.tasks,
    trelloQuery.data?.data?.cards,
  ]);

  const connectedProviders = [
    jiraConnected ? 'Jira' : null,
    asanaConnected ? 'Asana' : null,
    clickupConnected ? 'ClickUp' : null,
    trelloConnected ? 'Trello' : null,
  ].filter(Boolean) as string[];

  const hasConnections = connectedProviders.length > 0;

  const connectedQueries = [
    jiraConnected ? jiraQuery : null,
    asanaConnected ? asanaQuery : null,
    clickupConnected ? clickupQuery : null,
    trelloConnected ? trelloQuery : null,
  ].filter(Boolean) as Array<{ isPending: boolean; data: unknown }>;

  // Don't block the whole page waiting for every provider — show as soon as any data arrives.
  const isLoading =
    isBootstrapping ||
    (hasConnections &&
      tasks.length === 0 &&
      connectedQueries.every((query) => isCold(query)));

  const isError =
    (jiraConnected && jiraQuery.isError) ||
    (asanaConnected && asanaQuery.isError) ||
    (clickupConnected && clickupQuery.isError) ||
    (trelloConnected && trelloQuery.isError);

  return {
    tasks,
    connectedProviders,
    hasConnections,
    isLoading,
    isError,
    jiraConnected,
    asanaConnected,
    clickupConnected,
    trelloConnected,
  };
}
