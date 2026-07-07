'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_OUTLOOK_PREFERENCES,
  outlookService,
} from '@/services/outlook.service';

export function useOutlookWidgets() {
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['outlook-status'],
    queryFn: () => outlookService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_OUTLOOK_PREFERENCES;
  const showProfile = isConnected && preferences.showProfile === true;
  const showInbox = isConnected && preferences.showInbox === true;

  const messagesQuery = useQuery({
    queryKey: ['outlook-messages'],
    queryFn: () => outlookService.getMessages(),
    enabled: showInbox,
  });

  return {
    status,
    statusLoading,
    isConnected,
    preferences,
    showProfile,
    showInbox,
    messages: messagesQuery.data?.data?.messages ?? [],
    inboxLoading: messagesQuery.isLoading,
  };
}
