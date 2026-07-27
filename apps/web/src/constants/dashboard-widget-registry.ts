import type { ComponentType } from 'react';
import {
  CalendlyEventTypesDashboardWidget,
  CalendlyUpcomingEventsDashboardWidget,
} from '@/components/dashboard/widgets/calendly-dashboard-widgets';
import {
  GoogleCalendarEmbedDashboardWidget,
  GoogleChatDashboardWidget,
  GoogleDriveDashboardWidget,
  GoogleGmailDashboardWidget,
  GoogleMeetDashboardWidget,
} from '@/components/dashboard/widgets/google-dashboard-widgets';
import {
  JiraAssignedDashboardWidget,
  JiraProjectsDashboardWidget,
  JiraReportedDashboardWidget,
} from '@/components/dashboard/widgets/jira-dashboard-widgets';
import {
  OutlookInboxDashboardWidget,
  OutlookCalendarDashboardWidget,
} from '@/components/dashboard/widgets/outlook-dashboard-widgets';
import {
  TeamsChatsDashboardWidget,
  TeamsJoinedDashboardWidget,
} from '@/components/dashboard/widgets/teams-dashboard-widgets';
import {
  SlackMessengerDashboardWidget,
  SlackProfileDashboardWidget,
} from '@/components/dashboard/widgets/slack-dashboard-widgets';
import {
  TrelloBoardsDashboardWidget,
} from '@/components/dashboard/widgets/trello-dashboard-widgets';
import {
  AsanaProjectsDashboardWidget,
} from '@/components/dashboard/widgets/asana-dashboard-widgets';
import {
  MondayBoardsDashboardWidget,
} from '@/components/dashboard/widgets/monday-dashboard-widgets';
import {
  ClickUpListsDashboardWidget,
} from '@/components/dashboard/widgets/clickup-dashboard-widgets';
import {
  ZoomCalendarDashboardWidget,
  ZoomMeetingsDashboardWidget,
  ZoomProfileDashboardWidget,
} from '@/components/dashboard/widgets/zoom-dashboard-widgets';
import { WorkdayDashboardWidget } from '@/components/dashboard/widgets/workday-dashboard-widget';
import { DropboxFilesDashboardWidget } from '@/components/dashboard/widgets/dropbox-dashboard-widgets';
import { BoxFilesDashboardWidget } from '@/components/dashboard/widgets/box-dashboard-widgets';
import { OneDriveFilesDashboardWidget } from '@/components/dashboard/widgets/onedrive-dashboard-widgets';
import { SharePointSitesDashboardWidget } from '@/components/dashboard/widgets/sharepoint-dashboard-widgets';
import {
  HubSpotContactsDashboardWidget,
  HubSpotDealsDashboardWidget,
  HubSpotTicketsDashboardWidget,
} from '@/components/dashboard/widgets/hubspot-dashboard-widgets';
import {
  SalesforceContactsDashboardWidget,
  SalesforceAccountsDashboardWidget,
  SalesforceOpportunitiesDashboardWidget,
} from '@/components/dashboard/widgets/salesforce-dashboard-widgets';
import {
  DynamicsContactsDashboardWidget,
  DynamicsAccountsDashboardWidget,
  DynamicsOpportunitiesDashboardWidget,
} from '@/components/dashboard/widgets/dynamics-dashboard-widgets';
import {
  ZohoCrmContactsDashboardWidget,
  ZohoCrmDealsDashboardWidget,
  ZohoCrmLeadsDashboardWidget,
} from '@/components/dashboard/widgets/zoho-crm-dashboard-widgets';
import {
  ZohoPeopleEmployeesDashboardWidget,
  ZohoPeopleLeaveDashboardWidget,
} from '@/components/dashboard/widgets/zoho-people-dashboard-widgets';

export const DASHBOARD_WIDGET_IDS = [
  'google-meet',
  'google-calendar',
  'google-drive',
  'google-gmail',
  'google-chat',
  'jira-assigned',
  'jira-reported',
  'jira-projects',
  'trello-boards',
  'asana-projects',
  'monday-boards',
  'clickup-lists',
  'calendly-event-types',
  'calendly-events',
  'slack-profile',
  'slack-messenger',
  'zoom-profile',
  'zoom-calendar',
  'zoom-meetings',
  'outlook-calendar',
  'outlook-inbox',
  'teams-joined',
  'teams-chats',
  'dropbox-files',
  'box-files',
  'onedrive-files',
  'sharepoint-sites',
  'hubspot-contacts',
  'hubspot-deals',
  'hubspot-tickets',
  'salesforce-contacts',
  'salesforce-accounts',
  'salesforce-opportunities',
  'dynamics-contacts',
  'dynamics-accounts',
  'dynamics-opportunities',
  'zoho-crm-contacts',
  'zoho-crm-deals',
  'zoho-crm-leads',
  'zoho-people-employees',
  'zoho-people-leave',
  'workday-articles',
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  label: string;
  provider: string;
  configureRoute: string;
  order: number;
}

