'use client';

import {
  DASHBOARD_WIDGET_COMPONENTS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';
import { useIntegrationWidgets } from '@/hooks/use-integration-widgets';
import { INTEGRATION_FULL_WIDTH_WIDGETS } from '@/lib/dashboard-widget-utils';
import { DashboardWidgetsSkeleton } from '@/components/shared/loading-state';
import {
  IntegrationWidgetGrid,
  IntegrationWidgetGridItem,
} from './integration-widget-grid';

interface IntegrationWidgetPanelProps {
  widgetIds: DashboardWidgetId[];
  className?: string;
}

export function IntegrationWidgetPanel({
  widgetIds,
  className,
}: IntegrationWidgetPanelProps) {
  if (widgetIds.length === 0) return null;

  return (
    <IntegrationWidgetGrid className={className}>
      {widgetIds.map((widgetId) => {
        const Widget = DASHBOARD_WIDGET_COMPONENTS[widgetId];
        return (
          <IntegrationWidgetGridItem
            key={widgetId}
            fullWidth={INTEGRATION_FULL_WIDTH_WIDGETS.has(widgetId)}
          >
            <Widget />
          </IntegrationWidgetGridItem>
        );
      })}
    </IntegrationWidgetGrid>
  );
}

export function IntegrationWidgetsSection({
  provider,
  excludeWidgetIds = [],
  skeletonCount = 2,
}: {
  provider: string;
  excludeWidgetIds?: DashboardWidgetId[];
  skeletonCount?: number;
}) {
  const { widgetIds, isLoading } = useIntegrationWidgets(provider);
  const visibleWidgetIds = widgetIds.filter(
    (widgetId) => !excludeWidgetIds.includes(widgetId),
  );

  if (isLoading) {
    return <DashboardWidgetsSkeleton count={skeletonCount} />;
  }

  return <IntegrationWidgetPanel widgetIds={visibleWidgetIds} />;
}
