'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plug } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { integrationsService } from '@/services/integrations.service';

export default function IntegrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsService.getAll(),
  });

  const integrations = data?.data ?? [];

  return (
    <PageContainer
      title="Integrations"
      description="Connect external tools to extend your helpdesk"
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations
            .filter((integration) => integration.provider !== 'GOOGLE_DRIVE')
            .map((integration) => {
            const isWorkday = integration.provider === 'WORKDAY';
            const isGoogle = integration.provider === 'GOOGLE_CALENDAR';
            const isZoom = integration.provider === 'ZOOM';
            const hasConfig = isWorkday || isGoogle || isZoom;

            return (
              <div
                key={integration.provider}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-muted bg-brand-light">
                    <Plug className="h-5 w-5 text-brand" />
                  </div>
                  <Badge
                    variant={
                      integration.status === 'CONNECTED' ? 'success' : 'secondary'
                    }
                  >
                    {integration.status === 'CONNECTED' ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{integration.description}</p>
                <p className="mt-2 text-xs text-slate-400 capitalize">
                  {integration.category}
                </p>
                {hasConfig ? (
                  <Link
                    href={
                      isWorkday
                        ? '/integrations/workday'
                        : isZoom
                          ? '/integrations/zoom'
                          : '/integrations/google'
                    }
                  >
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Configure
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" className="mt-4 w-full" disabled>
                    Coming Soon
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
