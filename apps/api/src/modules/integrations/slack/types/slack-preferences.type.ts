export interface SlackPreferences {
  showProfile: boolean;
  showChannels: boolean;
}

export const DEFAULT_SLACK_PREFERENCES: SlackPreferences = {
  showProfile: true,
  showChannels: true,
};
