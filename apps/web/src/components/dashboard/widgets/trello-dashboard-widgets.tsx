'use client';

import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { trelloService } from '@/services/trello.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function TrelloBoardsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['trello-boards'],
    queryFn: () => trelloService.getBoards(),
  });

  const boards = data?.data?.boards ?? [];

  return (
    <DashboardWidgetCard
      source="Trello"
      sourceLogo={<IntegrationIcon provider="TRELLO" />}
      title="Boards"
      deepLinkHref="/integrations/trello"
      deepLinkLabel="Open Trello"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : boards.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No boards found"
          description="Open Trello boards you can access will appear here"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {boards.slice(0, 6).map((board) => {
            const activity = board.lastActivityAt
              ? new Date(board.lastActivityAt)
              : null;
            return (
              <Link
                key={board.id}
                href={`/integrations/trello?board=${board.id}`}
                className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <Badge variant="info">Board</Badge>
                </div>
                <h3 className="font-semibold text-ink">{board.name}</h3>
                {activity && (
                  <p className="mt-2 text-xs text-muted">
                    Active {format(activity, 'MMM d, yyyy')} ·{' '}
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
