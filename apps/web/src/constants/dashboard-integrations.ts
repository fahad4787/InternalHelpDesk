export type MarketplaceCategory =
  | 'all'
  | 'task'
  | 'calendar'
  | 'crm'
  | 'communication'
  | 'storage'
  | 'hr';

export interface MarketplaceAppMeta {
  /** Unique card id in the marketplace grid */
  id: string;
  /** Provider key used for connection status / disconnect */
  provider: string;
  /** Icon key for IntegrationIcon (may differ from provider for Google sub-apps) */
  iconKey: string;
  name: string;
  description: string;
  category: Exclude<MarketplaceCategory, 'all'>;
  categoryLabel: string;
  configureRoute: string | null;
  /** True when connect/manage is available in the product today */
  available: boolean;
  /** Show dashboard widget list on this card (primary product only) */
  showWidgets?: boolean;
}

export const MARKETPLACE_CATEGORY_FILTERS: {
  id: MarketplaceCategory;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'task', label: 'Task Management' },
  { id: 'calendar', label: 'Calendar & Meetings' },
  { id: 'crm', label: 'CRM' },
  { id: 'communication', label: 'Communication' },
  { id: 'storage', label: 'Cloud Storage' },
  { id: 'hr', label: 'HR & Employee' },
];

/**
 * Full marketplace catalog ordered for Browse.
 * One card per product; Google covers Calendar, Meet, Drive, Gmail, and Chat.
 */
