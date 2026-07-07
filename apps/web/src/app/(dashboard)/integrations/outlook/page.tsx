'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { OutlookConnectionCard } from '@/components/shared/outlook-connection-card';
import { OutlookPreferencesCard } from '@/components/shared/outlook-preferences-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_OUTLOOK_PREFERENCES,
  outlookService,
} from '@/services/outlook.service';

export default function OutlookIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['outlook-status'],
    queryFn: () => outlookService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_OUTLOOK_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['outlook-status'] });
      queryClient.invalidateQueries({ queryKey: ['outlook-profile'] });
      queryClient.invalidateQueries({ queryKey: ['outlook-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/outlook', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/outlook', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMockMutation = useMutation({
    mutationFn: () => outlookService.connectMock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlook-status'] });
      queryClient.invalidateQueries({ queryKey: ['outlook-profile'] });
      queryClient.invalidateQueries({ queryKey: ['outlook-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const connectOutlookMutation = useMutation({
    mutationFn: () => outlookService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => outlookService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlook-status'] });
      queryClient.removeQueries({ queryKey: ['outlook-profile'] });
      queryClient.removeQueries({ queryKey: ['outlook-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending =
    connectMockMutation.isPending ||
    connectOutlookMutation.isPending ||
    disconnectMutation.isPending;

  const handleConnect = () => {
    if (status?.mockMode) {
      connectMockMutation.mutate();
    } else {
      connectOutlookMutation.mutate();
    }
  };

  const connectError =
    connectMockMutation.error || connectOutlookMutation.error
      ? getErrorMessage(connectMockMutation.error || connectOutlookMutation.error)
      : null;

  return (
    <PageContainer
      title="Outlook"
      description="Inbox and email from your linked Microsoft account"
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
        <OutlookConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={handleConnect}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <OutlookPreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="OUTLOOK" />}
      </div>
    </PageContainer>
  );
}
