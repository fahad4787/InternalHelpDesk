'use client';

import { Suspense, useMemo } from 'react';
import {
  DASHBOARD_WIDGET_COMPONENTS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';
import { useDashboardWidgetOrder } from '@/hooks/use-dashboard-widget-order';
import { DASHBOARD_FULL_WIDTH_WIDGETS } from '@/lib/dashboard-widget-utils';
import { filterDashboardWidgetsBySearch } from '@/lib/filter-dashboard-widgets';
import { DashboardWidgetCardSkeleton } from '@/components/shared/loading-state';
import { cn } from '@/lib/utils';
import { AddWidgetCard } from './add-widget-card';
import { useDashboardUi } from './dashboard-ui-context';
import { DashboardWidgetShellProvider } from './dashboard-widget-shell-context';

interface DashboardWidgetGridProps {
  visibleWidgetIds: DashboardWidgetId[];
}

export function DashboardWidgetGrid({ visibleWidgetIds }: DashboardWidgetGridProps) {
  const { searchQuery } = useDashboardUi();

  const filteredWidgetIds = useMemo(
    () => filterDashboardWidgetsBySearch(visibleWidgetIds, searchQuery),
    [visibleWidgetIds, searchQuery],
  );

  const {
    orderedWidgetIds,
    draggedId,
    dropTargetId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  } = useDashboardWidgetOrder(filteredWidgetIds);

  const isFiltering = searchQuery.trim().length > 0;
  const noMatches = isFiltering && orderedWidgetIds.length === 0;

  return (
    <div className="space-y-3">
      {orderedWidgetIds.length > 0 && (
        <p className="text-xs text-muted">
          {isFiltering
            ? `Showing ${orderedWidgetIds.length} of ${visibleWidgetIds.length} widget${visibleWidgetIds.length === 1 ? '' : 's'}`
            : 'Drag widgets by the handle to reorder. Click a widget header to expand or collapse it.'}
        </p>
      )}

      {noMatches ? (
        <div className="rounded-2xl border border-dashed border-border-warm bg-white px-6 py-12 text-center">
          <p className="font-medium text-ink">No widgets match “{searchQuery.trim()}”</p>
          <p className="mt-1 text-sm text-muted">
            Try an app name like Slack, Jira, or Google — or clear the search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-6">
          {orderedWidgetIds.map((widgetId) => {
            const Widget = DASHBOARD_WIDGET_COMPONENTS[widgetId];
            const isDragging = draggedId === widgetId;
            const isDropTarget = dropTargetId === widgetId;
            const fullWidth = DASHBOARD_FULL_WIDTH_WIDGETS.has(widgetId);

            return (
              <div
                key={widgetId}
                className={cn(
                  'flex h-full min-w-0 flex-col',
                  fullWidth ? 'md:col-span-6' : 'md:col-span-3',
                  isDragging && 'opacity-50',
                  isDropTarget && 'rounded-2xl ring-2 ring-brand ring-offset-2',
                )}
                onDragOver={handleDragOver(widgetId)}
                onDrop={handleDrop(widgetId)}
              >
                <DashboardWidgetShellProvider
                  value={{
                    widgetId,
                    onDragStart: (event) => {
                      event.dataTransfer.setData('text/plain', widgetId);
                      event.dataTransfer.effectAllowed = 'move';
                      handleDragStart(widgetId);
                    },
                    onDragEnd: handleDragEnd,
                  }}
                >
                  <Suspense fallback={<DashboardWidgetCardSkeleton fullWidth={fullWidth} />}>
                    <Widget />
                  </Suspense>
                </DashboardWidgetShellProvider>
              </div>
            );
          })}
          {!isFiltering && (
            <div className="flex h-full min-w-0 flex-col md:col-span-3">
              <AddWidgetCard />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
