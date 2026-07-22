'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessagesSquare, Users } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { TeamsConnectionCard } from '@/components/shared/teams-connection-card';
import { TeamsPreferencesCard } from '@/components/shared/teams-preferences-card';
import { TeamsProfileCard } from '@/components/shared/teams-profile-card';
import { TeamsChatList, TeamsTeamList } from '@/components/shared/teams-lists';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api-client';
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

  const profileQuery = useQuery({
    queryKey: ['teams-profile'],
    queryFn: () => teamsService.getProfile(),
    enabled: isConnected && preferences.showProfile,
  });

  const teamsQuery = useQuery({
    queryKey: ['teams-joined'],
    queryFn: () => teamsService.getTeams(),
    enabled: isConnected && preferences.showTeams,
  });

  const chatsQuery = useQuery({
    queryKey: ['teams-chats'],
    queryFn: () => teamsService.getChats(),
    enabled: isConnected && preferences.showChats,
  });

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['teams-status'] });
      queryClient.invalidateQueries({ queryKey: ['teams-profile'] });
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
      queryClient.removeQueries({ queryKey: ['teams-profile'] });
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

  const teams = teamsQuery.data?.data?.teams ?? [];
  const chats = chatsQuery.data?.data?.chats ?? [];
  const profile = profileQuery.data?.data?.profile ?? null;

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

        {isConnected && <TeamsPreferencesCard preferences={preferences} />}

        {isConnected && preferences.showProfile && (
          <div>
            {profileQuery.isLoading ? (
              <WidgetContentSkeleton lines={3} />
            ) : profile ? (
              <TeamsProfileCard profile={profile} />
            ) : (
              <p className="text-sm text-muted">Profile unavailable.</p>
            )}
          </div>
        )}

        {isConnected && preferences.showTeams && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Joined teams</CardTitle>
            </CardHeader>
            <CardContent>
              {teamsQuery.isLoading ? (
                <WidgetContentSkeleton lines={4} />
              ) : teams.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No teams found"
                  description="You are not a member of any Microsoft Teams yet"
                />
              ) : (
                <TeamsTeamList teams={teams} />
              )}
            </CardContent>
          </Card>
        )}

        {isConnected && preferences.showChats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent chats</CardTitle>
            </CardHeader>
            <CardContent>
              {chatsQuery.isLoading ? (
                <WidgetContentSkeleton lines={4} />
              ) : chats.length === 0 ? (
                <EmptyState
                  icon={MessagesSquare}
                  title="No chats found"
                  description="Connect a Microsoft 365 work account that has Teams chats. Personal teams.live.com chats may not appear via Graph."
                />
              ) : (
                <TeamsChatList chats={chats} />
              )}
            </CardContent>
          </Card>
        )}

        {isConnected && <IntegrationWidgetsSection provider="MICROSOFT_TEAMS" />}
      </div>
    </PageContainer>
  );
}
