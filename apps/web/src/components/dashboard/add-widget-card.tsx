'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  IntegrationIcon,
  isIntegrationIconProvider,
} from '@/components/shared/integration-icon';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import { getConnectedIntegrationRoutes } from '@/lib/dashboard-widget-utils';

export function AddWidgetCard() {
  const { visibleWidgetIds, statuses } = useDashboardVisibleWidgets();
  const connectedRoutes = getConnectedIntegrationRoutes(statuses);

  if (connectedRoutes.length === 0) {
    return (
      <Link
        href="/integrations"
        className="dashboard-add-widget flex h-full max-h-[28rem] min-h-0 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl p-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-border-warm bg-white">
          <Plus className="h-6 w-6 text-brand" aria-hidden />
        </div>
        <div>
          <p className="font-semibold text-ink">Connect an app</p>
          <p className="mt-1 max-w-[260px] text-sm text-muted">
            Connect Google, Jira, Slack, Zoom, Outlook, or Workday, then toggle widgets on each
            integration page.
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="dashboard-add-widget flex h-full max-h-[28rem] min-h-0 w-full flex-col overflow-hidden rounded-2xl p-5">
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border-warm bg-white">
            <Plus className="h-5 w-5 text-brand" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-ink">Manage widgets</p>
            <p className="text-sm text-muted">
              {visibleWidgetIds.length > 0
                ? `${visibleWidgetIds.length} widget${visibleWidgetIds.length === 1 ? '' : 's'} on your dashboard`
                : 'Toggle widgets on each connected app'}
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" role="list">
        {connectedRoutes.map((route) => (
          <li key={route.provider}>
            <Link
              href={route.route}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-warm bg-white px-3 py-2.5 text-sm transition-colors hover:border-positive-muted hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {isIntegrationIconProvider(route.provider) && (
                  <IntegrationIcon provider={route.provider} size="sm" />
                )}
                <span className="font-medium text-ink">{route.label}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">Configure widgets</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/integrations"
        className="mt-4 shrink-0 text-center text-sm font-medium text-brand hover:underline"
      >
        Browse all integrations
      </Link>
    </div>
  );
}
