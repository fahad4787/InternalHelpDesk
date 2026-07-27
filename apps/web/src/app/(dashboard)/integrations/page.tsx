'use client';

import { PageContainer } from '@/components/shared/page-container';
import { IntegrationsMarketplace } from '@/components/dashboard/integrations-marketplace';

export default function IntegrationsPage() {
  return (
    <PageContainer
      title="Integrations"
      description="Connect your tools, then toggle widgets on each integration page. Enabled widgets appear on your dashboard automatically."
    >
      <IntegrationsMarketplace />
    </PageContainer>
  );
}
