'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { TeamsChannelList } from '@/components/shared/teams-channel-list';
import { TeamsChannelMessages } from '@/components/shared/teams-channel-messages';
import { TeamsConnectionCard } from '@/components/shared/teams-connection-card';
import { TeamsPreferencesCard } from '@/components/shared/teams-preferences-card';
import { TeamsProfileCard } from '@/components/shared/teams-profile-card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_TEAMS_PREFERENCES,
  TeamsChannel,
  teamsService,
} from '@/services/teams.service';

export default function TeamsIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<TeamsChannel | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['teams-status'],
    queryFn: () => teamsService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_TEAMS_PREFERENCES;
  const showProfile = isConnected && preferences.showProfile === true;
  const showChannels = isConnected && preferences.showChannels === true;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['teams-profile'],
    queryFn: () => teamsService.getProfile(),
    enabled: showProfile,
  });

  const {
    data: channelsData,
    isLoading: channelsLoading,
    error: channelsError,
  } = useQuery({
    queryKey: ['teams-channels'],
    queryFn: () => teamsService.getChannels(),
    enabled: showChannels,
  });

  const profile = profileData?.data?.profile ?? null;
  const channels = channelsData?.data?.channels ?? [];
  const channelsLoadError = channelsError ? getErrorMessage(channelsError) : null;

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['teams-messages', selectedChannel?.teamId, selectedChannel?.id],
    queryFn: () =>
      teamsService.getChannelMessages(
        selectedChannel!.teamId,
        selectedChannel!.id,
      ),
    enabled: showChannels && selectedChannel != null,
  });

  const messages = messagesData?.data?.messages ?? [];
  const messagesLoadError = messagesError ? getErrorMessage(messagesError) : null;

  useEffect(() => {
    if (channels.length === 0) {
      setSelectedChannel(null);
      return;
    }

    setSelectedChannel((current) => {
      if (
        current &&
        channels.some(
          (channel) =>
            channel.id === current.id && channel.teamId === current.teamId,
        )
      ) {
        return current;
      }
      return channels[0];
    });
  }, [channels]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['teams-status'] });
      queryClient.invalidateQueries({ queryKey: ['teams-profile'] });
      queryClient.invalidateQueries({ queryKey: ['teams-channels'] });
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

  const connectMockMutation = useMutation({
    mutationFn: () => teamsService.connectMock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-status'] });
      queryClient.invalidateQueries({ queryKey: ['teams-profile'] });
      queryClient.invalidateQueries({ queryKey: ['teams-channels'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => teamsService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-status'] });
      queryClient.removeQueries({ queryKey: ['teams-profile'] });
      queryClient.removeQueries({ queryKey: ['teams-channels'] });
      queryClient.removeQueries({ queryKey: ['teams-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const handleConnect = async () => {
    if (status?.mockMode) {
      connectMockMutation.mutate();
      return;
    }

    try {
      const response = await teamsService.getAuthUrl();
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
      title="Microsoft Teams Integration"
      description="Connect Microsoft Teams for channel access"
      action={
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
          onConnect={handleConnect}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && (
          <TeamsPreferencesCard preferences={preferences} disabled={isPending} />
        )}

        {showProfile && (
          <TeamsProfileCard profile={profile} isLoading={profileLoading} />
        )}

        {showChannels && (
          <>
            {channelsLoadError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {channelsLoadError}
              </p>
            )}
            <TeamsChannelList
              channels={channels}
              isLoading={channelsLoading}
              selectedChannelId={selectedChannel?.id ?? null}
              onSelectChannel={setSelectedChannel}
            />
            {selectedChannel && (
              <TeamsChannelMessages
                channelName={selectedChannel.name}
                teamName={selectedChannel.teamName}
                messages={messages}
                isLoading={messagesLoading}
                error={messagesLoadError}
              />
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
