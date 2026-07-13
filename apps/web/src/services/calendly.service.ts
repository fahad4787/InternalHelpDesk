import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface CalendlyPreferences {
  showEventTypes: boolean;
  showUpcomingEvents: boolean;
}

export interface CalendlyStatus {
  connected: boolean;
  status: string;
  calendlyEmail: string | null;
  calendlyName: string | null;
  schedulingUrl: string | null;
  lastSyncedAt: string | null;
  preferences: CalendlyPreferences;
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  schedulingUrl: string | null;
  active: boolean;
}

export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  status: string;
  startAt: string;
  endAt: string;
  eventTypeUri: string | null;
  location: string | null;
  meetingUrl: string | null;
}

export const DEFAULT_CALENDLY_PREFERENCES: CalendlyPreferences = {
  showEventTypes: true,
  showUpcomingEvents: true,
};

export const calendlyService = {
  getStatus: () => apiGet<CalendlyStatus>('/integrations/calendly/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/calendly/auth-url'),

  disconnect: () => apiPost('/integrations/calendly/disconnect'),

  getEventTypes: () =>
    apiGet<{ connected: boolean; eventTypes: CalendlyEventType[] }>(
      '/integrations/calendly/event-types',
    ),

  getUpcomingEvents: () =>
    apiGet<{ connected: boolean; events: CalendlyScheduledEvent[] }>(
      '/integrations/calendly/events',
    ),

  updatePreferences: (preferences: CalendlyPreferences) =>
    apiPatch<CalendlyPreferences>(
      '/integrations/calendly/preferences',
      preferences,
    ),
};
