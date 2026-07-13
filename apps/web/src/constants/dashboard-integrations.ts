export type MarketplaceCategory =
  | 'all'
  | 'productivity'
  | 'communication'
  | 'hr'
  | 'developer'
  | 'calendar';

export interface MarketplaceAppMeta {
  provider: string;
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
    widgetId: 'jira',
    category: 'developer',
    categoryLabel: 'Developer',
    configureRoute: '/integrations/jira',
    isReal: true,
  },
  TRELLO: {
    provider: 'TRELLO',
    widgetId: 'trello',
    category: 'developer',
    categoryLabel: 'Developer',
    configureRoute: '/integrations/trello',
    isReal: true,
  },
  CALENDLY: {
    provider: 'CALENDLY',
    widgetId: 'calendly',
    category: 'calendar',
    categoryLabel: 'Calendar',
    configureRoute: '/integrations/calendly',
    isReal: true,
  },
  SLACK: {
    provider: 'SLACK',
    widgetId: 'slack',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/slack',
    isReal: true,
  },
  WORKDAY: {
    provider: 'WORKDAY',
    widgetId: 'workday',
    category: 'hr',
    categoryLabel: 'HR & People',
    configureRoute: '/integrations/workday',
    isReal: true,
  },
  GOOGLE_CALENDAR: {
    provider: 'GOOGLE_CALENDAR',
    widgetId: 'google',
    category: 'calendar',
    categoryLabel: 'Calendar',
    configureRoute: '/integrations/google',
    isReal: true,
  },
  ZOOM: {
    provider: 'ZOOM',
    widgetId: 'zoom',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/zoom',
    isReal: true,
  },
  OUTLOOK: {
    provider: 'OUTLOOK',
    widgetId: 'outlook',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/outlook',
    isReal: true,
  },
  MICROSOFT_TEAMS: {
    provider: 'MICROSOFT_TEAMS',
    widgetId: 'teams',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: null,
    isReal: true,
  },
  SERVICENOW: {
    provider: 'SERVICENOW',
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
