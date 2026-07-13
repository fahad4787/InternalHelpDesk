export type MarketplaceCategory =
  | 'all'
  | 'productivity'
  | 'communication'
  | 'hr'
  | 'developer'
  | 'calendar';

export interface MarketplaceAppMeta {
  provider: string;
  name: string;
  description: string;
  widgetId: string;
  category: Exclude<MarketplaceCategory, 'all'>;
  categoryLabel: string;
  configureRoute: string | null;
  isReal: boolean;
}

export const MARKETPLACE_CATEGORY_FILTERS: { id: MarketplaceCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'communication', label: 'Communication' },
  { id: 'hr', label: 'HR & People' },
  { id: 'developer', label: 'Developer' },
  { id: 'calendar', label: 'Calendar' },
];

export const REAL_INTEGRATION_META: Record<string, MarketplaceAppMeta> = {
  JIRA: {
    provider: 'JIRA',
    name: 'Jira',
    description: 'Sync tickets with Jira issues',
    widgetId: 'jira',
    category: 'developer',
    categoryLabel: 'Developer',
    configureRoute: '/integrations/jira',
    isReal: true,
  },
  TRELLO: {
    provider: 'TRELLO',
    name: 'Trello',
    description: 'Boards and cards from your linked Trello account',
    widgetId: 'trello',
    category: 'developer',
    categoryLabel: 'Developer',
    configureRoute: '/integrations/trello',
    isReal: true,
  },
  CALENDLY: {
    provider: 'CALENDLY',
    name: 'Calendly',
    description: 'Event types and upcoming meetings from your Calendly account',
    widgetId: 'calendly',
    category: 'calendar',
    categoryLabel: 'Calendar',
    configureRoute: '/integrations/calendly',
    isReal: true,
  },
  SLACK: {
    provider: 'SLACK',
    name: 'Slack',
    description: 'Connect Slack for notifications and chatbot access',
    widgetId: 'slack',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/slack',
    isReal: true,
  },
  WORKDAY: {
    provider: 'WORKDAY',
    name: 'Workday',
    description: 'Sync help articles and SOPs from Workday',
    widgetId: 'workday',
    category: 'hr',
    categoryLabel: 'HR & People',
    configureRoute: '/integrations/workday',
    isReal: true,
  },
  GOOGLE_CALENDAR: {
    provider: 'GOOGLE_CALENDAR',
    name: 'Google',
    description: 'Calendar, Google Meet, and Drive from your linked Google account',
    widgetId: 'google',
    category: 'calendar',
    categoryLabel: 'Calendar',
    configureRoute: '/integrations/google',
    isReal: true,
  },
  ZOOM: {
    provider: 'ZOOM',
    name: 'Zoom',
    description: 'Profile, calendar, and meetings from your linked Zoom account',
    widgetId: 'zoom',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/zoom',
    isReal: true,
  },
  OUTLOOK: {
    provider: 'OUTLOOK',
    name: 'Outlook',
    description: 'Inbox and email from your linked Microsoft account',
    widgetId: 'outlook',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/outlook',
    isReal: true,
  },
  MICROSOFT_TEAMS: {
    provider: 'MICROSOFT_TEAMS',
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams channels',
    widgetId: 'teams',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: null,
    isReal: true,
  },
  SERVICENOW: {
    provider: 'SERVICENOW',
    name: 'ServiceNow',
    description: 'Connect with ServiceNow incidents',
    widgetId: 'servicenow',
    category: 'developer',
    categoryLabel: 'Developer',
    configureRoute: null,
    isReal: true,
  },
};

export const PROVIDER_CATEGORY_MAP: Record<string, MarketplaceCategory> = {
  google: 'calendar',
  hr: 'hr',
  'project-management': 'developer',
  communication: 'communication',
  itsm: 'developer',
};

export function mapApiCategory(category: string): MarketplaceCategory {
  return PROVIDER_CATEGORY_MAP[category] ?? 'productivity';
}
