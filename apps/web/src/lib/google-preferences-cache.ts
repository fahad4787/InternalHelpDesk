import { QueryClient } from '@tanstack/react-query';
import { GooglePreferences } from '@/services/google-calendar.service';

type StatusCache = {
  data: {
    preferences?: GooglePreferences;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function patchGooglePreferencesCache(
  queryClient: QueryClient,
  preferences: GooglePreferences,
) {
  queryClient.setQueryData(['google-calendar-status'], (current: unknown) => {
    if (!current || typeof current !== 'object' || !('data' in current)) {
      return current;
    }

    const cached = current as StatusCache;
    return {
      ...cached,
      data: {
        ...cached.data,
        preferences,
      },
    };
  });
}

export function syncGoogleWidgetQueries(
  queryClient: QueryClient,
  preferences: GooglePreferences,
) {
  if (!preferences.showUpcomingMeet) {
    queryClient.removeQueries({ queryKey: ['google-calendar-events'] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
  }

  if (!preferences.showGoogleDrive) {
    queryClient.removeQueries({ queryKey: ['google-drive-files'] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
  }

  if (!preferences.showGmail) {
    queryClient.removeQueries({ queryKey: ['google-gmail-messages'] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['google-gmail-messages'] });
  }
}
