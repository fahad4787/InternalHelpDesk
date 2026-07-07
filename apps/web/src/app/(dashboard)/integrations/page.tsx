'use client';

import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { IntegrationsMarketplace } from '@/components/dashboard/integrations-marketplace';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function IntegrationsPage() {
  return (
    <DashboardShell>
      <DashboardTopBar showSearch />
      <DashboardTabs />
      <IntegrationsMarketplace />
    </DashboardShell>
  );
}
