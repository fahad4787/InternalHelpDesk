import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface TeamsPreferences {
  showTeams: boolean;
  showChats: boolean;
}

export interface TeamsStatus {
  connected: boolean;
  status: string;
  teamsEmail: string | null;
  lastSyncedAt: string | null;
  preferences: TeamsPreferences;
}

export interface TeamsTeam {
  id: string;
  displayName: string;
  description: string | null;
  webUrl: string | null;
}

export interface TeamsTeamsResponse {
  connected: boolean;
  teams: TeamsTeam[];
}

export interface TeamsChat {
  id: string;
  topic: string;
  chatType: string;
  webUrl: string | null;
  lastMessagePreview: string | null;
  lastUpdatedAt: string | null;
}

export interface TeamsChatsResponse {
  connected: boolean;
  chats: TeamsChat[];
}

export const DEFAULT_TEAMS_PREFERENCES: TeamsPreferences = {
  showTeams: true,
  showChats: true,
};

export const teamsService = {
  getStatus: () => apiGet<TeamsStatus>('/integrations/teams/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/teams/auth-url'),

  disconnect: () => apiPost('/integrations/teams/disconnect'),

  getTeams: () => apiGet<TeamsTeamsResponse>('/integrations/teams/joined-teams'),

  getChats: () => apiGet<TeamsChatsResponse>('/integrations/teams/chats'),

  updatePreferences: (preferences: TeamsPreferences) =>
    apiPatch<TeamsPreferences>('/integrations/teams/preferences', preferences),
};
