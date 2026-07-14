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
  JiraProfileDashboardWidget,
  JiraProjectsDashboardWidget,
  JiraReportedDashboardWidget,
} from '@/components/dashboard/widgets/jira-dashboard-widgets';
import {
  OutlookInboxDashboardWidget,
  OutlookProfileDashboardWidget,
} from '@/components/dashboard/widgets/outlook-dashboard-widgets';
import {
  SlackMessengerDashboardWidget,
  SlackProfileDashboardWidget,
} from '@/components/dashboard/widgets/slack-dashboard-widgets';
import {
  TrelloBoardsDashboardWidget,
} from '@/components/dashboard/widgets/trello-dashboard-widgets';
import {
  ZoomCalendarDashboardWidget,
  ZoomMeetingsDashboardWidget,
  ZoomProfileDashboardWidget,
} from '@/components/dashboard/widgets/zoom-dashboard-widgets';
import { WorkdayDashboardWidget } from '@/components/dashboard/widgets/workday-dashboard-widget';
import { DropboxFilesDashboardWidget } from '@/components/dashboard/widgets/dropbox-dashboard-widgets';

export const DASHBOARD_WIDGET_IDS = [
  'google-meet',
  'google-calendar',
  'google-drive',
  'google-gmail',
  'google-chat',
  'jira-profile',
  'jira-assigned',
  'jira-reported',
  'jira-projects',
  'trello-boards',
  'calendly-event-types',
  'calendly-events',
  'slack-profile',
  'slack-messenger',
  'zoom-profile',
  'zoom-calendar',
  'zoom-meetings',
  'outlook-profile',
  'outlook-inbox',
  'dropbox-files',
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
  'jira-profile': {
    id: 'jira-profile',
    label: 'Jira Profile',
    provider: 'JIRA',
    configureRoute: '/integrations/jira',
    order: 20,
  },
  'jira-assigned': {
    id: 'jira-assigned',
    label: 'Assigned issues',
    provider: 'JIRA',
    configureRoute: '/integrations/jira',
    order: 21,
  },
  'jira-reported': {
    id: 'jira-reported',
    label: 'Reported issues',
    provider: 'JIRA',
    configureRoute: '/integrations/jira',
    order: 22,
  },
  'jira-projects': {
    id: 'jira-projects',
    label: 'Projects',
    provider: 'JIRA',
    configureRoute: '/integrations/jira',
    order: 23,
  },
  'trello-boards': {
    id: 'trello-boards',
    label: 'Boards',
    provider: 'TRELLO',
    configureRoute: '/integrations/trello',
    order: 25,
  },
  'calendly-event-types': {
    id: 'calendly-event-types',
    label: 'Event types',
    provider: 'CALENDLY',
    configureRoute: '/integrations/calendly',
    order: 27,
  },
  'calendly-events': {
    id: 'calendly-events',
    label: 'Upcoming events',
    provider: 'CALENDLY',
    configureRoute: '/integrations/calendly',
    order: 28,
  },
  'slack-profile': {
    id: 'slack-profile',
    label: 'Workspace profile',
    provider: 'SLACK',
    configureRoute: '/integrations/slack',
    order: 30,
  },
  'slack-messenger': {
    id: 'slack-messenger',
    label: 'Channels & messages',
    provider: 'SLACK',
    configureRoute: '/integrations/slack',
    order: 31,
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
  'outlook-profile': {
    id: 'outlook-profile',
    label: 'Outlook profile',
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
  'dropbox-files': {
    id: 'dropbox-files',
    label: 'Dropbox files',
    provider: 'DROPBOX',
    configureRoute: '/integrations/dropbox',
    order: 55,
  },
  'workday-articles': {
    id: 'workday-articles',
    label: 'Help articles',
    provider: 'WORKDAY',
    configureRoute: '/integrations/workday',
    order: 60,
  },
};

export const DASHBOARD_WIDGET_COMPONENTS: Record<DashboardWidgetId, ComponentType> = {
  'google-meet': GoogleMeetDashboardWidget,
  'google-calendar': GoogleCalendarEmbedDashboardWidget,
  'google-drive': GoogleDriveDashboardWidget,
  'google-gmail': GoogleGmailDashboardWidget,
  'google-chat': GoogleChatDashboardWidget,
  'jira-profile': JiraProfileDashboardWidget,
  'jira-assigned': JiraAssignedDashboardWidget,
  'jira-reported': JiraReportedDashboardWidget,
  'jira-projects': JiraProjectsDashboardWidget,
  'trello-boards': TrelloBoardsDashboardWidget,
  'calendly-event-types': CalendlyEventTypesDashboardWidget,
  'calendly-events': CalendlyUpcomingEventsDashboardWidget,
  'slack-profile': SlackProfileDashboardWidget,
  'slack-messenger': SlackMessengerDashboardWidget,
  'zoom-profile': ZoomProfileDashboardWidget,
  'zoom-calendar': ZoomCalendarDashboardWidget,
  'zoom-meetings': ZoomMeetingsDashboardWidget,
  'outlook-profile': OutlookProfileDashboardWidget,
  'outlook-inbox': OutlookInboxDashboardWidget,
  'dropbox-files': DropboxFilesDashboardWidget,
  'workday-articles': WorkdayDashboardWidget,
};

export const INTEGRATION_CONFIGURE_ROUTES: Record<string, string> = {
  GOOGLE_CALENDAR: '/integrations/google',
  JIRA: '/integrations/jira',
  TRELLO: '/integrations/trello',
  CALENDLY: '/integrations/calendly',
  SLACK: '/integrations/slack',
  ZOOM: '/integrations/zoom',
  OUTLOOK: '/integrations/outlook',
  DROPBOX: '/integrations/dropbox',
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
