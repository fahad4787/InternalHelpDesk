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
    description: 'Issues, projects, and ticket sync from Jira',
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
    description: 'Boards and cards from your linked Trello account',
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
    description: 'Boards, items, and status from Monday.com',
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
    description: 'Projects and tasks from your linked Asana account',
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
    description: 'Tasks, lists, and workspaces from ClickUp',
    category: 'task',
    categoryLabel: 'Task Management',
    configureRoute: null,
    available: false,
  },

  // Calendar & Meetings
  {
    id: 'google',
    provider: 'GOOGLE_CALENDAR',
    iconKey: 'GOOGLE_CALENDAR',
    name: 'Google',
    description:
      'Calendar, Meet, Drive, Gmail, and Chat from one Google account',
    category: 'calendar',
    categoryLabel: 'Calendar & Meetings',
    configureRoute: '/integrations/google',
    available: true,
    showWidgets: true,
  },
  {
    id: 'outlook-calendar',
    provider: 'OUTLOOK_CALENDAR',
    iconKey: 'OUTLOOK',
    name: 'Microsoft Outlook Calendar',
    description: 'Calendar events from your Microsoft account',
    category: 'calendar',
    categoryLabel: 'Calendar & Meetings',
    configureRoute: null,
    available: false,
  },
  {
    id: 'zoom',
    provider: 'ZOOM',
    iconKey: 'ZOOM',
    name: 'Zoom',
    description: 'Profile, calendar, and meetings from Zoom',
    category: 'calendar',
    categoryLabel: 'Calendar & Meetings',
    configureRoute: '/integrations/zoom',
    available: true,
    showWidgets: true,
  },
  {
    id: 'teams-meetings',
    provider: 'MICROSOFT_TEAMS',
    iconKey: 'MICROSOFT_TEAMS',
    name: 'Microsoft Teams',
    description: 'Meetings and channels from Microsoft Teams',
    category: 'calendar',
    categoryLabel: 'Calendar & Meetings',
    configureRoute: null,
    available: false,
  },
  {
    id: 'calendly',
    provider: 'CALENDLY',
    iconKey: 'CALENDLY',
    name: 'Calendly',
    description: 'Event types and upcoming meetings from Calendly',
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
    description: 'Accounts, contacts, and opportunities from Salesforce',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: null,
    available: false,
  },
  {
    id: 'hubspot',
    provider: 'HUBSPOT',
    iconKey: 'HUBSPOT',
    name: 'HubSpot CRM',
    description: 'Contacts, deals, and pipeline from HubSpot',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: null,
    available: false,
  },
  {
    id: 'zoho-crm',
    provider: 'ZOHO_CRM',
    iconKey: 'ZOHO',
    name: 'Zoho CRM',
    description: 'Leads, contacts, and deals from Zoho CRM',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: null,
    available: false,
  },
  {
    id: 'dynamics-365',
    provider: 'DYNAMICS_365',
    iconKey: 'DYNAMICS_365',
    name: 'Microsoft Dynamics 365',
    description: 'CRM records from Microsoft Dynamics 365',
    category: 'crm',
    categoryLabel: 'CRM',
    configureRoute: null,
    available: false,
  },

  // Communication & Collaboration
  {
    id: 'slack',
    provider: 'SLACK',
    iconKey: 'SLACK',
    name: 'Slack',
    description: 'Channels, DMs, and messages from Slack',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: '/integrations/slack',
    available: true,
    showWidgets: true,
  },
  {
    id: 'teams-chat',
    provider: 'MICROSOFT_TEAMS',
    iconKey: 'MICROSOFT_TEAMS',
    name: 'Microsoft Teams',
    description: 'Team channels and chat from Microsoft Teams',
    category: 'communication',
    categoryLabel: 'Communication',
    configureRoute: null,
    available: false,
  },
  {
    id: 'outlook',
    provider: 'OUTLOOK',
    iconKey: 'OUTLOOK',
    name: 'Microsoft Outlook',
    description: 'Inbox and email from your Microsoft account',
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
    description: 'Files from Microsoft OneDrive',
    category: 'storage',
    categoryLabel: 'Cloud Storage',
    configureRoute: null,
    available: false,
  },
  {
    id: 'dropbox',
    provider: 'DROPBOX',
    iconKey: 'DROPBOX',
    name: 'Dropbox',
    description: 'Files and folders from your Dropbox account',
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
    description: 'Documents and sites from Microsoft SharePoint',
    category: 'storage',
    categoryLabel: 'Cloud Storage',
    configureRoute: null,
    available: false,
  },
  {
    id: 'box',
    provider: 'BOX',
    iconKey: 'BOX',
    name: 'Box',
    description: 'Files and folders from Box',
    category: 'storage',
    categoryLabel: 'Cloud Storage',
    configureRoute: null,
    available: false,
  },

  // HR & Employee Management
  {
    id: 'workday',
    provider: 'WORKDAY',
    iconKey: 'WORKDAY',
    name: 'Workday',
    description: 'Help articles and SOPs from Workday',
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
    description: 'Employees, leave, and HR data from Zoho People',
    category: 'hr',
    categoryLabel: 'HR & Employee',
    configureRoute: null,
    available: false,
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
  hr: 'hr',
  itsm: 'task',
};

export function mapApiCategory(category: string): MarketplaceCategory {
  return PROVIDER_CATEGORY_MAP[category] ?? 'task';
}

export function getMarketplaceAppCount(): number {
  return MARKETPLACE_APPS.length;
}
