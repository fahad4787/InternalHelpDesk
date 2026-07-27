'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { ZohoCrmConnectionCard } from '@/components/integrations/zoho-crm/zoho-crm-connection-card';
import { ZohoCrmPreferencesCard } from '@/components/integrations/zoho-crm/zoho-crm-preferences-card';
import { IntegrationWidgetsSection } from '@/components/integrations/common/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import { invalidateProviderStatus } from '@/lib/integration-query-keys';
import {
  DEFAULT_ZOHO_CRM_PREFERENCES,
  zohoCrmService,
} from '@/services/zoho-crm.service';

export default function ZohoCrmIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['zoho-crm-status'],
    queryFn: () => zohoCrmService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_ZOHO_CRM_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      invalidateProviderStatus(queryClient, 'zoho-crm-status');
      queryClient.invalidateQueries({ queryKey: ['zoho-crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['zoho-crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['zoho-crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/zoho-crm', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/zoho-crm', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => zohoCrmService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => zohoCrmService.disconnect(),
    onSuccess: () => {
      invalidateProviderStatus(queryClient, 'zoho-crm-status');
      queryClient.removeQueries({ queryKey: ['zoho-crm-contacts'] });
      queryClient.removeQueries({ queryKey: ['zoho-crm-deals'] });
      queryClient.removeQueries({ queryKey: ['zoho-crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending = connectMutation.isPending || disconnectMutation.isPending;
  const connectError =
    connectMutation.error != null
      ? getErrorMessage(connectMutation.error)
      : null;

  return (
    <PageContainer
      title="Zoho CRM"
      description="Contacts, deals, and leads from your linked Zoho CRM account"
      actions={
        <Link href="/integrations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <ZohoCrmConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <ZohoCrmPreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="ZOHO_CRM" />}
      </div>
    </PageContainer>
  );
}
