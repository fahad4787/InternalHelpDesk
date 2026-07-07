'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { SlackConnectionCard } from '@/components/shared/slack-connection-card';
import { SlackPreferencesCard } from '@/components/shared/slack-preferences-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_SLACK_PREFERENCES,
  slackService,
} from '@/services/slack.service';

export default function SlackIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['slack-status'],
    queryFn: () => slackService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_SLACK_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['slack-status'] });
      queryClient.invalidateQueries({ queryKey: ['slack-profile'] });
      queryClient.invalidateQueries({ queryKey: ['slack-channels'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/slack', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/slack', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMockMutation = useMutation({
    mutationFn: () => slackService.connectMock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slack-status'] });
      queryClient.invalidateQueries({ queryKey: ['slack-profile'] });
      queryClient.invalidateQueries({ queryKey: ['slack-channels'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => slackService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slack-status'] });
      queryClient.removeQueries({ queryKey: ['slack-profile'] });
      queryClient.removeQueries({ queryKey: ['slack-channels'] });
      queryClient.removeQueries({ queryKey: ['slack-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const handleConnect = async () => {
    if (status?.mockMode) {
      connectMockMutation.mutate();
      return;
    }

    try {
      const response = await slackService.getAuthUrl();
      window.location.href = response.data.url;
    } catch (error) {
      connectMockMutation.reset();
      setAuthError(getErrorMessage(error));
    }
  };

  const isPending =
    connectMockMutation.isPending || disconnectMutation.isPending;
  const connectError =
    connectMockMutation.error != null
      ? getErrorMessage(connectMockMutation.error)
      : null;

  return (
    <PageContainer
      title="Slack Integration"
      description="Connect Slack for notifications and channel access"
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
        <SlackConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={handleConnect}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && (
          <SlackPreferencesCard preferences={preferences} disabled={isPending} />
        )}

        {isConnected && (
          <IntegrationWidgetsSection provider="SLACK" skeletonCount={1} />
        )}
      </div>
    </PageContainer>
  );
}
