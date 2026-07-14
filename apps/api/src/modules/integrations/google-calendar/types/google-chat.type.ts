export interface GoogleChatSpace {
  id: string;
  name: string;
  memberCount: number;
  isPrivate: boolean;
  kind: 'space' | 'dm' | 'group_dm';
}

export interface GoogleChatMessage {
  id: string;
  text: string;
  userId: string | null;
  userName: string | null;
  timestamp: string;
}
