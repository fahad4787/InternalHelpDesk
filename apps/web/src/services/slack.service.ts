import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface SlackPreferences {
  showChannels: boolean;
  showDirectMessages: boolean;
}

export interface SlackStatus {
  connected: boolean;
  mockMode: boolean;
  status: string;
  slackEmail: string | null;
  teamName: string | null;
  lastSyncedAt: string | null;
  preferences: SlackPreferences;
}

export interface SlackProfile {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  teamId: string | null;
  teamName: string | null;
}

export interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
  isPrivate: boolean;
  kind: 'channel' | 'dm' | 'group_dm';
}

export interface SlackMessage {
  id: string;
  text: string;
  userId: string | null;
  userName: string | null;
  timestamp: string;
}

export const DEFAULT_SLACK_PREFERENCES: SlackPreferences = {
  showChannels: true,
  showDirectMessages: true,
};

export const slackService = {
  getStatus: () => apiGet<SlackStatus>('/integrations/slack/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/slack/auth-url'),

  connectMock: () =>
    apiPost<{
      connected: boolean;
      mockMode: boolean;
      slackEmail: string;
      teamName: string;
    }>('/integrations/slack/connect-mock'),

  disconnect: () => apiPost('/integrations/slack/disconnect'),

  getProfile: () =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      profile: SlackProfile | null;
    }>('/integrations/slack/profile'),

  getChannels: () =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      channels: SlackChannel[];
    }>('/integrations/slack/channels'),

  getChannelMessages: (channelId: string) =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      channelId: string;
      messages: SlackMessage[];
    }>(`/integrations/slack/channels/${channelId}/messages`),

  sendChannelMessage: (channelId: string, text: string) =>
    apiPost<{
      channelId: string;
      message: SlackMessage;
    }>(`/integrations/slack/channels/${channelId}/messages`, { text }),

  updatePreferences: (preferences: SlackPreferences) =>
    apiPatch<SlackPreferences>('/integrations/slack/preferences', preferences),
};
