'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { asanaService } from '@/services/asana.service';
import { jiraService } from '@/services/jira.service';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import {
  mapAsanaTaskToMyTask,
  mapJiraIssueToMyTask,
  sortMyTasks,
} from '@/lib/my-tasks';
import type { MyTaskItem } from '@/types/my-tasks';

export function useMyTasks() {
  const { statuses, isBootstrapping } = useDashboardVisibleWidgets();

  const jiraConnected = statuses.jira?.connected === true;
  const asanaConnected = statuses.asana?.connected === true;

  const jiraQuery = useQuery({
    queryKey: ['jira-issues', 'assigned'],
    queryFn: () => jiraService.getIssues('assigned'),
    enabled: jiraConnected,
  });

  const asanaQuery = useQuery({
    queryKey: ['asana-tasks'],
    queryFn: () => asanaService.getMyTasks(),
    enabled: asanaConnected,
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

    return sortMyTasks(items);
  }, [
    jiraConnected,
    asanaConnected,
    jiraQuery.data?.data?.issues,
    asanaQuery.data?.data?.tasks,
  ]);

  const connectedProviders = [
    jiraConnected ? 'Jira' : null,
    asanaConnected ? 'Asana' : null,
  ].filter(Boolean) as string[];

  const isLoading =
    isBootstrapping ||
    (jiraConnected && jiraQuery.isPending) ||
    (asanaConnected && asanaQuery.isPending);

  const isError =
    (jiraConnected && jiraQuery.isError) || (asanaConnected && asanaQuery.isError);

  return {
    tasks,
    connectedProviders,
    hasConnections: connectedProviders.length > 0,
    isLoading,
    isError,
    jiraConnected,
    asanaConnected,
  };
}
