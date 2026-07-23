export interface TeamsPreferences {
  showTeams: boolean;
  showChats: boolean;
}

export const DEFAULT_TEAMS_PREFERENCES: TeamsPreferences = {
  showTeams: true,
  showChats: true,
};

export interface TeamsProfile {
  email: string | null;
  displayName: string | null;
}

export interface TeamsTeam {
  id: string;
  displayName: string;
  description: string | null;
  webUrl: string | null;
}

export interface TeamsChat {
  id: string;
  topic: string;
  chatType: string;
  webUrl: string | null;
  lastMessagePreview: string | null;
  lastUpdatedAt: string | null;
}
