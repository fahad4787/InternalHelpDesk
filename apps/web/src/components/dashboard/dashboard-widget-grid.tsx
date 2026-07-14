'use client';

import {
  DASHBOARD_WIDGET_COMPONENTS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';
import { useDashboardWidgetOrder } from '@/hooks/use-dashboard-widget-order';
import { INTEGRATION_FULL_WIDTH_WIDGETS } from '@/lib/dashboard-widget-utils';
import { cn } from '@/lib/utils';
import { AddWidgetCard } from './add-widget-card';
import { DashboardWidgetShellProvider } from './dashboard-widget-shell-context';

interface DashboardWidgetGridProps {
  visibleWidgetIds: DashboardWidgetId[];
}

export function DashboardWidgetGrid({ visibleWidgetIds }: DashboardWidgetGridProps) {
  const {
    orderedWidgetIds,
    draggedId,
    dropTargetId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  } = useDashboardWidgetOrder(visibleWidgetIds);

  return (
    <div className="space-y-3">
      {orderedWidgetIds.length > 0 && (
        <p className="text-xs text-muted">
          Drag widgets by the handle to reorder. Click a widget header to expand or collapse it.
        </p>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-6">
        {orderedWidgetIds.map((widgetId) => {
          const Widget = DASHBOARD_WIDGET_COMPONENTS[widgetId];
          const isDragging = draggedId === widgetId;
          const isDropTarget = dropTargetId === widgetId;
          const fullWidth = INTEGRATION_FULL_WIDTH_WIDGETS.has(widgetId);

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
                <Widget />
              </DashboardWidgetShellProvider>
            </div>
          );
        })}
        <div className="flex h-full min-w-0 flex-col md:col-span-3">
          <AddWidgetCard />
        </div>
      </div>
    </div>
  );
}
