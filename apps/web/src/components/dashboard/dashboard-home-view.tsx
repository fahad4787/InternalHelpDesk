'use client';

import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import {
  DashboardWidgetsSkeleton,
  FocusBannerSkeleton,
} from '@/components/shared/loading-state';
import { FocusBanner } from './focus-banner';
import { DashboardWidgetGrid } from './dashboard-widget-grid';

export function DashboardHomeView() {
  const {
    visibleWidgetIds,
    connectedCount,
    isBootstrapping,
    isResolvingWidgets,
  } = useDashboardVisibleWidgets();

  if (isBootstrapping) {
    return (
      <div className="space-y-6">
        <FocusBannerSkeleton />
        <DashboardWidgetsSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FocusBanner
        visibleWidgetIds={visibleWidgetIds}
        connectedCount={connectedCount}
        isResolving={isResolvingWidgets}
      />

      {isResolvingWidgets && visibleWidgetIds.length === 0 ? (
        <DashboardWidgetsSkeleton count={Math.min(Math.max(connectedCount, 2), 4)} />
      ) : (
        <DashboardWidgetGrid visibleWidgetIds={visibleWidgetIds} />
      )}

      {!isResolvingWidgets && visibleWidgetIds.length === 0 && (
        <p className="text-center text-sm text-muted">
          Connect an app from{' '}
          <a href="/integrations" className="font-medium text-brand hover:underline">
            Integrations
          </a>
          , then turn on widgets from that app&apos;s page to see them here.
        </p>
      )}
    </div>
  );
}
