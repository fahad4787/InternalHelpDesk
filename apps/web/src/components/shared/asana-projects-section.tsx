'use client';

import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  FolderKanban,
  ListTodo,
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
    <article className="rounded-xl border border-border-warm bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {task.completed ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          ) : (
            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-ink">{task.name}</h4>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
              {task.projectName && <span>{task.projectName}</span>}
              {task.dueOn && <span>Due {task.dueOn}</span>}
              {task.assigneeName && <span>{task.assigneeName}</span>}
            </div>
          </div>
        </div>
        {task.permalinkUrl && (
          <a href={task.permalinkUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
      </div>
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
        {activity && (
          <p className="mt-2 text-xs text-muted">
            Updated {format(activity, 'MMM d, yyyy')} ·{' '}
            {formatDistanceToNow(activity, { addSuffix: true })}
          </p>
        )}
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
    <Card>
      <CardHeader className="space-y-3">
        <Button variant="ghost" size="sm" className="w-fit px-0" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to projects
        </Button>
        {isLoading ? (
          <WidgetContentSkeleton lines={2} />
        ) : project ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{project.name}</CardTitle>
              {project.workspaceName && (
                <CardDescription>{project.workspaceName}</CardDescription>
              )}
            </div>
            {project.permalinkUrl && (
              <a href={project.permalinkUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Asana
                </Button>
              </a>
            )}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projects</CardTitle>
        <CardDescription>Projects from your linked Asana account</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetContentSkeleton lines={4} />
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
          <div className="grid gap-3 md:grid-cols-2">
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

export function AsanaMyTasksSection() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['asana-my-tasks'],
    queryFn: () => asanaService.getMyTasks(),
  });

  const tasks = data?.data?.tasks ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My tasks</CardTitle>
        <CardDescription>Tasks assigned to you in Asana</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetContentSkeleton lines={4} />
        ) : isError ? (
          <EmptyState
            icon={ListTodo}
            title="Could not load tasks"
            description={getErrorMessage(error)}
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks found"
            description="Your Asana tasks will appear here"
          />
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 20).map((task) => (
              <TaskRow key={task.gid} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
