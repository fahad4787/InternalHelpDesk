'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { ZohoPeopleConnectionCard } from '@/components/integrations/zoho-people/zoho-people-connection-card';
import { ZohoPeoplePreferencesCard } from '@/components/integrations/zoho-people/zoho-people-preferences-card';
import { IntegrationWidgetsSection } from '@/components/integrations/common/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_ZOHO_PEOPLE_PREFERENCES,
  zohoPeopleService,
} from '@/services/zoho-people.service';

export default function ZohoPeopleIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['zoho-people-status'],
    queryFn: () => zohoPeopleService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_ZOHO_PEOPLE_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['zoho-people-status'] });
      queryClient.invalidateQueries({ queryKey: ['zoho-people-employees'] });
      queryClient.invalidateQueries({ queryKey: ['zoho-people-leave'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/zoho-people', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/zoho-people', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => zohoPeopleService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => zohoPeopleService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-people-status'] });
      queryClient.removeQueries({ queryKey: ['zoho-people-employees'] });
      queryClient.removeQueries({ queryKey: ['zoho-people-leave'] });
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
      title="Zoho People"
      description="Employees and leave from your linked Zoho People account"
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
        <ZohoPeopleConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <ZohoPeoplePreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="ZOHO_PEOPLE" />}
      </div>
    </PageContainer>
  );
}
