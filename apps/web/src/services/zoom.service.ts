import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { ZoomMeeting } from '@/types/api.types';

export interface ZoomPreferences {
  showUpcomingMeetings: boolean;
  showProfile: boolean;
  showCalendarView: boolean;
}

export interface ZoomStatus {
  connected: boolean;
  status: string;
  zoomEmail: string | null;
  lastSyncedAt: string | null;
  preferences: ZoomPreferences;
}

export interface ZoomMeetingsResponse {
  connected: boolean;
  zoomEmail?: string | null;
  meetings: ZoomMeeting[];
}

export const DEFAULT_ZOOM_PREFERENCES: ZoomPreferences = {
  showUpcomingMeetings: true,
  showProfile: true,
  showCalendarView: true,
};

export interface ZoomProfile {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  pmi: string | null;
  timezone: string | null;
  accountType: string | null;
}

export interface ZoomProfileResponse {
  connected: boolean;
  profile: ZoomProfile | null;
}

export interface CreateZoomMeetingPayload {
  topic: string;
  startTime: string;
  duration: number;
  password?: string;
}

export interface CreateZoomMeetingResponse {
  meeting: ZoomMeeting;
}

export const zoomService = {
  getStatus: () => apiGet<ZoomStatus>('/integrations/zoom/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/zoom/auth-url'),

  disconnect: () => apiPost('/integrations/zoom/disconnect'),

  getMeetings: (includePast = false) =>
    apiGet<ZoomMeetingsResponse>(
      `/integrations/zoom/meetings${includePast ? '?includePast=true' : ''}`,
    ),

  getProfile: () =>
    apiGet<ZoomProfileResponse>('/integrations/zoom/profile'),

  createMeeting: (payload: CreateZoomMeetingPayload) =>
    apiPost<CreateZoomMeetingResponse>(
      '/integrations/zoom/meetings',
      payload,
    ),

  updatePreferences: (preferences: ZoomPreferences) =>
    apiPatch<ZoomPreferences>('/integrations/zoom/preferences', preferences),
};
