import {
  DEFAULT_GOOGLE_PREFERENCES,
  type GooglePreferences,
} from '@/services/google-calendar.service';
import {
  DEFAULT_CALENDLY_PREFERENCES,
  type CalendlyPreferences,
} from '@/services/calendly.service';
import {
  DEFAULT_JIRA_PREFERENCES,
  type JiraPreferences,
} from '@/services/jira.service';
import {
  DEFAULT_ASANA_PREFERENCES,
  type AsanaPreferences,
} from '@/services/asana.service';
import {
  DEFAULT_MONDAY_PREFERENCES,
  type MondayPreferences,
} from '@/services/monday.service';
import {
  DEFAULT_CLICKUP_PREFERENCES,
  type ClickUpPreferences,
} from '@/services/clickup.service';
import {
  DEFAULT_OUTLOOK_PREFERENCES,
  type OutlookPreferences,
} from '@/services/outlook.service';
import {
  DEFAULT_TEAMS_PREFERENCES,
  type TeamsPreferences,
} from '@/services/teams.service';
import { isPersonalMicrosoftAccount } from '@/lib/teams-account';
import {
  DEFAULT_SLACK_PREFERENCES,
  type SlackPreferences,
} from '@/services/slack.service';
import {
  DEFAULT_TRELLO_PREFERENCES,
  type TrelloPreferences,
} from '@/services/trello.service';
import {
  DEFAULT_ZOOM_PREFERENCES,
  type ZoomPreferences,
} from '@/services/zoom.service';
import {
  DEFAULT_DROPBOX_PREFERENCES,
  type DropboxPreferences,
} from '@/services/dropbox.service';
import {
  DEFAULT_BOX_PREFERENCES,
  type BoxPreferences,
} from '@/services/box.service';
import {
  DEFAULT_ONEDRIVE_PREFERENCES,
  type OneDrivePreferences,
} from '@/services/onedrive.service';
import {
  DEFAULT_SHAREPOINT_PREFERENCES,
  type SharePointPreferences,
} from '@/services/sharepoint.service';
import {
  DEFAULT_HUBSPOT_PREFERENCES,
  type HubSpotPreferences,
} from '@/services/hubspot.service';
import {
  DEFAULT_SALESFORCE_PREFERENCES,
  type SalesforcePreferences,
} from '@/services/salesforce.service';
import {
  DEFAULT_DYNAMICS_PREFERENCES,
  type DynamicsPreferences,
} from '@/services/dynamics.service';
import {
  DEFAULT_ZOHO_CRM_PREFERENCES,
  type ZohoCrmPreferences,
} from '@/services/zoho-crm.service';
import {
  DEFAULT_ZOHO_PEOPLE_PREFERENCES,
  type ZohoPeoplePreferences,
} from '@/services/zoho-people.service';
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  DASHBOARD_WIDGET_IDS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';

/** Slim connection snapshot from GET /integrations/dashboard-status (not full provider status). */
export interface DashboardConnectionStatus<TPreferences = unknown> {
  connected: boolean;
  lastSyncedAt: string | null;
  preferences?: TPreferences | null;
}

export interface DashboardGoogleStatus
  extends DashboardConnectionStatus<GooglePreferences> {
  googleEmail: string | null;
}

export interface DashboardTeamsStatus
  extends DashboardConnectionStatus<TeamsPreferences> {
  teamsEmail?: string | null;
}

export interface DashboardSharePointStatus
  extends DashboardConnectionStatus<SharePointPreferences> {
  sharepointEmail?: string | null;
}