export const DASHBOARD_WIDGET_DEFINITIONS: Record<DashboardWidgetId, DashboardWidgetDefinition> = {
  'google-meet': {
    id: 'google-meet',
    label: 'Upcoming Google Meet',
    provider: 'GOOGLE_CALENDAR',
    configureRoute: '/integrations/google',
    order: 10,
  },
  'google-calendar': {
    id: 'google-calendar',
    label: 'Google Calendar',
    provider: 'GOOGLE_CALENDAR',
    configureRoute: '/integrations/google',
    order: 11,
  },
  'google-drive': {
    id: 'google-drive',
    label: 'Google Drive',
    provider: 'GOOGLE_CALENDAR',
    configureRoute: '/integrations/google',
    order: 12,
  },
  'google-gmail': {
    id: 'google-gmail',
    label: 'Gmail',
    provider: 'GOOGLE_CALENDAR',
    configureRoute: '/integrations/google',
    order: 13,
  },
  'google-chat': {
    id: 'google-chat',
    label: 'Google Chat',
    provider: 'GOOGLE_CALENDAR',
    configureRoute: '/integrations/google',
    order: 14,
  },
  'jira-assigned': {
    id: 'jira-assigned',
    label: 'Assigned issues',
    provider: 'JIRA',
    configureRoute: '/integrations/jira',
    order: 20,
  },
  'jira-reported': {
    id: 'jira-reported',
    label: 'Reported issues',
    provider: 'JIRA',
    configureRoute: '/integrations/jira',
    order: 21,
  },
  'jira-projects': {
    id: 'jira-projects',
    label: 'Projects',
    provider: 'JIRA',
    configureRoute: '/integrations/jira',
    order: 22,
  },
  'trello-boards': {
    id: 'trello-boards',
    label: 'Boards',
    provider: 'TRELLO',
    configureRoute: '/integrations/trello',
    order: 25,
  },
  'asana-projects': {
    id: 'asana-projects',
    label: 'Projects',
    provider: 'ASANA',
    configureRoute: '/integrations/asana',
    order: 26,
  },
  'monday-boards': {
    id: 'monday-boards',
    label: 'Boards',
    provider: 'MONDAY',
    configureRoute: '/integrations/monday',
    order: 27,
  },
  'clickup-lists': {
    id: 'clickup-lists',
    label: 'Lists',
    provider: 'CLICKUP',
    configureRoute: '/integrations/clickup',
    order: 28,
  },
  'calendly-event-types': {
    id: 'calendly-event-types',
    label: 'Event types',
    provider: 'CALENDLY',
    configureRoute: '/integrations/calendly',
    order: 29,
  },
  'calendly-events': {
    id: 'calendly-events',
    label: 'Upcoming events',
    provider: 'CALENDLY',
    configureRoute: '/integrations/calendly',
    order: 30,
  },
  'slack-profile': {
    id: 'slack-profile',
    label: 'Workspace profile',
    provider: 'SLACK',
    configureRoute: '/integrations/slack',
    order: 31,
  },
  'slack-messenger': {
    id: 'slack-messenger',
    label: 'Channels & messages',
    provider: 'SLACK',
    configureRoute: '/integrations/slack',
    order: 32,
  },
  'zoom-profile': {
    id: 'zoom-profile',
    label: 'Zoom Profile',
    provider: 'ZOOM',
    configureRoute: '/integrations/zoom',
    order: 40,
  },
  'zoom-calendar': {
    id: 'zoom-calendar',
    label: 'Zoom Calendar',
    provider: 'ZOOM',
    configureRoute: '/integrations/zoom',
    order: 41,
  },
  'zoom-meetings': {
    id: 'zoom-meetings',
    label: 'Upcoming Zoom meetings',
    provider: 'ZOOM',
    configureRoute: '/integrations/zoom',
    order: 42,
  },
  'outlook-calendar': {
    id: 'outlook-calendar',
    label: 'Outlook Calendar',
    provider: 'OUTLOOK',
    configureRoute: '/integrations/outlook',
    order: 50,
  },
  'outlook-inbox': {
    id: 'outlook-inbox',
    label: 'Inbox',
    provider: 'OUTLOOK',
    configureRoute: '/integrations/outlook',
    order: 51,
  },
  'teams-joined': {
    id: 'teams-joined',
    label: 'Joined teams',
    provider: 'MICROSOFT_TEAMS',
    configureRoute: '/integrations/teams',
    order: 52,
  },
  'teams-chats': {
    id: 'teams-chats',
    label: 'Recent chats',
    provider: 'MICROSOFT_TEAMS',
    configureRoute: '/integrations/teams',
    order: 53,
  },
  'dropbox-files': {
    id: 'dropbox-files',
    label: 'Dropbox files',
    provider: 'DROPBOX',
    configureRoute: '/integrations/dropbox',
    order: 55,
  },
  'box-files': {
    id: 'box-files',
    label: 'Box files',
    provider: 'BOX',
    configureRoute: '/integrations/box',
    order: 56,
  },
  'onedrive-files': {
    id: 'onedrive-files',
    label: 'OneDrive files',
    provider: 'ONEDRIVE',
    configureRoute: '/integrations/onedrive',
    order: 57,
  },
  'sharepoint-sites': {
    id: 'sharepoint-sites',
    label: 'SharePoint sites',
    provider: 'SHAREPOINT',
    configureRoute: '/integrations/sharepoint',
    order: 58,
  },
  'hubspot-contacts': {
    id: 'hubspot-contacts',
    label: 'Contacts',
    provider: 'HUBSPOT',
    configureRoute: '/integrations/hubspot',
    order: 59,
  },
  'hubspot-deals': {
    id: 'hubspot-deals',
    label: 'Deals',
    provider: 'HUBSPOT',
    configureRoute: '/integrations/hubspot',
    order: 60,
  },
  'hubspot-tickets': {
    id: 'hubspot-tickets',
    label: 'Tickets',
    provider: 'HUBSPOT',
    configureRoute: '/integrations/hubspot',
    order: 61,
  },
  'salesforce-contacts': {
    id: 'salesforce-contacts',
    label: 'Contacts',
    provider: 'SALESFORCE',
    configureRoute: '/integrations/salesforce',
    order: 62,
  },
  'salesforce-accounts': {
    id: 'salesforce-accounts',
    label: 'Accounts',
    provider: 'SALESFORCE',
    configureRoute: '/integrations/salesforce',
    order: 63,
  },
  'salesforce-opportunities': {
    id: 'salesforce-opportunities',
    label: 'Opportunities',
    provider: 'SALESFORCE',
    configureRoute: '/integrations/salesforce',
    order: 64,
  },
  'dynamics-contacts': {
    id: 'dynamics-contacts',
    label: 'Contacts',
    provider: 'DYNAMICS_365',
    configureRoute: '/integrations/dynamics',
    order: 65,
  },
  'dynamics-accounts': {
    id: 'dynamics-accounts',
    label: 'Accounts',
    provider: 'DYNAMICS_365',
    configureRoute: '/integrations/dynamics',
    order: 66,
  },
  'dynamics-opportunities': {
    id: 'dynamics-opportunities',
    label: 'Opportunities',
    provider: 'DYNAMICS_365',
    configureRoute: '/integrations/dynamics',
    order: 67,
  },
  'zoho-crm-contacts': {
    id: 'zoho-crm-contacts',
    label: 'Contacts',
    provider: 'ZOHO_CRM',
    configureRoute: '/integrations/zoho-crm',
    order: 68,
  },
  'zoho-crm-deals': {
    id: 'zoho-crm-deals',
    label: 'Deals',
    provider: 'ZOHO_CRM',
    configureRoute: '/integrations/zoho-crm',
    order: 69,
  },
  'zoho-crm-leads': {
    id: 'zoho-crm-leads',
    label: 'Leads',
    provider: 'ZOHO_CRM',
    configureRoute: '/integrations/zoho-crm',
    order: 70,
  },
  'zoho-people-employees': {
    id: 'zoho-people-employees',
    label: 'Employees',
    provider: 'ZOHO_PEOPLE',
    configureRoute: '/integrations/zoho-people',
    order: 71,
  },
  'zoho-people-leave': {
    id: 'zoho-people-leave',
    label: 'Leave',
    provider: 'ZOHO_PEOPLE',
    configureRoute: '/integrations/zoho-people',
    order: 72,
  },
  'workday-articles': {
    id: 'workday-articles',
    label: 'Help articles',
    provider: 'WORKDAY',
    configureRoute: '/integrations/workday',
    order: 73,
  },
};

