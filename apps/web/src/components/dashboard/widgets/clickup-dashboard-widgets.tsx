'use client';

import { useQuery } from '@tanstack/react-query';
import { ListTodo } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { clickupService } from '@/services/clickup.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function ClickUpListsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['clickup-lists'],
    queryFn: () => clickupService.getLists(),
  });

  const lists = data?.data?.lists ?? [];

  return (
    <DashboardWidgetCard
      source="ClickUp"
      sourceLogo={<IntegrationIcon provider="CLICKUP" />}
      title="Lists"
      deepLinkHref="/integrations/clickup"
      deepLinkLabel="Open ClickUp"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : lists.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No lists found"
          description="ClickUp lists you can access will appear here"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lists.slice(0, 6).map((list) => (
            <Link
              key={list.id}
              href={`/integrations/clickup?list=${list.id}`}
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
                  {[list.spaceName, list.folderName].filter(Boolean).join(' · ')}
                </p>
                {typeof list.taskCount === 'number' && (
                  <p className="mt-2 text-xs text-muted">
                    {list.taskCount} task{list.taskCount === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardWidgetCard>
  );
}
