export interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
  isPrivate: boolean;
}

export interface SlackMessage {
  id: string;
  text: string;
  userId: string | null;
  userName: string | null;
  timestamp: string;
}

export interface SlackProfile {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  teamId: string | null;
  teamName: string | null;
}
