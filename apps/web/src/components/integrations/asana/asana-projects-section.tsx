'use client';

import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  FolderKanban,
  ListTodo,
  UserRound,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api-client';
import {
  AsanaProject,
  AsanaTask,
  asanaService,
} from '@/services/asana.service';

interface AsanaProjectsSectionProps {
  selectedProjectGid: string | null;
  onSelectProject: (projectGid: string | null) => void;
}

function TaskRow({ task }: { task: AsanaTask }) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-warm bg-canvas">
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-brand" />
          ) : (
            <Circle className="h-5 w-5 text-muted" />
          )}
        </div>
        <div className="min-w-0">
          <p
            className={`truncate font-medium text-ink ${
              task.completed ? 'line-through opacity-70' : ''
            }`}
          >
            {task.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {task.dueOn && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 text-brand" />
                Due {task.dueOn}
              </span>
            )}
            {task.assigneeName && (
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" />
                {task.assigneeName}
              </span>
            )}
            {task.completed && <Badge variant="success">Done</Badge>}
          </div>
        </div>
      </div>
      {task.permalinkUrl && (
        <a
          href={task.permalinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-brand hover:text-brand-hover"
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      )}
    </article>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: AsanaProject;
  onOpen: () => void;
}) {
  const activity = project.modifiedAt ? new Date(project.modifiedAt) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 text-left shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
    >
      <div className="min-w-0">
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
        {project.notes && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{project.notes}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          {typeof project.taskCount === 'number' && (
            <span>{project.taskCount} tasks</span>
          )}
          {activity && (
            <span>
              Updated {format(activity, 'MMM d, yyyy')} ·{' '}
              {formatDistanceToNow(activity, { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function AsanaProjectDetailView({
  projectGid,
  onBack,
}: {
  projectGid: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['asana-project', projectGid],
    queryFn: () => asanaService.getProjectDetail(projectGid),
  });

  const project = data?.data?.project;
  const tasks = data?.data?.tasks ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 widget-card-header pb-4">
        <div className="min-w-0">
          <CardTitle className="text-lg">
            {project?.name ?? 'Project'}
          </CardTitle>
          <CardDescription className="mt-1">
            {project?.workspaceName
              ? `${project.workspaceName} · tasks in this project`
              : 'Tasks in this Asana project'}
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {project?.permalinkUrl && (
            <a href={project.permalinkUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Asana
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Projects
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <WidgetContentSkeleton lines={6} />
        ) : isError ? (
          <EmptyState
            icon={FolderKanban}
            title="Could not load project"
            description={getErrorMessage(error)}
          />
        ) : !project ? (
          <EmptyState
            icon={FolderKanban}
            title="Project not found"
            description="This Asana project could not be loaded"
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks in this project"
            description="Tasks will appear here when they are added in Asana"
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow key={task.gid} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AsanaProjectsSection({
  selectedProjectGid,
  onSelectProject,
}: AsanaProjectsSectionProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['asana-projects'],
    queryFn: () => asanaService.getProjects(),
  });

  const projects = data?.data?.projects ?? [];

  if (selectedProjectGid) {
    return (
      <AsanaProjectDetailView
        projectGid={selectedProjectGid}
        onBack={() => onSelectProject(null)}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="widget-card-header pb-4">
        <CardTitle className="text-lg">Projects</CardTitle>
        <CardDescription className="mt-1">
          Click a project to view its tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <WidgetContentSkeleton lines={5} />
        ) : isError ? (
          <EmptyState
            icon={FolderKanban}
            title="Could not load projects"
            description={getErrorMessage(error)}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description="Asana projects you can access will appear here after connecting"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.gid}
                project={project}
                onOpen={() => onSelectProject(project.gid)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
