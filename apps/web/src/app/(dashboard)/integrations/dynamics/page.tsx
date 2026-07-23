'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { DynamicsConnectionCard } from '@/components/shared/dynamics-connection-card';
import { DynamicsPreferencesCard } from '@/components/shared/dynamics-preferences-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_DYNAMICS_PREFERENCES,
  dynamicsService,
} from '@/services/dynamics.service';

export default function DynamicsIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['dynamics-status'],
    queryFn: () => dynamicsService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_DYNAMICS_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['dynamics-status'] });
      queryClient.invalidateQueries({ queryKey: ['dynamics-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dynamics-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dynamics-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/dynamics', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/dynamics', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => dynamicsService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => dynamicsService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamics-status'] });
      queryClient.removeQueries({ queryKey: ['dynamics-contacts'] });
      queryClient.removeQueries({ queryKey: ['dynamics-accounts'] });
      queryClient.removeQueries({ queryKey: ['dynamics-opportunities'] });
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
      title="Microsoft Dynamics 365"
      description="Contacts, accounts, and opportunities from your linked Dynamics 365 org"
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
        <DynamicsConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <DynamicsPreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="DYNAMICS_365" />}
      </div>
    </PageContainer>
  );
}
