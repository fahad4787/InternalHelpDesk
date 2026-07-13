'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { CalendlyConnectionCard } from '@/components/shared/calendly-connection-card';
import { CalendlyPreferencesCard } from '@/components/shared/calendly-preferences-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_CALENDLY_PREFERENCES,
  calendlyService,
} from '@/services/calendly.service';

export default function CalendlyIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['calendly-status'],
    queryFn: () => calendlyService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_CALENDLY_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['calendly-status'] });
      queryClient.invalidateQueries({ queryKey: ['calendly-event-types'] });
      queryClient.invalidateQueries({ queryKey: ['calendly-events'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/calendly', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/calendly', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => calendlyService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => calendlyService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendly-status'] });
      queryClient.removeQueries({ queryKey: ['calendly-event-types'] });
      queryClient.removeQueries({ queryKey: ['calendly-events'] });
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
      title="Calendly"
      description="Event types and upcoming meetings from your linked Calendly account"
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
        <CalendlyConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <CalendlyPreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="CALENDLY" />}
      </div>
    </PageContainer>
  );
}
