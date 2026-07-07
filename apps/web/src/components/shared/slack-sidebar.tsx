'use client';

import { useMemo, useState } from 'react';
import { Hash, Lock, MessageCircle, Search, UsersRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SlackChannel } from '@/services/slack.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { cn } from '@/lib/utils';

interface SlackSidebarProps {
  channels: SlackChannel[];
  isLoading: boolean;
  selectedChannelId: string | null;
  showChannels: boolean;
  showDirectMessages: boolean;
  onSelectChannel: (channel: SlackChannel) => void;
}

function sortByName(items: SlackChannel[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function ConversationButton({
  channel,
  isSelected,
  onSelect,
}: {
  channel: SlackChannel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isDirectMessage = channel.kind === 'dm';
  const isGroupDm = channel.kind === 'group_dm';
  const label =
    isDirectMessage || isGroupDm ? channel.name : `#${channel.name}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all',
        isSelected
          ? 'bg-brand text-white shadow-sm'
          : 'text-muted hover:bg-canvas hover:text-ink',
      )}
    >
      {isDirectMessage ? (
        <MessageCircle className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white' : 'text-brand')} />
      ) : isGroupDm ? (
        <UsersRound className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white' : 'text-brand')} />
      ) : channel.isPrivate ? (
        <Lock className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white/80' : 'text-muted')} />
      ) : (
        <Hash className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white' : 'text-brand')} />
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
    </button>
  );
}

function Section({
  title,
  items,
  selectedChannelId,
  onSelectChannel,
}: {
  title: string;
  items: SlackChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channel: SlackChannel) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="px-2 pb-2">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((channel) => (
          <ConversationButton
            key={channel.id}
            channel={channel}
            isSelected={selectedChannelId === channel.id}
            onSelect={() => onSelectChannel(channel)}
          />
        ))}
      </div>
    </div>
  );
}

export function SlackSidebar({
  channels,
  isLoading,
  selectedChannelId,
  showChannels,
  showDirectMessages,
  onSelectChannel,
}: SlackSidebarProps) {
  const [search, setSearch] = useState('');

  const { workspaceChannels, directMessages } = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? channels.filter((channel) => channel.name.toLowerCase().includes(query))
      : channels;

    return {
      workspaceChannels: showChannels
        ? sortByName(filtered.filter((channel) => channel.kind === 'channel'))
        : [],
      directMessages: showDirectMessages
        ? sortByName(
            filtered.filter(
              (channel) => channel.kind === 'dm' || channel.kind === 'group_dm',
            ),
          )
        : [],
    };
  }, [channels, search, showChannels, showDirectMessages]);

  return (
    <div className="flex h-full w-full flex-col border-r border-border-warm bg-canvas/80 lg:w-72 lg:shrink-0">
      <div className="border-b border-border-warm p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="border-border-warm bg-white pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-5 py-4">
            <WidgetContentSkeleton lines={4} />
          </div>
        ) : !showChannels && !showDirectMessages ? (
          <p className="px-5 py-4 text-sm text-muted">
            Enable channels or direct messages in preferences.
          </p>
        ) : channels.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">No conversations found.</p>
        ) : workspaceChannels.length === 0 && directMessages.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">No matches for your search.</p>
        ) : (
          <>
            {showChannels && (
              <Section
                title="Channels"
                items={workspaceChannels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={onSelectChannel}
              />
            )}
            {showDirectMessages && (
              <Section
                title="Direct Messages"
                items={directMessages}
                selectedChannelId={selectedChannelId}
                onSelectChannel={onSelectChannel}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
