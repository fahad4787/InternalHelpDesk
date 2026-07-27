'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { integrationsService } from '@/services/integrations.service';
import { resolveVisibleDashboardWidgets } from '@/lib/dashboard-widget-utils';
import type { DashboardIntegrationStatuses } from '@/lib/dashboard-widget-utils';

const STATUS_STALE_MS = 120_000;

export function useDashboardVisibleWidgets(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const statusQuery = useQuery({
    queryKey: ['dashboard-status'],
    queryFn: () => integrationsService.getDashboardStatus(),
    staleTime: STATUS_STALE_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled,
  });

  const statuses: DashboardIntegrationStatuses = useMemo(
    () => statusQuery.data?.data ?? {},
    [statusQuery.data?.data],
  );

  const visibleWidgetIds = useMemo(
    () => resolveVisibleDashboardWidgets(statuses),
    [statuses],
  );

  const connectedCount = useMemo(() => {
    return Object.values(statuses).filter(
      (status) => status && typeof status === 'object' && 'connected' in status && status.connected,
    ).length;
  }, [statuses]);

  const isBootstrapping =
    enabled && statusQuery.isPending && !statusQuery.data;

  return {
    visibleWidgetIds,
    isBootstrapping,
    isResolvingWidgets: false,
    isLoading: isBootstrapping,
    connectedCount,
    statuses,
  };
}
