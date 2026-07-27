'use client';

import Link from 'next/link';
import { CheckSquare, Plug } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-state';
import { Button } from '@/components/ui/button';
import { MyTaskList } from '@/components/tasks/my-task-list';
import { useMyTasks } from '@/hooks/use-my-tasks';

export default function MyTasksPage() {
  const { tasks, connectedProviders, hasConnections, isLoading, isError } = useMyTasks();

  return (
    <PageContainer
      title="My tasks"
      description={
        hasConnections
          ? `Assigned work from ${connectedProviders.join(' and ')}`
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
          description="Link Jira or Asana to see issues and tasks assigned to you here."
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
        <MyTaskList tasks={tasks} />
      )}
    </PageContainer>
  );
}
