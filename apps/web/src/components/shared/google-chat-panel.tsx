'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Lock, MessageCircle, Send, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  GoogleChatMessage,
  GoogleChatSpace,
} from '@/services/google-calendar.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { cn } from '@/lib/utils';

interface GoogleChatPanelProps {
  space: GoogleChatSpace | null;
  messages: GoogleChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentUserId?: string | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  sendError: string | null;
}

function SpaceIcon({ space }: { space: GoogleChatSpace }) {
  if (space.kind === 'dm') {
    return <MessageCircle className="h-4 w-4 text-white" />;
  }
  if (space.kind === 'group_dm') {
    return <UsersRound className="h-4 w-4 text-white" />;
  }
  if (space.isPrivate) {
    return <Lock className="h-4 w-4 text-white" />;
  }
  return <UsersRound className="h-4 w-4 text-white" />;
}

function getSpaceSubtitle(space: GoogleChatSpace) {
  if (space.kind === 'dm') return 'Direct message';
  if (space.kind === 'group_dm') return 'Group chat';
  return space.isPrivate ? 'Private space' : 'Space';
}

export function GoogleChatPanel({
  space,
  messages,
  isLoading,
  error,
  currentUserId,
  input,
  onInputChange,
  onSend,
  isSending,
  sendError,
}: GoogleChatPanelProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isSending, space?.id]);

  if (!space) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-white p-8 text-center">
        <div className="rounded-full border border-brand-muted bg-brand-light p-5">
          <MessageCircle className="h-10 w-10 text-brand" />
        </div>
        <p className="text-sm font-medium text-ink">Select a conversation</p>
        <p className="max-w-sm text-sm text-muted">
          Choose a space or direct message from the sidebar to view and send messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-3 border-b border-border-warm px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-accent">
          <SpaceIcon space={space} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{space.name}</p>
          <p className="text-xs text-muted">{getSpaceSubtitle(space)}</p>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5"
      >
        {isLoading ? (
          <WidgetContentSkeleton lines={5} />
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted">No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn =
              currentUserId != null &&
              message.userId != null &&
              (message.userId === currentUserId ||
                message.userId.endsWith(`/${currentUserId.replace('users/', '')}`));

            return (
              <div
                key={message.id}
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                  isOwn
                    ? 'ml-auto rounded-br-sm bg-brand text-white shadow-md shadow-brand/20'
                    : 'rounded-bl-sm border border-border-warm bg-canvas text-ink',
                )}
              >
                {!isOwn && (
                  <p className="mb-1 text-xs font-medium text-brand-accent">
                    {message.userName ?? 'Unknown user'}
                  </p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                <p
                  className={cn(
                    'mt-1.5 text-[11px]',
                    isOwn ? 'text-white/70' : 'text-muted',
                  )}
                >
                  {format(new Date(message.timestamp), 'MMM d · h:mm a')}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="shrink-0 border-t border-border-warm p-4">
        {sendError && (
          <p className="mb-2 text-sm text-red-600">{sendError}</p>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Message ${space.name}`}
            className="min-h-[48px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            size="icon"
            disabled={!input.trim() || isSending}
            onClick={onSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
