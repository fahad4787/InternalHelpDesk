'use client';

import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { mondayService } from '@/services/monday.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function MondayBoardsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['monday-boards'],
    queryFn: () => mondayService.getBoards(),
  });

  const boards = data?.data?.boards ?? [];

  return (
    <DashboardWidgetCard
      source="Monday.com"
      sourceLogo={<IntegrationIcon provider="MONDAY" />}
      title="Boards"
      deepLinkHref="/integrations/monday"
      deepLinkLabel="Open Monday"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : boards.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No boards found"
          description="Monday.com boards you can access will appear here"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {boards.slice(0, 6).map((board) => {
            const activity = board.updatedAt
              ? new Date(board.updatedAt)
              : null;
            return (
              <Link
                key={board.id}
                href={`/integrations/monday?board=${board.id}`}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 text-left shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <Badge variant="info">Board</Badge>
                  </div>
                  <h3 className="font-semibold text-ink">{board.name}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {board.itemsCount} item{board.itemsCount === 1 ? '' : 's'}
                  </p>
                  {activity && (
                    <p className="mt-2 text-xs text-muted">
                      Updated {format(activity, 'MMM d, yyyy')} ·{' '}
                      {formatDistanceToNow(activity, { addSuffix: true })}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardWidgetCard>
  );
}
