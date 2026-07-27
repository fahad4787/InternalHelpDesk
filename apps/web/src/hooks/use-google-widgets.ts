import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_GOOGLE_PREFERENCES,
  googleCalendarService,
  type GoogleCalendarStatus,
} from '@/services/google-calendar.service';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';

type GoogleFeature = 'meet' | 'drive' | 'gmail' | 'calendar';

function toGoogleStatus(
  google: {
    connected?: boolean;
    googleEmail?: string | null;
    lastSyncedAt?: string | null;
    preferences?: GoogleCalendarStatus['preferences'] | null;
    status?: string;
  } | null | undefined,
): GoogleCalendarStatus | undefined {
  if (!google) return undefined;
  return {
    connected: google.connected === true,
    status: google.status ?? (google.connected ? 'CONNECTED' : 'NOT_CONNECTED'),
    googleEmail: google.googleEmail ?? null,
    lastSyncedAt: google.lastSyncedAt ?? null,
    preferences: google.preferences ?? DEFAULT_GOOGLE_PREFERENCES,
  };
}

/**
 * Shared Google connection + preferences.
 * Prefers dashboard-status cache so widgets don't wait on a second status round-trip.
 */
export function useGoogleWidgets(options?: { features?: GoogleFeature[] }) {
  const features = options?.features;
  const wants = (feature: GoogleFeature) =>
    !features || features.includes(feature);

  const { statuses, isBootstrapping } = useDashboardVisibleWidgets();
  const fromDashboard = toGoogleStatus(statuses.google);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => googleCalendarService.getStatus(),
    // Only hit the dedicated status API when dashboard-status has no Google entry yet.
    enabled: !fromDashboard && !isBootstrapping,
  });

  const status = fromDashboard ?? statusData?.data;
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
    enabled: wants('meet') && showMeet,
    staleTime: 60_000,
  });

  const driveQuery = useQuery({
    queryKey: ['google-drive-files'],
    queryFn: () => googleCalendarService.getDriveFiles(),
    enabled: wants('drive') && showDrive,
    staleTime: 60_000,
  });

  const gmailQuery = useQuery({
    queryKey: ['google-gmail-messages'],
    queryFn: () => googleCalendarService.getGmailMessages(),
    enabled: wants('gmail') && showGmail,
    staleTime: 60_000,
  });

  return {
    status,
    statusLoading: !fromDashboard && statusLoading,
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
