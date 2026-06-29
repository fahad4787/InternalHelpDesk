'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plug } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { integrationsService } from '@/services/integrations.service';

const HIDDEN_PROVIDERS = new Set(['GOOGLE_DRIVE', 'GMAIL', 'GOOGLE_MEET']);

const DISPLAY_ORDER = [
  'GOOGLE_CALENDAR',
  'WORKDAY',
  'JIRA',
  'SLACK',
  'ZOOM',
  'MICROSOFT_TEAMS',
  'OUTLOOK',
  'SERVICENOW',
];

const INTEGRATION_ROUTES: Record<string, string> = {
  WORKDAY: '/integrations/workday',
  GOOGLE_CALENDAR: '/integrations/google',
  ZOOM: '/integrations/zoom',
  JIRA: '/integrations/jira',
  SLACK: '/integrations/slack',
};

export default function IntegrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsService.getAll(),
  });

  const integrations = [...(data?.data ?? [])]
    .filter((integration) => !HIDDEN_PROVIDERS.has(integration.provider))
    .sort((a, b) => {
      const aIndex = DISPLAY_ORDER.indexOf(a.provider);
      const bIndex = DISPLAY_ORDER.indexOf(b.provider);
      const aOrder = aIndex === -1 ? DISPLAY_ORDER.length : aIndex;
      const bOrder = bIndex === -1 ? DISPLAY_ORDER.length : bIndex;
      return aOrder - bOrder;
    });

  return (
    <PageContainer
      title="Integrations"
      description="Connect external tools to extend your helpdesk"
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => {
            const route = INTEGRATION_ROUTES[integration.provider];

            return (
              <div
                key={integration.provider}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md"
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
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">
                    {integration.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 capitalize">
                    {integration.category}
                  </p>
                </div>
                <div className="mt-4">
                  {route ? (
                    <Link href={route} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        Configure
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