export const MARKETPLACE_APPS: MarketplaceAppMeta[] = [
  // Task Management
  {
    id: 'jira',
    provider: 'JIRA',
    iconKey: 'JIRA',
    name: 'Jira',
    description: 'Issues & projects',
    category: 'task',
    categoryLabel: 'Task Management',
    configureRoute: '/integrations/jira',
    available: true,
    showWidgets: true,
  },
  {
    id: 'trello',
    provider: 'TRELLO',
    iconKey: 'TRELLO',
    name: 'Trello',
    description: 'Boards & cards',
    category: 'task',
    categoryLabel: 'Task Management',
    configureRoute: '/integrations/trello',
    available: true,
    showWidgets: true,
  },
  {
    id: 'monday',
    provider: 'MONDAY',
    iconKey: 'MONDAY',
    name: 'Monday.com',
    description: 'Boards & items',
    category: 'task',
    categoryLabel: 'Task Management',
    configureRoute: '/integrations/monday',
    available: true,
    showWidgets: true,
  },
  {
    id: 'asana',
    provider: 'ASANA',
    iconKey: 'ASANA',
    name: 'Asana',
    description: 'Projects & tasks',
    category: 'task',
    categoryLabel: 'Task Management',
    configureRoute: '/integrations/asana',
    available: true,
    showWidgets: true,
  },
  {
    id: 'clickup',
    provider: 'CLICKUP',
    iconKey: 'CLICKUP',
    name: 'ClickUp',
    description: 'Tasks & lists',
    category: 'task',
    categoryLabel: 'Task Management',
    configureRoute: '/integrations/clickup',
    available: true,
    showWidgets: true,
  },

  // Calendar & Meetings
  {
    id: 'google',
    provider: 'GOOGLE_CALENDAR',
    iconKey: 'GOOGLE_CALENDAR',
    name: 'Google',
    description: 'Calendar, Meet, Drive, Gmail & Chat',
    category: 'calendar',
    categoryLabel: 'Calendar & Meetings',
    configureRoute: '/integrations/google',
    available: true,
    showWidgets: true,
  },
  {
    id: 'zoom',
    provider: 'ZOOM',
    iconKey: 'ZOOM',
    name: 'Zoom',
    description: 'Meetings & calendar',
    category: 'calendar',
    categoryLabel: 'Calendar & Meetings',
    configureRoute: '/integrations/zoom',
    available: true,
    showWidgets: true,
  },
  {
    id: 'calendly',
    provider: 'CALENDLY',
    iconKey: 'CALENDLY',
    name: 'Calendly',
    description: 'Scheduling & events',
    category: 'calendar',
    categoryLabel: 'Calendar & Meetings',
    configureRoute: '/integrations/calendly',
    available: true,
    showWidgets: true,
  },

  // CRM
  {
    id: 'salesforce',
    provider: 'SALESFORCE',
    iconKey: 'SALESFORCE',
    name: 'Salesforce',
    description: 'Accounts & opportunities',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: '/integrations/salesforce',
    available: true,
    showWidgets: true,
  },
  {
    id: 'hubspot',
    provider: 'HUBSPOT',
    iconKey: 'HUBSPOT',
    name: 'HubSpot CRM',
    description: 'Contacts & deals',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: '/integrations/hubspot',
    available: true,
    showWidgets: true,
  },
  {
    id: 'zoho-crm',
    provider: 'ZOHO_CRM',
    iconKey: 'ZOHO',
    name: 'Zoho CRM',
    description: 'Contacts, deals & leads',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: '/integrations/zoho-crm',
    available: true,
    showWidgets: true,
  },
  {
    id: 'dynamics-365',
    provider: 'DYNAMICS_365',
    iconKey: 'DYNAMICS_365',
    name: 'Microsoft Dynamics 365',
    description: 'Contacts & accounts',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: '/integrations/dynamics',
    available: true,
    showWidgets: true,
  },

  // Communication & Collaboration
  {
    id: 'slack',
    provider: 'SLACK',
    iconKey: 'SLACK',
    name: 'Slack',
    description: 'Channels & messages',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/slack',
    available: true,
    showWidgets: true,
  },
  {
    id: 'teams',
    provider: 'MICROSOFT_TEAMS',
    iconKey: 'MICROSOFT_TEAMS',
    name: 'Microsoft Teams',
    description: 'Teams & chats',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/teams',
    available: true,
    showWidgets: true,
  },
  {
    id: 'outlook',
    provider: 'OUTLOOK',
    iconKey: 'OUTLOOK',
    name: 'Microsoft Outlook',
    description: 'Inbox & email',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/outlook',
    available: true,
    showWidgets: true,
  },

  // Cloud Storage & Documents
  {
    id: 'onedrive',
    provider: 'ONEDRIVE',
    iconKey: 'ONEDRIVE',
    name: 'OneDrive',
    description: 'Files & folders',
    category: 'storage',
    categoryLabel: 'Cloud Storage',
    configureRoute: '/integrations/onedrive',
    available: true,
    showWidgets: true,
  },
  {
    id: 'dropbox',
    provider: 'DROPBOX',
    iconKey: 'DROPBOX',
    name: 'Dropbox',
    description: 'Files & folders',
    category: 'storage',
    categoryLabel: 'Cloud Storage',
    configureRoute: '/integrations/dropbox',
    available: true,
    showWidgets: true,
  },
  {
    id: 'sharepoint',
    provider: 'SHAREPOINT',
    iconKey: 'SHAREPOINT',
    name: 'SharePoint',
    description: 'Sites & documents',
    category: 'storage',
    categoryLabel: 'Cloud Storage',
    configureRoute: '/integrations/sharepoint',
    available: true,
    showWidgets: true,
  },
  {
    id: 'box',
    provider: 'BOX',
    iconKey: 'BOX',
    name: 'Box',
    description: 'Files & folders',
    category: 'storage',
    categoryLabel: 'Cloud Storage',
    configureRoute: '/integrations/box',
    available: true,
    showWidgets: true,
  },

  // HR & Employee Management
  {
    id: 'workday',
    provider: 'WORKDAY',
    iconKey: 'WORKDAY',
    name: 'Workday',
    description: 'Help articles & SOPs',
    category: 'hr',
    categoryLabel: 'HR & Employee',
    configureRoute: '/integrations/workday',
    available: true,
    showWidgets: true,
  },
  {
    id: 'zoho-people',
    provider: 'ZOHO_PEOPLE',
    iconKey: 'ZOHO',
    name: 'Zoho People',
    description: 'Employees & leave',
    category: 'hr',
    categoryLabel: 'HR & Employee',
    configureRoute: '/integrations/zoho-people',
    available: true,
    showWidgets: true,
  },
];

/** Primary marketplace card per connected provider (for My connected apps) */
export const PRIMARY_MARKETPLACE_BY_PROVIDER: Record<string, MarketplaceAppMeta> =
  Object.fromEntries(
    MARKETPLACE_APPS.filter((app) => app.showWidgets).map((app) => [
      app.provider,
      app,
    ]),
  );

/** @deprecated Prefer MARKETPLACE_APPS */
export const REAL_INTEGRATION_META: Record<string, MarketplaceAppMeta> =
  PRIMARY_MARKETPLACE_BY_PROVIDER;

export const PROVIDER_CATEGORY_MAP: Record<string, MarketplaceCategory> = {
  'project-management': 'task',
  google: 'calendar',
  calendar: 'calendar',
  communication: 'communication',
  productivity: 'storage',
  crm: 'crm',
  hr: 'hr',
  itsm: 'task',
};

export function mapApiCategory(category: string): MarketplaceCategory {
  return PROVIDER_CATEGORY_MAP[category] ?? 'task';
}

export function getMarketplaceAppCount(): number {
  return MARKETPLACE_APPS.length;
}
