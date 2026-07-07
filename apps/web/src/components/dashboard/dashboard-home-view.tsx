'use client';

import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import {
  DashboardWidgetsSkeleton,
  FocusBannerSkeleton,
} from '@/components/shared/loading-state';
import { FocusBanner } from './focus-banner';
import { DashboardWidgetGrid } from './dashboard-widget-grid';

export function DashboardHomeView() {
  const { visibleWidgetIds, isLoading } = useDashboardVisibleWidgets();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <FocusBannerSkeleton />
        <DashboardWidgetsSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FocusBanner />

      <DashboardWidgetGrid visibleWidgetIds={visibleWidgetIds} />

      {visibleWidgetIds.length === 0 && (
        <p className="text-center text-sm text-muted">
          Connect an app and turn on widgets from its integration page. Open{' '}
          <a href="/integrations/google" className="font-medium text-brand hover:underline">
            Google
          </a>
          ,{' '}
          <a href="/integrations/jira" className="font-medium text-brand hover:underline">
            Jira
          </a>
          , or other integrations to get started.
        </p>
      )}
    </div>
  );
}
