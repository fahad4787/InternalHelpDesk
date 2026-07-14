import {
  DEFAULT_GOOGLE_PREFERENCES,
  type GoogleCalendarStatus,
} from '@/services/google-calendar.service';
import {
  DEFAULT_CALENDLY_PREFERENCES,
  type CalendlyStatus,
} from '@/services/calendly.service';
import { DEFAULT_JIRA_PREFERENCES, type JiraStatus } from '@/services/jira.service';
import { DEFAULT_ASANA_PREFERENCES, type AsanaStatus } from '@/services/asana.service';
import { DEFAULT_OUTLOOK_PREFERENCES, type OutlookStatus } from '@/services/outlook.service';
import { DEFAULT_SLACK_PREFERENCES, type SlackStatus } from '@/services/slack.service';
import { DEFAULT_TRELLO_PREFERENCES, type TrelloStatus } from '@/services/trello.service';
import { DEFAULT_ZOOM_PREFERENCES, type ZoomStatus } from '@/services/zoom.service';
import {
  DEFAULT_DROPBOX_PREFERENCES,
  type DropboxStatus,
} from '@/services/dropbox.service';
import type { WorkdayStatus } from '@/services/workday.service';
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  DASHBOARD_WIDGET_IDS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';

export interface DashboardIntegrationStatuses {
  google?: GoogleCalendarStatus | null;
  jira?: JiraStatus | null;
  trello?: TrelloStatus | null;
  asana?: AsanaStatus | null;
  calendly?: CalendlyStatus | null;
  slack?: SlackStatus | null;
  zoom?: ZoomStatus | null;
  outlook?: OutlookStatus | null;
  dropbox?: DropboxStatus | null;
  workday?: WorkdayStatus | null;
}

export function resolveVisibleDashboardWidgets(
  statuses: DashboardIntegrationStatuses,
): DashboardWidgetId[] {
  const visible: DashboardWidgetId[] = [];

  const google = statuses.google;
  if (google?.connected) {
    const preferences = google.preferences ?? DEFAULT_GOOGLE_PREFERENCES;
    if (preferences.showUpcomingMeet) visible.push('google-meet');
    if (preferences.showCalendarEmbed && google.googleEmail) visible.push('google-calendar');
    if (preferences.showGoogleDrive) visible.push('google-drive');
    if (preferences.showGmail) visible.push('google-gmail');
    if (preferences.showGoogleChat) visible.push('google-chat');
  }

  const jira = statuses.jira;
  if (jira?.connected) {
    const preferences = jira.preferences ?? DEFAULT_JIRA_PREFERENCES;
    if (preferences.showProfile) visible.push('jira-profile');
    if (preferences.showAssignedIssues) visible.push('jira-assigned');
    if (preferences.showReportedIssues) visible.push('jira-reported');
    if (preferences.showProjects) visible.push('jira-projects');
  }

  const trello = statuses.trello;
  if (trello?.connected) {
    const preferences = trello.preferences ?? DEFAULT_TRELLO_PREFERENCES;
    if (preferences.showBoards) visible.push('trello-boards');
  }

  const asana = statuses.asana;
  if (asana?.connected) {
    const preferences = asana.preferences ?? DEFAULT_ASANA_PREFERENCES;
    if (preferences.showProjects) visible.push('asana-projects');
    if (preferences.showMyTasks) visible.push('asana-my-tasks');
  }

  const calendly = statuses.calendly;
  if (calendly?.connected) {
    const preferences = calendly.preferences ?? DEFAULT_CALENDLY_PREFERENCES;
    if (preferences.showEventTypes) visible.push('calendly-event-types');
    if (preferences.showUpcomingEvents) visible.push('calendly-events');
  }

  const slack = statuses.slack;
  if (slack?.connected) {
    const preferences = slack.preferences ?? DEFAULT_SLACK_PREFERENCES;
    if (preferences.showChannels || preferences.showDirectMessages) {
      visible.push('slack-messenger');
    }
  }

  const zoom = statuses.zoom;
  if (zoom?.connected) {
    const preferences = zoom.preferences ?? DEFAULT_ZOOM_PREFERENCES;
    if (preferences.showProfile) visible.push('zoom-profile');
    if (preferences.showCalendarView) visible.push('zoom-calendar');
    if (preferences.showUpcomingMeetings) visible.push('zoom-meetings');
  }

  const outlook = statuses.outlook;
  if (outlook?.connected) {
    const preferences = outlook.preferences ?? DEFAULT_OUTLOOK_PREFERENCES;
    if (preferences.showProfile) visible.push('outlook-profile');
    if (preferences.showInbox) visible.push('outlook-inbox');
  }

  const dropbox = statuses.dropbox;
  if (dropbox?.connected) {
    const preferences = dropbox.preferences ?? DEFAULT_DROPBOX_PREFERENCES;
    if (preferences.showFiles) visible.push('dropbox-files');
  }

  if (statuses.workday?.connected) {
    visible.push('workday-articles');
  }

  return DASHBOARD_WIDGET_IDS.filter((widgetId) => visible.includes(widgetId)).sort(
    (a, b) => DASHBOARD_WIDGET_DEFINITIONS[a].order - DASHBOARD_WIDGET_DEFINITIONS[b].order,
  );
}

export function getConnectedIntegrationRoutes(
  statuses: DashboardIntegrationStatuses,
): { provider: string; route: string; label: string }[] {
  const routes: { provider: string; route: string; label: string }[] = [];

  if (statuses.google?.connected) {
    routes.push({ provider: 'GOOGLE_CALENDAR', route: '/integrations/google', label: 'Google' });
  }
  if (statuses.jira?.connected) {
    routes.push({ provider: 'JIRA', route: '/integrations/jira', label: 'Jira' });
  }
  if (statuses.trello?.connected) {
    routes.push({ provider: 'TRELLO', route: '/integrations/trello', label: 'Trello' });
  }
  if (statuses.asana?.connected) {
    routes.push({ provider: 'ASANA', route: '/integrations/asana', label: 'Asana' });
  }
  if (statuses.calendly?.connected) {
    routes.push({ provider: 'CALENDLY', route: '/integrations/calendly', label: 'Calendly' });
  }
  if (statuses.slack?.connected) {
    routes.push({ provider: 'SLACK', route: '/integrations/slack', label: 'Slack' });
  }
  if (statuses.zoom?.connected) {
    routes.push({ provider: 'ZOOM', route: '/integrations/zoom', label: 'Zoom' });
  }
  if (statuses.outlook?.connected) {
    routes.push({ provider: 'OUTLOOK', route: '/integrations/outlook', label: 'Outlook' });
  }
  if (statuses.dropbox?.connected) {
    routes.push({ provider: 'DROPBOX', route: '/integrations/dropbox', label: 'Dropbox' });
  }
  if (statuses.workday?.connected) {
    routes.push({ provider: 'WORKDAY', route: '/integrations/workday', label: 'Workday' });
  }

  return routes;
}

export function filterWidgetsByProvider(
  widgetIds: DashboardWidgetId[],
  provider: string,
): DashboardWidgetId[] {
  return widgetIds.filter(
    (widgetId) => DASHBOARD_WIDGET_DEFINITIONS[widgetId].provider === provider,
  );
}

export const INTEGRATION_FULL_WIDTH_WIDGETS = new Set<DashboardWidgetId>([
  'slack-messenger',
  'google-chat',
  'trello-boards',
  'dropbox-files',
  'asana-projects',
]);
