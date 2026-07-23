'use client';

import { Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import {
  SharePointSiteList,
  SHAREPOINT_HOME_URL,
} from '@/components/shared/sharepoint-site-list';
import { sharePointService } from '@/services/sharepoint.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function SharePointSitesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['sharepoint-sites'],
    queryFn: () => sharePointService.getSites(),
  });

  const sites = data?.data?.sites ?? [];

  return (
    <DashboardWidgetCard
      source="SharePoint"
      sourceLogo={<IntegrationIcon provider="SHAREPOINT" />}
      title="SharePoint sites"
      deepLinkHref={SHAREPOINT_HOME_URL}
      deepLinkLabel="Open SharePoint"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : sites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No followed sites"
          description="Follow SharePoint sites in Microsoft 365, or connect a work/school account if you use a personal Microsoft login"
        />
      ) : (
        <SharePointSiteList sites={sites} />
      )}
    </DashboardWidgetCard>
  );
}
