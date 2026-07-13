'use client';

import { PageContainer } from '@/components/shared/page-container';
import { IntegrationsMarketplace } from '@/components/dashboard/integrations-marketplace';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { APP_RELEASE } from '@/constants/app-release';
import { MARKETPLACE_APP_COUNT } from '@/constants/navigation';

export default function IntegrationsPage() {
  return (
    <DashboardShell>
      <PageContainer
        title="Integrations"
        description={`Connect your tools, then toggle widgets on each integration page. Enabled widgets appear on your dashboard automatically. · ${MARKETPLACE_APP_COUNT} apps · ${APP_RELEASE}`}
      >
        <IntegrationsMarketplace />
      </PageContainer>
    </DashboardShell>
  );
}
