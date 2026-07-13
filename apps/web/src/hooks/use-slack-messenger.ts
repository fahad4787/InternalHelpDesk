'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_SLACK_PREFERENCES,
  type SlackChannel,
  slackService,
} from '@/services/slack.service';

function pickDefaultChannel(
  channels: SlackChannel[],
  showChannels: boolean,
  showDirectMessages: boolean,
): SlackChannel | null {
  if (channels.length === 0) return null;
  if (showChannels) {
    const channel = channels.find((item) => item.kind === 'channel');
    if (channel) return channel;
  }
  if (showDirectMessages) {
    const dm = channels.find(
      (item) => item.kind === 'dm' || item.kind === 'group_dm',
    );
    if (dm) return dm;
  }
  return channels[0];
}

export function useSlackMessenger() {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(
    null,
  );
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState('');

  const { data: statusData } = useQuery({
    queryKey: ['slack-status'],
    queryFn: () => slackService.getStatus(),
  });

  const preferences = statusData?.data?.preferences ?? DEFAULT_SLACK_PREFERENCES;
  const showChannels = preferences.showChannels === true;
  const showDirectMessages = preferences.showDirectMessages === true;

  const { data: profileData } = useQuery({
    queryKey: ['slack-profile'],
    queryFn: () => slackService.getProfile(),
  });

  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['slack-channels'],
    queryFn: () => slackService.getChannels(),
  });

  const allChannels = channelsData?.data?.channels ?? [];
  const visibleChannels = useMemo(
    () =>
      allChannels.filter((channel) => {
        if (channel.kind === 'channel') return showChannels;
        return showDirectMessages;
      }),
    [allChannels, showChannels, showDirectMessages],
  );

  const activeChannel =
    selectedChannel ??
    pickDefaultChannel(visibleChannels, showChannels, showDirectMessages);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['slack-messages', activeChannel?.id],
    queryFn: () => slackService.getChannelMessages(activeChannel!.id),
    enabled: !!activeChannel,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      slackService.sendChannelMessage(activeChannel!.id, text),
    onMutate: () => {
      setSendError('');
      setMessageInput('');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['slack-messages', activeChannel?.id],
      });
    },
    onError: (err, text) => {
      setMessageInput(text);
      setSendError(getErrorMessage(err));
    },
  });

  return {
    channels: visibleChannels,
    channelsLoading,
    selectedChannel: activeChannel,
    onSelectChannel: setSelectedChannel,
    showChannels,
    showDirectMessages,
    messages: messagesData?.data?.messages ?? [],
    messagesLoading,
    messagesError: messagesError ? getErrorMessage(messagesError) : null,
    currentUserId: profileData?.data?.profile?.userId,
    input: messageInput,
    onInputChange: setMessageInput,
    onSend: () => {
      const text = messageInput.trim();
      if (!text || !activeChannel) return;
      sendMutation.mutate(text);
    },
    isSending: sendMutation.isPending,
    sendError,
  };
}