export const DASHBOARD_WIDGET_COMPONENTS: Record<DashboardWidgetId, ComponentType> = {
  'google-meet': GoogleMeetDashboardWidget,
  'google-calendar': GoogleCalendarEmbedDashboardWidget,
  'google-drive': GoogleDriveDashboardWidget,
  'google-gmail': GoogleGmailDashboardWidget,
  'google-chat': GoogleChatDashboardWidget,
  'jira-assigned': JiraAssignedDashboardWidget,
  'jira-reported': JiraReportedDashboardWidget,
  'jira-projects': JiraProjectsDashboardWidget,
  'trello-boards': TrelloBoardsDashboardWidget,
  'asana-projects': AsanaProjectsDashboardWidget,
  'monday-boards': MondayBoardsDashboardWidget,
  'clickup-lists': ClickUpListsDashboardWidget,
  'calendly-event-types': CalendlyEventTypesDashboardWidget,
  'calendly-events': CalendlyUpcomingEventsDashboardWidget,
  'slack-profile': SlackProfileDashboardWidget,
  'slack-messenger': SlackMessengerDashboardWidget,
  'zoom-profile': ZoomProfileDashboardWidget,
  'zoom-calendar': ZoomCalendarDashboardWidget,
  'zoom-meetings': ZoomMeetingsDashboardWidget,
  'outlook-calendar': OutlookCalendarDashboardWidget,
  'outlook-inbox': OutlookInboxDashboardWidget,
  'teams-joined': TeamsJoinedDashboardWidget,
  'teams-chats': TeamsChatsDashboardWidget,
  'dropbox-files': DropboxFilesDashboardWidget,
  'box-files': BoxFilesDashboardWidget,
  'onedrive-files': OneDriveFilesDashboardWidget,
  'sharepoint-sites': SharePointSitesDashboardWidget,
  'hubspot-contacts': HubSpotContactsDashboardWidget,
  'hubspot-deals': HubSpotDealsDashboardWidget,
  'hubspot-tickets': HubSpotTicketsDashboardWidget,
  'salesforce-contacts': SalesforceContactsDashboardWidget,
  'salesforce-accounts': SalesforceAccountsDashboardWidget,
  'salesforce-opportunities': SalesforceOpportunitiesDashboardWidget,
  'dynamics-contacts': DynamicsContactsDashboardWidget,
  'dynamics-accounts': DynamicsAccountsDashboardWidget,
  'dynamics-opportunities': DynamicsOpportunitiesDashboardWidget,
  'zoho-crm-contacts': ZohoCrmContactsDashboardWidget,
  'zoho-crm-deals': ZohoCrmDealsDashboardWidget,
  'zoho-crm-leads': ZohoCrmLeadsDashboardWidget,
  'zoho-people-employees': ZohoPeopleEmployeesDashboardWidget,
  'zoho-people-leave': ZohoPeopleLeaveDashboardWidget,
  'workday-articles': WorkdayDashboardWidget,
};

