'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { SharePointConnectionCard } from '@/components/shared/sharepoint-connection-card';
import { SharePointPreferencesCard } from '@/components/shared/sharepoint-preferences-card';
import { SharePointUnsupportedAccountCard } from '@/components/shared/sharepoint-unsupported-account-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import { isPersonalMicrosoftAccount } from '@/lib/teams-account';
import {
  DEFAULT_SHAREPOINT_PREFERENCES,
  sharePointService,
} from '@/services/sharepoint.service';

export default function SharePointIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['sharepoint-status'],
    queryFn: () => sharePointService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_SHAREPOINT_PREFERENCES;
  const isPersonalAccount = isPersonalMicrosoftAccount(status?.sharepointEmail);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['sharepoint-status'] });
      queryClient.invalidateQueries({ queryKey: ['sharepoint-sites'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/sharepoint', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/sharepoint', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => sharePointService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => sharePointService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharepoint-status'] });
      queryClient.removeQueries({ queryKey: ['sharepoint-sites'] });
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
      title="SharePoint"
      description="Followed sites from your linked Microsoft 365 account"
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
        <SharePointConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && isPersonalAccount && (
          <SharePointUnsupportedAccountCard email={status?.sharepointEmail} />
        )}

        {isConnected && !isPersonalAccount && (
          <SharePointPreferencesCard preferences={preferences} />
        )}

        {isConnected && !isPersonalAccount && (
          <IntegrationWidgetsSection provider="SHAREPOINT" />
        )}
      </div>
    </PageContainer>
  );
}
