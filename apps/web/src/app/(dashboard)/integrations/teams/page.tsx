'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { TeamsConnectionCard } from '@/components/shared/teams-connection-card';
import { TeamsPreferencesCard } from '@/components/shared/teams-preferences-card';
import { TeamsUnsupportedAccountCard } from '@/components/shared/teams-unsupported-account-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  isPersonalMicrosoftAccount,
  isTeamsGraphUnsupportedError,
} from '@/lib/teams-account';
import {
  DEFAULT_TEAMS_PREFERENCES,
  teamsService,
} from '@/services/teams.service';

export default function TeamsIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['teams-status'],
    queryFn: () => teamsService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_TEAMS_PREFERENCES;
  const isPersonalAccount = isPersonalMicrosoftAccount(status?.teamsEmail);

  const teamsQuery = useQuery({
    queryKey: ['teams-joined'],
    queryFn: () => teamsService.getTeams(),
    enabled: isConnected && !isPersonalAccount && preferences.showTeams,
    retry: false,
  });

  const chatsQuery = useQuery({
    queryKey: ['teams-chats'],
    queryFn: () => teamsService.getChats(),
    enabled: isConnected && !isPersonalAccount && preferences.showChats,
    retry: false,
  });

  const graphUnsupported =
    isPersonalAccount ||
    (teamsQuery.isError &&
      isTeamsGraphUnsupportedError(getErrorMessage(teamsQuery.error))) ||
    (chatsQuery.isError &&
      isTeamsGraphUnsupportedError(getErrorMessage(chatsQuery.error)));

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['teams-status'] });
      queryClient.invalidateQueries({ queryKey: ['teams-joined'] });
      queryClient.invalidateQueries({ queryKey: ['teams-chats'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/teams', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/teams', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => teamsService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => teamsService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-status'] });
      queryClient.removeQueries({ queryKey: ['teams-joined'] });
      queryClient.removeQueries({ queryKey: ['teams-chats'] });
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
      title="Microsoft Teams"
      description="Teams and chats from your linked Microsoft account"
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
        <TeamsConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && graphUnsupported && (
          <TeamsUnsupportedAccountCard email={status?.teamsEmail} />
        )}

        {isConnected && !graphUnsupported && (
          <>
            <TeamsPreferencesCard preferences={preferences} />
            <IntegrationWidgetsSection provider="MICROSOFT_TEAMS" />
          </>
        )}
      </div>
    </PageContainer>
  );
}
