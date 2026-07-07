export interface SlackPreferences {
  showChannels: boolean;
  showDirectMessages: boolean;
}

export const DEFAULT_SLACK_PREFERENCES: SlackPreferences = {
  showChannels: true,
  showDirectMessages: true,
};
