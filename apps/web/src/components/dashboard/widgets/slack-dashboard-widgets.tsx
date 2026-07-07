'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SlackMessenger } from '@/components/shared/slack-messenger';
import { SlackProfileCard } from '@/components/shared/slack-profile-card';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_SLACK_PREFERENCES,
  type SlackChannel,
  slackService,
} from '@/services/slack.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

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
    const dm = channels.find((item) => item.kind === 'dm' || item.kind === 'group_dm');
    if (dm) return dm;
  }
  return channels[0];
}

export function SlackProfileDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['slack-profile'],
    queryFn: () => slackService.getProfile(),
  });

  const profile = data?.data?.profile ?? null;

  return (
    <DashboardWidgetCard
      source="Slack"
      sourceLogo={<IntegrationIcon provider="SLACK" />}
      title="Workspace profile"
      deepLinkHref="/integrations/slack"
      deepLinkLabel="Open Slack"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : (
        <SlackProfileCard profile={profile} isLoading={false} />
      )}
    </DashboardWidgetCard>
  );
}

export function SlackMessengerDashboardWidget({
  compact = true,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null);
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

  const activeChannel = selectedChannel ?? pickDefaultChannel(visibleChannels, showChannels, showDirectMessages);

  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['slack-messages', activeChannel?.id],
    queryFn: () => slackService.getChannelMessages(activeChannel!.id),
    enabled: !!activeChannel,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => slackService.sendChannelMessage(activeChannel!.id, text),
    onMutate: () => {
      setSendError('');
      setMessageInput('');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slack-messages', activeChannel?.id] });
    },
    onError: (err, text) => {
      setMessageInput(text);
      setSendError(getErrorMessage(err));
    },
  });

  return (
    <DashboardWidgetCard
      source="Slack"
      sourceLogo={<IntegrationIcon provider="SLACK" />}
      title="Channels & messages"
      deepLinkHref="/integrations/slack"
      deepLinkLabel="Open Slack"
      fillContent
      className={className}
    >
      <div className="h-full overflow-hidden rounded-xl border border-border-warm">
        <SlackMessenger
          compact={compact}
          channels={visibleChannels}
          channelsLoading={channelsLoading}
          selectedChannel={activeChannel}
          onSelectChannel={setSelectedChannel}
          showChannels={showChannels}
          showDirectMessages={showDirectMessages}
          messages={messagesData?.data?.messages ?? []}
          messagesLoading={messagesLoading}
          messagesError={messagesError ? getErrorMessage(messagesError) : null}
          currentUserId={profileData?.data?.profile?.userId}
          input={messageInput}
          onInputChange={setMessageInput}
          onSend={() => {
            const text = messageInput.trim();
            if (!text || !activeChannel) return;
            sendMutation.mutate(text);
          }}
          isSending={sendMutation.isPending}
          sendError={sendError}
        />
      </div>
    </DashboardWidgetCard>
  );
}
