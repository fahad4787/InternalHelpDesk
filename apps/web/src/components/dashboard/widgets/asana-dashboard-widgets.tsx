'use client';

import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Circle, FolderKanban, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { asanaService } from '@/services/asana.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function AsanaProjectsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['asana-projects'],
    queryFn: () => asanaService.getProjects(),
  });

  const projects = data?.data?.projects ?? [];

  return (
    <DashboardWidgetCard
      source="Asana"
      sourceLogo={<IntegrationIcon provider="ASANA" />}
      title="Projects"
      deepLinkHref="/integrations/asana"
      deepLinkLabel="Open Asana"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Asana projects you can access will appear here"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.slice(0, 6).map((project) => {
            const activity = project.modifiedAt ? new Date(project.modifiedAt) : null;
            return (
              <Link
                key={project.gid}
                href={`/integrations/asana?project=${project.gid}`}
                className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <Badge variant="info">Project</Badge>
                </div>
                <h3 className="font-semibold text-ink">{project.name}</h3>
                {project.workspaceName && (
                  <p className="mt-1 text-xs text-muted">{project.workspaceName}</p>
                )}
                {activity && (
                  <p className="mt-2 text-xs text-muted">
                    Updated {format(activity, 'MMM d, yyyy')} ·{' '}
                    {formatDistanceToNow(activity, { addSuffix: true })}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </DashboardWidgetCard>
  );
}

export function AsanaMyTasksDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['asana-my-tasks'],
    queryFn: () => asanaService.getMyTasks(),
  });

  const tasks = data?.data?.tasks ?? [];

  return (
    <DashboardWidgetCard
      source="Asana"
      sourceLogo={<IntegrationIcon provider="ASANA" />}
      title="My tasks"
      deepLinkHref="/integrations/asana"
      deepLinkLabel="Open Asana"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks"
          description="Your Asana tasks will appear here"
        />
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 6).map((task) => (
            <article
              key={task.gid}
              className="rounded-xl border border-border-warm bg-white p-3 shadow-sm"
            >
              <div className="flex items-start gap-2">
                {task.completed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-ink">{task.name}</h4>
                  <p className="mt-1 text-xs text-muted">
                    {[task.projectName, task.dueOn ? `Due ${task.dueOn}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardWidgetCard>
  );
}
