import type { QueryClient } from '@tanstack/react-query';

const PROVIDER_QUERY_PREFIXES: Record<string, string[]> = {
  JIRA: ['jira-status', 'jira-issues', 'jira-projects'],
  TRELLO: ['trello-status', 'trello-boards', 'trello-board'],
  ASANA: ['asana-status', 'asana-projects', 'asana-project'],
  MONDAY: ['monday-status', 'monday-boards', 'monday-board'],
  CLICKUP: ['clickup-status', 'clickup-lists', 'clickup-list'],
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
  OUTLOOK: ['outlook-status', 'outlook-messages', 'outlook-events'],
  MICROSOFT_TEAMS: ['teams-status', 'teams-joined', 'teams-chats'],
  DROPBOX: ['dropbox-status', 'dropbox-files'],
  BOX: ['box-status', 'box-files'],
  HUBSPOT: ['hubspot-status', 'hubspot-contacts', 'hubspot-deals', 'hubspot-tickets'],
  DYNAMICS_365: [
    'dynamics-status',
    'dynamics-contacts',
    'dynamics-accounts',
    'dynamics-opportunities',
  ],
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
