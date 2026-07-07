'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DashboardWidgetId } from '@/constants/dashboard-widget-registry';
import {
  loadDashboardWidgetOrder,
  mergeDashboardWidgetOrder,
  reorderDashboardWidgets,
  saveDashboardWidgetOrder,
} from '@/lib/dashboard-widget-order';

export function useDashboardWidgetOrder(visibleWidgetIds: DashboardWidgetId[]) {
  const [orderedWidgetIds, setOrderedWidgetIds] = useState<DashboardWidgetId[]>(visibleWidgetIds);
  const [draggedId, setDraggedId] = useState<DashboardWidgetId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<DashboardWidgetId | null>(null);

  useEffect(() => {
    const savedOrder = loadDashboardWidgetOrder();
    setOrderedWidgetIds(mergeDashboardWidgetOrder(visibleWidgetIds, savedOrder));
  }, [visibleWidgetIds]);

  const persistOrder = useCallback((next: DashboardWidgetId[]) => {
    setOrderedWidgetIds(next);
    saveDashboardWidgetOrder(next);
  }, []);

  const handleDragStart = useCallback((widgetId: DashboardWidgetId) => {
    setDraggedId(widgetId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetId(null);
  }, []);

  const handleDragOver = useCallback(
    (widgetId: DashboardWidgetId) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (draggedId && draggedId !== widgetId) {
        setDropTargetId(widgetId);
      }
    },
    [draggedId],
  );

  const handleDrop = useCallback(
    (targetId: DashboardWidgetId) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rawId = event.dataTransfer.getData('text/plain');
      if (!rawId) return;

      const draggedWidgetId = orderedWidgetIds.find((id) => id === rawId);
      if (!draggedWidgetId || draggedWidgetId === targetId) return;

      persistOrder(reorderDashboardWidgets(orderedWidgetIds, draggedWidgetId, targetId));
      setDraggedId(null);
      setDropTargetId(null);
    },
    [orderedWidgetIds, persistOrder],
  );

  return {
    orderedWidgetIds,
    draggedId,
    dropTargetId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
