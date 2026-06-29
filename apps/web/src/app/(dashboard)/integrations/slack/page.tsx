'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { SlackConnectionCard } from '@/components/shared/slack-connection-card';
import { SlackMessenger } from '@/components/shared/slack-messenger';
import { SlackPreferencesCard } from '@/components/shared/slack-preferences-card';
import { SlackProfileCard } from '@/components/shared/slack-profile-card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_SLACK_PREFERENCES,
  SlackChannel,
  slackService,
} from '@/services/slack.service';

function pickDefaultChannel(
  channels: SlackChannel[],
  showChannels: boolean,
  showDirectMessages: boolean,
): SlackChannel | null {
  if (channels.length === 0) return null;

  if (showChannels) {
    const firstChannel = channels.find((channel) => channel.kind === 'channel');
    if (firstChannel) return firstChannel;
  }

  if (showDirectMessages) {
    const firstDm = channels.find(
      (channel) => channel.kind === 'dm' || channel.kind === 'group_dm',
    );
    if (firstDm) return firstDm;
  }

  return channels[0];
}

export default function SlackIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState('');

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['slack-status'],
    queryFn: () => slackService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_SLACK_PREFERENCES;
  const showProfile = isConnected && preferences.showProfile === true;
  const showChannelsPref = isConnected && preferences.showChannels === true;
  const showDirectMessagesPref =
    isConnected && preferences.showDirectMessages === true;
  const showMessenger = showChannelsPref || showDirectMessagesPref;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['slack-profile'],
    queryFn: () => slackService.getProfile(),
    enabled: isConnected && (showProfile || showMessenger),
  });

  const {
    data: channelsData,
    isLoading: channelsLoading,
    error: channelsError,
  } = useQuery({
    queryKey: ['slack-channels'],
    queryFn: () => slackService.getChannels(),
    enabled: showMessenger,
  });

  const profile = profileData?.data?.profile ?? null;
  const allChannels = channelsData?.data?.channels ?? [];
  const channelsLoadError = channelsError ? getErrorMessage(channelsError) : null;

  const visibleChannels = useMemo(() => {
    return allChannels.filter((channel) => {
      if (channel.kind === 'channel') return showChannelsPref;
      return showDirectMessagesPref;
    });
  }, [allChannels, showChannelsPref, showDirectMessagesPref]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['slack-messages', selectedChannel?.id],
    queryFn: () => slackService.getChannelMessages(selectedChannel!.id),
    enabled: showMessenger && selectedChannel != null,
  });

  const messages = messagesData?.data?.messages ?? [];
  const messagesLoadError = messagesError ? getErrorMessage(messagesError) : null;

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      slackService.sendChannelMessage(selectedChannel!.id, text),
    onMutate: () => {
      setSendError('');
      setMessageInput('');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['slack-messages', selectedChannel?.id],
      });
    },
    onError: (err, text) => {
      setMessageInput(text);
      setSendError(getErrorMessage(err));
    },
  });

  useEffect(() => {
    if (visibleChannels.length === 0) {
      setSelectedChannel(null);
      return;
    }

    setSelectedChannel((current) => {
      if (current && visibleChannels.some((channel) => channel.id === current.id)) {
        return current;
      }
      return pickDefaultChannel(
        visibleChannels,
        showChannelsPref,
        showDirectMessagesPref,
      );
    });
  }, [visibleChannels, showChannelsPref, showDirectMessagesPref]);

  useEffect(() => {
    setMessageInput('');
    setSendError('');
  }, [selectedChannel?.id]);

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

  const handleSend = () => {
    const text = messageInput.trim();
    if (!text || !selectedChannel || sendMutation.isPending) return;
    sendMutation.mutate(text);
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

        {showProfile && (
          <SlackProfileCard profile={profile} isLoading={profileLoading} />
        )}

        {showMessenger && (
          <>
            {channelsLoadError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {channelsLoadError}
              </p>
            )}
            <SlackMessenger
              channels={visibleChannels}
              channelsLoading={channelsLoading}
              selectedChannel={selectedChannel}
              onSelectChannel={setSelectedChannel}
              showChannels={showChannelsPref}
              showDirectMessages={showDirectMessagesPref}
              messages={messages}
              messagesLoading={messagesLoading}
              messagesError={messagesLoadError}
              currentUserId={profile?.userId ?? null}
              input={messageInput}
              onInputChange={(value) => {
                setMessageInput(value);
                if (sendError) setSendError('');
              }}
              onSend={handleSend}
              isSending={sendMutation.isPending}
              sendError={sendError}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}
