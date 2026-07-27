'use client';

import Link from 'next/link';
import { CheckSquare, Plug } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-state';
import { Button } from '@/components/ui/button';
import { MyTaskList } from '@/components/tasks/my-task-list';
import { useMyTasks } from '@/hooks/use-my-tasks';

function formatProviderList(providers: string[]): string {
  if (providers.length <= 1) return providers[0] ?? '';
  if (providers.length === 2) return `${providers[0]} and ${providers[1]}`;
  return `${providers.slice(0, -1).join(', ')}, and ${providers[providers.length - 1]}`;
}

export default function MyTasksPage() {
  const {
    tasks,
    connectedProviders,
    hasConnections,
    isLoading,
    isRefreshing,
    isError,
    hasPartialError,
  } = useMyTasks();

  return (
    <PageContainer
      title="My tasks"
      description={
        hasConnections
          ? `Assigned work from ${formatProviderList(connectedProviders)}`
          : 'Assigned work from your connected project tools'
      }
      actions={
        <Link href="/integrations">
          <Button variant="outline" size="sm">
            <Plug className="h-4 w-4" aria-hidden />
            Integrations
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <ListSkeleton count={6} />
      ) : !hasConnections ? (
        <EmptyState
          icon={Plug}
          title="Connect a project tool"
          description="Link Jira, Asana, ClickUp, or Trello to see work assigned to you here."
          actionLabel="Browse integrations"
          onAction={() => {
            window.location.href = '/integrations';
          }}
        />
      ) : isError && tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Couldn't load tasks"
          description="One of your connected apps failed to respond. Try again in a moment."
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="You're all caught up"
          description="No open assigned tasks from your connected apps right now."
        />
      ) : (
        <div className="space-y-3">
          {(isRefreshing || hasPartialError) && (
            <p className="text-xs text-muted">
              {hasPartialError
                ? 'Some connected apps failed to load — showing what we could fetch.'
                : 'Loading more tasks from your connected apps…'}
            </p>
          )}
          <MyTaskList tasks={tasks} />
        </div>
      )}
    </PageContainer>
  );
}
