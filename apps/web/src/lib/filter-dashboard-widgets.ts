import {
  DASHBOARD_WIDGET_DEFINITIONS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';

const PROVIDER_SEARCH_ALIASES: Record<string, string[]> = {
  GOOGLE_CALENDAR: ['google', 'gmail', 'meet', 'drive', 'calendar', 'chat'],
  JIRA: ['jira', 'atlassian', 'issues'],
  TRELLO: ['trello', 'boards'],
  ASANA: ['asana'],
  MONDAY: ['monday', 'monday.com'],
  CLICKUP: ['clickup'],
  CALENDLY: ['calendly'],
  SLACK: ['slack'],
  ZOOM: ['zoom'],
  OUTLOOK: ['outlook', 'microsoft', 'email', 'mail'],
  MICROSOFT_TEAMS: ['teams', 'microsoft'],
  DROPBOX: ['dropbox'],
  BOX: ['box'],
  ONEDRIVE: ['onedrive', 'one drive', 'microsoft'],
  SHAREPOINT: ['sharepoint', 'microsoft'],
  HUBSPOT: ['hubspot', 'crm'],
  SALESFORCE: ['salesforce', 'crm'],
  DYNAMICS_365: ['dynamics', 'dynamics 365', 'd365', 'crm'],
  ZOHO_CRM: ['zoho', 'zoho crm', 'crm'],
  ZOHO_PEOPLE: ['zoho', 'zoho people', 'hr'],
  WORKDAY: ['workday', 'hr'],
};

/** Filter Home widgets by label, provider, id, or common aliases. */
export function filterDashboardWidgetsBySearch(
  widgetIds: DashboardWidgetId[],
  searchQuery: string,
): DashboardWidgetId[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return widgetIds;

  return widgetIds.filter((widgetId) => {
    const definition = DASHBOARD_WIDGET_DEFINITIONS[widgetId];
    if (!definition) return false;

    const haystack = [
      definition.label,
      definition.provider,
      widgetId,
      definition.configureRoute,
      ...(PROVIDER_SEARCH_ALIASES[definition.provider] ?? []),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}