export const INTEGRATION_CONFIGURE_ROUTES: Record<string, string> = {
  GOOGLE_CALENDAR: '/integrations/google',
  JIRA: '/integrations/jira',
  TRELLO: '/integrations/trello',
  ASANA: '/integrations/asana',
  MONDAY: '/integrations/monday',
  CLICKUP: '/integrations/clickup',
  CALENDLY: '/integrations/calendly',
  SLACK: '/integrations/slack',
  ZOOM: '/integrations/zoom',
  OUTLOOK: '/integrations/outlook',
  MICROSOFT_TEAMS: '/integrations/teams',
  DROPBOX: '/integrations/dropbox',
  BOX: '/integrations/box',
  ONEDRIVE: '/integrations/onedrive',
  SHAREPOINT: '/integrations/sharepoint',
  HUBSPOT: '/integrations/hubspot',
  SALESFORCE: '/integrations/salesforce',
  DYNAMICS_365: '/integrations/dynamics',
  ZOHO_CRM: '/integrations/zoho-crm',
  ZOHO_PEOPLE: '/integrations/zoho-people',
  WORKDAY: '/integrations/workday',
};

export function isDashboardWidgetId(value: string): value is DashboardWidgetId {
  return (DASHBOARD_WIDGET_IDS as readonly string[]).includes(value);
}

export function countDashboardWidgetsForProvider(
  provider: string,
  visibleWidgetIds: DashboardWidgetId[],
): number {
  return visibleWidgetIds.filter(
    (widgetId) => DASHBOARD_WIDGET_DEFINITIONS[widgetId].provider === provider,
  ).length;
}

export function getWidgetLabelsForProvider(provider: string): string[] {
  return DASHBOARD_WIDGET_IDS.filter(
    (widgetId) => DASHBOARD_WIDGET_DEFINITIONS[widgetId].provider === provider,
  ).map((widgetId) => DASHBOARD_WIDGET_DEFINITIONS[widgetId].label);
}