export interface DashboardIntegrationStatuses {
  google?: DashboardGoogleStatus | null;
  jira?: DashboardConnectionStatus<JiraPreferences> | null;
  trello?: DashboardConnectionStatus<TrelloPreferences> | null;
  asana?: DashboardConnectionStatus<AsanaPreferences> | null;
  monday?: DashboardConnectionStatus<MondayPreferences> | null;
  clickup?: DashboardConnectionStatus<ClickUpPreferences> | null;
  calendly?: DashboardConnectionStatus<CalendlyPreferences> | null;
  slack?: DashboardConnectionStatus<SlackPreferences> | null;
  zoom?: DashboardConnectionStatus<ZoomPreferences> | null;
  outlook?: DashboardConnectionStatus<OutlookPreferences> | null;
  teams?: DashboardTeamsStatus | null;
  dropbox?: DashboardConnectionStatus<DropboxPreferences> | null;
  box?: DashboardConnectionStatus<BoxPreferences> | null;
  onedrive?: DashboardConnectionStatus<OneDrivePreferences> | null;
  sharepoint?: DashboardSharePointStatus | null;
  hubspot?: DashboardConnectionStatus<HubSpotPreferences> | null;
  salesforce?: DashboardConnectionStatus<SalesforcePreferences> | null;
  dynamics?: DashboardConnectionStatus<DynamicsPreferences> | null;
  zohoCrm?: DashboardConnectionStatus<ZohoCrmPreferences> | null;
  zohoPeople?: DashboardConnectionStatus<ZohoPeoplePreferences> | null;
  workday?: DashboardConnectionStatus | null;
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
  }

  const monday = statuses.monday;
  if (monday?.connected) {
    const preferences = monday.preferences ?? DEFAULT_MONDAY_PREFERENCES;
    if (preferences.showBoards) visible.push('monday-boards');
  }

  const clickup = statuses.clickup;
  if (clickup?.connected) {
    const preferences = clickup.preferences ?? DEFAULT_CLICKUP_PREFERENCES;
    if (preferences.showLists) visible.push('clickup-lists');
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
    if (preferences.showCalendar) visible.push('outlook-calendar');
    if (preferences.showInbox) visible.push('outlook-inbox');
  }

  const teams = statuses.teams;
  if (teams?.connected && !isPersonalMicrosoftAccount(teams.teamsEmail)) {
    const preferences = teams.preferences ?? DEFAULT_TEAMS_PREFERENCES;
    if (preferences.showTeams) visible.push('teams-joined');
    if (preferences.showChats) visible.push('teams-chats');
  }

  const dropbox = statuses.dropbox;
  if (dropbox?.connected) {
    const preferences = dropbox.preferences ?? DEFAULT_DROPBOX_PREFERENCES;
    if (preferences.showFiles) visible.push('dropbox-files');
  }

  const box = statuses.box;
  if (box?.connected) {
    const preferences = box.preferences ?? DEFAULT_BOX_PREFERENCES;
    if (preferences.showFiles) visible.push('box-files');
  }

  const onedrive = statuses.onedrive;
  if (onedrive?.connected) {
    const preferences = onedrive.preferences ?? DEFAULT_ONEDRIVE_PREFERENCES;
    if (preferences.showFiles) visible.push('onedrive-files');
  }

  const sharepoint = statuses.sharepoint;
  if (
    sharepoint?.connected &&
    !isPersonalMicrosoftAccount(sharepoint.sharepointEmail)
  ) {
    const preferences = sharepoint.preferences ?? DEFAULT_SHAREPOINT_PREFERENCES;
    if (preferences.showSites) visible.push('sharepoint-sites');
  }

  const hubspot = statuses.hubspot;
  if (hubspot?.connected) {
    const preferences = hubspot.preferences ?? DEFAULT_HUBSPOT_PREFERENCES;
    if (preferences.showContacts) visible.push('hubspot-contacts');
    if (preferences.showDeals) visible.push('hubspot-deals');
    if (preferences.showTickets) visible.push('hubspot-tickets');
  }

  const salesforce = statuses.salesforce;
  if (salesforce?.connected) {
    const preferences =
      salesforce.preferences ?? DEFAULT_SALESFORCE_PREFERENCES;
    if (preferences.showContacts) visible.push('salesforce-contacts');
    if (preferences.showAccounts) visible.push('salesforce-accounts');
    if (preferences.showOpportunities) visible.push('salesforce-opportunities');
  }

  const dynamics = statuses.dynamics;
  if (dynamics?.connected) {
    const preferences = dynamics.preferences ?? DEFAULT_DYNAMICS_PREFERENCES;
    if (preferences.showContacts) visible.push('dynamics-contacts');
    if (preferences.showAccounts) visible.push('dynamics-accounts');
    if (preferences.showOpportunities) visible.push('dynamics-opportunities');
  }

  const zohoCrm = statuses.zohoCrm;
  if (zohoCrm?.connected) {
    const preferences = zohoCrm.preferences ?? DEFAULT_ZOHO_CRM_PREFERENCES;
    if (preferences.showContacts) visible.push('zoho-crm-contacts');
    if (preferences.showDeals) visible.push('zoho-crm-deals');
    if (preferences.showLeads) visible.push('zoho-crm-leads');
  }

  const zohoPeople = statuses.zohoPeople;
  if (zohoPeople?.connected) {
    const preferences =
      zohoPeople.preferences ?? DEFAULT_ZOHO_PEOPLE_PREFERENCES;
    if (preferences.showEmployees) visible.push('zoho-people-employees');
    if (preferences.showLeave) visible.push('zoho-people-leave');
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
  if (statuses.monday?.connected) {
    routes.push({ provider: 'MONDAY', route: '/integrations/monday', label: 'Monday.com' });
  }
  if (statuses.clickup?.connected) {
    routes.push({ provider: 'CLICKUP', route: '/integrations/clickup', label: 'ClickUp' });
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
  if (statuses.teams?.connected) {
    routes.push({
      provider: 'MICROSOFT_TEAMS',
      route: '/integrations/teams',
      label: 'Teams',
    });
  }
  if (statuses.dropbox?.connected) {
    routes.push({ provider: 'DROPBOX', route: '/integrations/dropbox', label: 'Dropbox' });
  }
  if (statuses.box?.connected) {
    routes.push({ provider: 'BOX', route: '/integrations/box', label: 'Box' });
  }
  if (statuses.onedrive?.connected) {
    routes.push({
      provider: 'ONEDRIVE',
      route: '/integrations/onedrive',
      label: 'OneDrive',
    });
  }
  if (statuses.sharepoint?.connected) {
    routes.push({
      provider: 'SHAREPOINT',
      route: '/integrations/sharepoint',
      label: 'SharePoint',
    });
  }
  if (statuses.hubspot?.connected) {
    routes.push({ provider: 'HUBSPOT', route: '/integrations/hubspot', label: 'HubSpot' });
  }
  if (statuses.salesforce?.connected) {
    routes.push({
      provider: 'SALESFORCE',
      route: '/integrations/salesforce',
      label: 'Salesforce',
    });
  }
  if (statuses.dynamics?.connected) {
    routes.push({
      provider: 'DYNAMICS_365',
      route: '/integrations/dynamics',
      label: 'Dynamics 365',
    });
  }
  if (statuses.zohoCrm?.connected) {
    routes.push({
      provider: 'ZOHO_CRM',
      route: '/integrations/zoho-crm',
      label: 'Zoho CRM',
    });
  }
  if (statuses.zohoPeople?.connected) {
    routes.push({
      provider: 'ZOHO_PEOPLE',
      route: '/integrations/zoho-people',
      label: 'Zoho People',
    });
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

/** Full-width on integration detail pages (and default for shared lists). */
export const INTEGRATION_FULL_WIDTH_WIDGETS = new Set<DashboardWidgetId>([
  'slack-messenger',
  'google-chat',
  'trello-boards',
  'dropbox-files',
  'box-files',
  'onedrive-files',
  'sharepoint-sites',
  'asana-projects',
  'monday-boards',
  'clickup-lists',
  'hubspot-tickets',
]);

/** Full-width on the main dashboard only (half-width widgets omitted). */
export const DASHBOARD_FULL_WIDTH_WIDGETS = new Set<DashboardWidgetId>([
  'slack-messenger',
  'google-chat',
  'trello-boards',
  'dropbox-files',
  'box-files',
  'asana-projects',
  'monday-boards',
  'clickup-lists',
]);
