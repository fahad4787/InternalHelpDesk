import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface TeamsPreferences {
  showProfile: boolean;
  showChannels: boolean;
}

export interface TeamsStatus {
  connected: boolean;
  mockMode: boolean;
  status: string;
  teamsEmail: string | null;
  tenantName: string | null;
  lastSyncedAt: string | null;
  preferences: TeamsPreferences;
}

export interface TeamsProfile {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  tenantId: string | null;
  tenantName: string | null;
}

export interface TeamsChannel {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  memberCount: number;
  isPrivate: boolean;
}

export interface TeamsMessage {
  id: string;
  text: string;
  userId: string | null;
  userName: string | null;
  timestamp: string;
}

export const DEFAULT_TEAMS_PREFERENCES: TeamsPreferences = {
  showProfile: true,
  showChannels: true,
};

export const teamsService = {
  getStatus: () => apiGet<TeamsStatus>('/integrations/teams/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/teams/auth-url'),

  connectMock: () =>
    apiPost<{
      connected: boolean;
      mockMode: boolean;
      teamsEmail: string;
      tenantName: string;
    }>('/integrations/teams/connect-mock'),

  disconnect: () => apiPost('/integrations/teams/disconnect'),

  getProfile: () =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      profile: TeamsProfile | null;
    }>('/integrations/teams/profile'),

  getChannels: () =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      channels: TeamsChannel[];
    }>('/integrations/teams/channels'),

  getChannelMessages: (teamId: string, channelId: string) =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      teamId: string;
      channelId: string;
      messages: TeamsMessage[];
    }>(`/integrations/teams/teams/${teamId}/channels/${channelId}/messages`),

  updatePreferences: (preferences: TeamsPreferences) =>
    apiPatch<TeamsPreferences>('/integrations/teams/preferences', preferences),
};
