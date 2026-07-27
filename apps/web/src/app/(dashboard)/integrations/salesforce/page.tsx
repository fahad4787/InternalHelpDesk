'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { SalesforceConnectionCard } from '@/components/integrations/salesforce/salesforce-connection-card';
import { SalesforcePreferencesCard } from '@/components/integrations/salesforce/salesforce-preferences-card';
import { IntegrationWidgetsSection } from '@/components/integrations/common/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import { invalidateProviderStatus } from '@/lib/integration-query-keys';
import {
  DEFAULT_SALESFORCE_PREFERENCES,
  salesforceService,
} from '@/services/salesforce.service';

export default function SalesforceIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['salesforce-status'],
    queryFn: () => salesforceService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_SALESFORCE_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      invalidateProviderStatus(queryClient, 'salesforce-status');
      queryClient.invalidateQueries({ queryKey: ['salesforce-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['salesforce-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['salesforce-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/salesforce', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/salesforce', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => salesforceService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => salesforceService.disconnect(),
    onSuccess: () => {
      invalidateProviderStatus(queryClient, 'salesforce-status');
      queryClient.removeQueries({ queryKey: ['salesforce-contacts'] });
      queryClient.removeQueries({ queryKey: ['salesforce-accounts'] });
      queryClient.removeQueries({ queryKey: ['salesforce-opportunities'] });
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
      title="Salesforce"
      description="Contacts, accounts, and opportunities from your linked Salesforce org"
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
        <SalesforceConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && (
          <SalesforcePreferencesCard preferences={preferences} />
        )}

        {isConnected && <IntegrationWidgetsSection provider="SALESFORCE" />}
      </div>
    </PageContainer>
  );
}
