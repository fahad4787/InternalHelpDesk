'use client';

import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
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
  ClickUpList,
  ClickUpTask,
  clickupService,
} from '@/services/clickup.service';

interface ClickUpListsSectionProps {
  selectedListId: string | null;
  onSelectList: (listId: string | null) => void;
}

function TaskRow({ task }: { task: ClickUpTask }) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-warm bg-canvas">
          <ListTodo className="h-5 w-5 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{task.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {task.status && <Badge variant="info">{task.status}</Badge>}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 text-brand" />
                Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
            {task.assignees.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" />
                {task.assignees.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
      {task.url && (
        <a
          href={task.url}
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

function ListCard({
  list,
  onOpen,
}: {
  list: ClickUpList;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 text-left shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
    >
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
            <ListTodo className="h-4 w-4" />
          </div>
          <Badge variant="info">List</Badge>
        </div>
        <h3 className="font-semibold text-ink">{list.name}</h3>
        <p className="mt-1 text-xs text-muted">
          {[list.teamName, list.spaceName, list.folderName]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {typeof list.taskCount === 'number' && (
          <p className="mt-2 text-xs text-muted">
            {list.taskCount} task{list.taskCount === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </button>
  );
}

function ClickUpListDetailView({
  listId,
  onBack,
}: {
  listId: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clickup-list', listId],
    queryFn: () => clickupService.getListDetail(listId),
  });

  const list = data?.data?.list;
  const tasks = data?.data?.tasks ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 widget-card-header pb-4">
        <div className="min-w-0">
          <CardTitle className="text-lg">{list?.name ?? 'List'}</CardTitle>
          <CardDescription className="mt-1">
            {[list?.spaceName, list?.folderName].filter(Boolean).join(' · ') ||
              'Tasks in this ClickUp list'}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Lists
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <WidgetContentSkeleton lines={6} />
        ) : isError ? (
          <EmptyState
            icon={ListTodo}
            title="Could not load list"
            description={getErrorMessage(error)}
          />
        ) : !list ? (
          <EmptyState
            icon={ListTodo}
            title="List not found"
            description="This ClickUp list could not be loaded"
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No open tasks"
            description="Open tasks will appear here when they are added in ClickUp"
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ClickUpListsSection({
  selectedListId,
  onSelectList,
}: ClickUpListsSectionProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clickup-lists'],
    queryFn: () => clickupService.getLists(),
  });

  const lists = data?.data?.lists ?? [];

  if (selectedListId) {
    return (
      <ClickUpListDetailView
        listId={selectedListId}
        onBack={() => onSelectList(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lists</CardTitle>
        <CardDescription>Lists from your ClickUp workspaces</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetContentSkeleton lines={5} />
        ) : isError ? (
          <EmptyState
            icon={ListTodo}
            title="Could not load lists"
            description={getErrorMessage(error)}
          />
        ) : lists.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No lists found"
            description="ClickUp lists you can access will appear here"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onOpen={() => onSelectList(list.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
