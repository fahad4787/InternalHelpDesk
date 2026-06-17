import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_GOOGLE_PREFERENCES,
  googleCalendarService,
} from '@/services/google-calendar.service';

export function useGoogleWidgets() {
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => googleCalendarService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_GOOGLE_PREFERENCES;

  const showMeet = isConnected && preferences.showUpcomingMeet;
  const showDrive = isConnected && preferences.showGoogleDrive;
  const showGmail = isConnected && preferences.showGmail;
  const showCalendarEmbed =
    isConnected && preferences.showCalendarEmbed && !!status?.googleEmail;

  const eventsQuery = useQuery({
    queryKey: ['google-calendar-events'],
    queryFn: () => googleCalendarService.getEvents(),
    enabled: showMeet,
  });

  const driveQuery = useQuery({
    queryKey: ['google-drive-files'],
    queryFn: () => googleCalendarService.getDriveFiles(),
    enabled: showDrive,
  });

  const gmailQuery = useQuery({
    queryKey: ['google-gmail-messages'],
    queryFn: () => googleCalendarService.getGmailMessages(),
    enabled: showGmail,
  });

  return {
    status,
    statusLoading,
    isConnected,
    preferences,
    showMeet,
    showDrive,
    showGmail,
    showCalendarEmbed,
    events: eventsQuery.data?.data?.events ?? [],
    eventsLoading: eventsQuery.isLoading,
    files: driveQuery.data?.data?.files ?? [],
    driveLoading: driveQuery.isLoading,
    messages: gmailQuery.data?.data?.messages ?? [],
    gmailLoading: gmailQuery.isLoading,
  };
}
