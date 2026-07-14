'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_GOOGLE_PREFERENCES,
  type GoogleChatSpace,
  googleCalendarService,
} from '@/services/google-calendar.service';

function pickDefaultSpace(
  spaces: GoogleChatSpace[],
  showSpaces: boolean,
  showDirectMessages: boolean,
): GoogleChatSpace | null {
  if (spaces.length === 0) return null;
  if (showSpaces) {
    const space = spaces.find((item) => item.kind === 'space');
    if (space) return space;
  }
  if (showDirectMessages) {
    const dm = spaces.find(
      (item) => item.kind === 'dm' || item.kind === 'group_dm',
    );
    if (dm) return dm;
  }
  return spaces[0];
}

export function useGoogleChatMessenger() {
  const queryClient = useQueryClient();
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(
    null,
  );
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState('');

  const { data: statusData } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => googleCalendarService.getStatus(),
  });

  const preferences = statusData?.data?.preferences ?? DEFAULT_GOOGLE_PREFERENCES;
  const showGoogleChat = preferences.showGoogleChat === true;
  const showSpaces = showGoogleChat;
  const showDirectMessages = showGoogleChat;

  const {
    data: spacesData,
    isLoading: spacesLoading,
    error: spacesError,
  } = useQuery({
    queryKey: ['google-chat-spaces'],
    queryFn: () => googleCalendarService.getChatSpaces(),
    enabled: showGoogleChat,
  });

  const allSpaces = spacesData?.data?.spaces ?? [];
  const currentUserId = spacesData?.data?.currentUserId ?? null;
  const visibleSpaces = useMemo(
    () =>
      allSpaces.filter((space) => {
        if (space.kind === 'space') return showSpaces;
        return showDirectMessages;
      }),
    [allSpaces, showSpaces, showDirectMessages],
  );

  const activeSpace =
    selectedSpace ??
    pickDefaultSpace(visibleSpaces, showSpaces, showDirectMessages);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['google-chat-messages', activeSpace?.id],
    queryFn: () => googleCalendarService.getChatMessages(activeSpace!.id),
    enabled: !!activeSpace && showGoogleChat,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      googleCalendarService.sendChatMessage(activeSpace!.id, text),
    onMutate: () => {
      setSendError('');
      setMessageInput('');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['google-chat-messages', activeSpace?.id],
      });
    },
    onError: (err, text) => {
      setMessageInput(text);
      setSendError(getErrorMessage(err));
    },
  });

  return {
    spaces: visibleSpaces,
    spacesLoading,
    spacesError: spacesError ? getErrorMessage(spacesError) : null,
    selectedSpace: activeSpace,
    onSelectSpace: setSelectedSpace,
    showSpaces,
    showDirectMessages,
    messages: messagesData?.data?.messages ?? [],
    messagesLoading,
    messagesError: messagesError ? getErrorMessage(messagesError) : null,
    currentUserId:
      messagesData?.data?.currentUserId ?? currentUserId,
    input: messageInput,
    onInputChange: setMessageInput,
    onSend: () => {
      const text = messageInput.trim();
      if (!text || !activeSpace) return;
      sendMutation.mutate(text);
    },
    isSending: sendMutation.isPending,
    sendError,
  };
}
