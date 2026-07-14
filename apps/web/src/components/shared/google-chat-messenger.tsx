'use client';

import { GoogleChatSidebar } from '@/components/shared/google-chat-sidebar';
import { GoogleChatPanel } from '@/components/shared/google-chat-panel';
import {
  GoogleChatMessage,
  GoogleChatSpace,
} from '@/services/google-calendar.service';
import { cn } from '@/lib/utils';

export interface GoogleChatMessengerProps {
  spaces: GoogleChatSpace[];
  spacesLoading: boolean;
  spacesError?: string | null;
  selectedSpace: GoogleChatSpace | null;
  onSelectSpace: (space: GoogleChatSpace) => void;
  showSpaces: boolean;
  showDirectMessages: boolean;
  messages: GoogleChatMessage[];
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

export function GoogleChatMessenger({
  spaces,
  spacesLoading,
  spacesError = null,
  selectedSpace,
  onSelectSpace,
  showSpaces,
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
}: GoogleChatMessengerProps) {
  return (
    <div className={cn('flex h-full min-h-0 overflow-hidden bg-white', className)}>
      <GoogleChatSidebar
        spaces={spaces}
        isLoading={spacesLoading}
        error={spacesError}
        selectedSpaceId={selectedSpace?.id ?? null}
        showSpaces={showSpaces}
        showDirectMessages={showDirectMessages}
        onSelectSpace={onSelectSpace}
      />
      <GoogleChatPanel
        space={selectedSpace}
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
