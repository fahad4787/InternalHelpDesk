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
