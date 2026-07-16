'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { HubSpotConnectionCard } from '@/components/shared/hubspot-connection-card';
import { HubSpotPreferencesCard } from '@/components/shared/hubspot-preferences-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_HUBSPOT_PREFERENCES,
  hubspotService,
} from '@/services/hubspot.service';

export default function HubSpotIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['hubspot-status'],
    queryFn: () => hubspotService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_HUBSPOT_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['hubspot-status'] });
      queryClient.invalidateQueries({ queryKey: ['hubspot-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['hubspot-deals'] });
      queryClient.invalidateQueries({ queryKey: ['hubspot-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/hubspot', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/hubspot', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => hubspotService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => hubspotService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubspot-status'] });
      queryClient.removeQueries({ queryKey: ['hubspot-contacts'] });
      queryClient.removeQueries({ queryKey: ['hubspot-deals'] });
      queryClient.removeQueries({ queryKey: ['hubspot-tickets'] });
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
      title="HubSpot"
      description="Contacts, deals, and tickets from your linked HubSpot account"
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
        <HubSpotConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <HubSpotPreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="HUBSPOT" />}
      </div>
    </PageContainer>
  );
}
