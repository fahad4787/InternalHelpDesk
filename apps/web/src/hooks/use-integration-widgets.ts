'use client';

import { useMemo } from 'react';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import { filterWidgetsByProvider } from '@/lib/dashboard-widget-utils';

export function useIntegrationWidgets(provider: string) {
  const { visibleWidgetIds, isLoading } = useDashboardVisibleWidgets();

  const widgetIds = useMemo(
    () => filterWidgetsByProvider(visibleWidgetIds, provider),
    [visibleWidgetIds, provider],
  );

  return { widgetIds, isLoading };
}
