'use client';

import { SlackSidebar } from '@/components/shared/slack-sidebar';
import { SlackChatPanel } from '@/components/shared/slack-chat-panel';
import { SlackChannel, SlackMessage } from '@/services/slack.service';
import { cn } from '@/lib/utils';

export interface SlackMessengerProps {
  channels: SlackChannel[];
  channelsLoading: boolean;
  selectedChannel: SlackChannel | null;
  onSelectChannel: (channel: SlackChannel) => void;
  showChannels: boolean;
  showDirectMessages: boolean;
  messages: SlackMessage[];
  messagesLoading: boolean;
  messagesError: string | null;
  currentUserId?: string | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  sendError: string | null;
  className?: string;
}

export function SlackMessenger({
  channels,
  channelsLoading,
  selectedChannel,
  onSelectChannel,
  showChannels,
  showDirectMessages,
  messages,
  messagesLoading,
  messagesError,
  currentUserId,
  input,
  onInputChange,
  onSend,
  isSending,
  sendError,
  className,
}: SlackMessengerProps) {
  return (
    <div className={cn('flex h-full min-h-0 overflow-hidden bg-white', className)}>
      <SlackSidebar
        channels={channels}
        isLoading={channelsLoading}
        selectedChannelId={selectedChannel?.id ?? null}
        showChannels={showChannels}
        showDirectMessages={showDirectMessages}
        onSelectChannel={onSelectChannel}
      />
      <SlackChatPanel
        channel={selectedChannel}
        messages={messages}
        isLoading={messagesLoading}
        error={messagesError}
        currentUserId={currentUserId}
        input={input}
        onInputChange={onInputChange}
        onSend={onSend}
        isSending={isSending}
        sendError={sendError}
      />
    </div>
  );
}
