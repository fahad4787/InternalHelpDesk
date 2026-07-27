'use client';

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { IntegrationIcon } from '@/components/integrations/common/integration-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MyTaskItem, MyTaskProvider } from '@/types/my-tasks';

const PROVIDER_LABEL: Record<MyTaskProvider, string> = {
  JIRA: 'Jira',
  ASANA: 'Asana',
  CLICKUP: 'ClickUp',
  TRELLO: 'Trello',
};

function formatDue(dueOn: string | null): string | null {
  if (!dueOn) return null;
  const date = parseISO(dueOn);
  if (!isValid(date)) return dueOn;
  return format(date, 'MMM d, yyyy');
}

function formatUpdated(updatedAt: string | null): string | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (!isValid(date)) return null;
  return formatDistanceToNow(date, { addSuffix: true });
}

function statusVariant(status: string | null): 'success' | 'info' | 'secondary' {
  if (!status) return 'secondary';
  const normalized = status.toLowerCase();
  if (normalized.includes('done') || normalized.includes('closed') || normalized.includes('complete')) {
    return 'success';
  }
  if (normalized.includes('progress')) return 'info';
  return 'secondary';
}

export function MyTaskList({ tasks }: { tasks: MyTaskItem[] }) {
  return (
    <ul className="space-y-3" role="list">
      {tasks.map((task) => {
        const dueLabel = formatDue(task.dueOn);
        const updatedLabel = formatUpdated(task.updatedAt);

        return (
          <li key={task.id}>
            <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm bg-canvas px-2 py-1 text-[11px] font-semibold text-ink">
                      <IntegrationIcon provider={task.provider} size="sm" />
                      {PROVIDER_LABEL[task.provider]}
                    </span>
                    {task.badge && <Badge variant="info">{task.badge}</Badge>}
                    {task.status && (
                      <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-ink">{task.title}</h3>

                  <div className="mt-2 space-y-1 text-sm text-muted">
                    {task.subtitle && <p>{task.subtitle}</p>}
                    {dueLabel && (
                      <p className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-brand" aria-hidden />
                        Due {dueLabel}
                      </p>
                    )}
                    {updatedLabel && <p className="text-xs">Updated {updatedLabel}</p>}
                  </div>
                </div>

                {task.url && (
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="outline" size="sm">
                      Open
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </a>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
