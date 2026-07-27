'use client';

import { useMemo, useState } from 'react';
import { Lock, MessageCircle, Search, UsersRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GoogleChatSpace } from '@/services/google-calendar.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { cn } from '@/lib/utils';

interface GoogleChatSidebarProps {
  spaces: GoogleChatSpace[];
  isLoading: boolean;
  error?: string | null;
  selectedSpaceId: string | null;
  showSpaces: boolean;
  showDirectMessages: boolean;
  onSelectSpace: (space: GoogleChatSpace) => void;
}

function sortByName(items: GoogleChatSpace[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function ConversationButton({
  space,
  isSelected,
  onSelect,
}: {
  space: GoogleChatSpace;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isDirectMessage = space.kind === 'dm';
  const isGroupDm = space.kind === 'group_dm';

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
      ) : space.isPrivate ? (
        <Lock className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white/80' : 'text-muted')} />
      ) : (
        <UsersRound className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white' : 'text-brand')} />
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{space.name}</span>
    </button>
  );
}

function Section({
  title,
  items,
  selectedSpaceId,
  onSelectSpace,
}: {
  title: string;
  items: GoogleChatSpace[];
  selectedSpaceId: string | null;
  onSelectSpace: (space: GoogleChatSpace) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="px-2 pb-2">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((space) => (
          <ConversationButton
            key={space.id}
            space={space}
            isSelected={selectedSpaceId === space.id}
            onSelect={() => onSelectSpace(space)}
          />
        ))}
      </div>
    </div>
  );
}

export function GoogleChatSidebar({
  spaces,
  isLoading,
  error = null,
  selectedSpaceId,
  showSpaces,
  showDirectMessages,
  onSelectSpace,
}: GoogleChatSidebarProps) {
  const [search, setSearch] = useState('');

  const { workspaceSpaces, directMessages } = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? spaces.filter((space) => space.name.toLowerCase().includes(query))
      : spaces;

    return {
      workspaceSpaces: showSpaces
        ? sortByName(filtered.filter((space) => space.kind === 'space'))
        : [],
      directMessages: showDirectMessages
        ? sortByName(
            filtered.filter(
              (space) => space.kind === 'dm' || space.kind === 'group_dm',
            ),
          )
        : [],
    };
  }, [spaces, search, showSpaces, showDirectMessages]);

  return (
    <div className="flex min-h-0 w-full flex-col border-r border-border-warm bg-canvas/80 lg:w-72 lg:shrink-0">
      <div className="shrink-0 border-b border-border-warm p-3">
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

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-5 py-4">
            <WidgetContentSkeleton lines={4} />
          </div>
        ) : error ? (
          <p className="px-5 py-4 text-sm text-red-600">{error}</p>
        ) : !showSpaces && !showDirectMessages ? (
          <p className="px-5 py-4 text-sm text-muted">
            Enable Google Chat in preferences.
          </p>
        ) : spaces.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">
            No conversations found. If you use a personal Gmail account, Google
            Chat API may not return chats — it is built for Google Workspace.
            For Workspace accounts, click Reconnect Google and approve Chat
            access.
          </p>
        ) : workspaceSpaces.length === 0 && directMessages.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">No matches for your search.</p>
        ) : (
          <>
            {showSpaces && (
              <Section
                title="Spaces"
                items={workspaceSpaces}
                selectedSpaceId={selectedSpaceId}
                onSelectSpace={onSelectSpace}
              />
            )}
            {showDirectMessages && (
              <Section
                title="Direct Messages"
                items={directMessages}
                selectedSpaceId={selectedSpaceId}
                onSelectSpace={onSelectSpace}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
