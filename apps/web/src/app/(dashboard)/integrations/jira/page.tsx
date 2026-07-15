'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { JiraConnectionCard } from '@/components/shared/jira-connection-card';
import { JiraPreferencesCard } from '@/components/shared/jira-preferences-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_JIRA_PREFERENCES,
  jiraService,
} from '@/services/jira.service';

export default function JiraIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['jira-status'],
    queryFn: () => jiraService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_JIRA_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['jira-status'] });
      queryClient.invalidateQueries({ queryKey: ['jira-issues'] });
      queryClient.invalidateQueries({ queryKey: ['jira-projects'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/jira', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/jira', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectJiraMutation = useMutation({
    mutationFn: () => jiraService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => jiraService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-status'] });
      queryClient.invalidateQueries({ queryKey: ['jira-issues'] });
      queryClient.invalidateQueries({ queryKey: ['jira-projects'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending =
    connectJiraMutation.isPending || disconnectMutation.isPending;

  const connectError = connectJiraMutation.error
    ? getErrorMessage(connectJiraMutation.error)
    : null;

  return (
    <PageContainer
      title="Jira"
      description="Issues and projects from your linked Jira account"
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
        <JiraConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectJiraMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <JiraPreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="JIRA" />}
      </div>
    </PageContainer>
  );
}
