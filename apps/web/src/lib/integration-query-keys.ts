import type { QueryClient } from '@tanstack/react-query';

const PROVIDER_QUERY_PREFIXES: Record<string, string[]> = {
  JIRA: ['jira-status', 'jira-issues', 'jira-profile', 'jira-projects'],
  TRELLO: ['trello-status', 'trello-boards', 'trello-board'],
  ASANA: ['asana-status', 'asana-projects', 'asana-project', 'asana-my-tasks'],
  CALENDLY: ['calendly-status', 'calendly-event-types', 'calendly-events'],
  SLACK: ['slack-status', 'slack-channels', 'slack-messages', 'slack-profile'],
  GOOGLE_CALENDAR: [
    'google-calendar-status',
    'google-calendar-events',
    'google-drive-files',
    'google-gmail-messages',
    'google-chat-spaces',
    'google-chat-messages',
  ],
  ZOOM: ['zoom-status', 'zoom-meetings', 'zoom-profile'],
  OUTLOOK: ['outlook-status', 'outlook-messages', 'outlook-profile'],
  DROPBOX: ['dropbox-status', 'dropbox-files'],
  WORKDAY: ['workday-status', 'workday-sync-logs', 'workday-articles'],
};

export function invalidateIntegrationQueries(
  queryClient: QueryClient,
  provider: string,
) {
  queryClient.invalidateQueries({ queryKey: ['integrations'] });

  const prefixes = PROVIDER_QUERY_PREFIXES[provider] ?? [];
  for (const prefix of prefixes) {
    queryClient.invalidateQueries({ queryKey: [prefix] });
  }
}
