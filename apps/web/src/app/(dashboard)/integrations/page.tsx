'use client';

import { PageContainer } from '@/components/shared/page-container';
import { IntegrationsMarketplace } from '@/components/dashboard/integrations-marketplace';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function IntegrationsPage() {
  return (
    <DashboardShell>
      <PageContainer
        title="Integrations"
        description="Connect your tools, then toggle widgets on each integration page. Enabled widgets appear on your dashboard automatically."
      >
        <IntegrationsMarketplace />
      </PageContainer>
    </DashboardShell>
  );
}
