'use client';

import { lazy, type ComponentType } from 'react';
import type { DashboardWidgetId } from '@/constants/dashboard-widget-registry';

function lazyNamed(
  loader: () => Promise<Record<string, ComponentType>>,
  exportName: string,
): ComponentType {
  return lazy(async () => {
    const mod = await loader();
    const Component = mod[exportName];
    if (!Component) {
      throw new Error(`Dashboard widget export missing: ${exportName}`);
    }
    return { default: Component };
  });
}

/**
 * Lazy widget map — Home only downloads chunks for widgets that are actually visible.
 */
export const LAZY_DASHBOARD_WIDGET_COMPONENTS: Record<DashboardWidgetId, ComponentType> = {
  'google-meet': lazyNamed(
    () => import('@/components/dashboard/widgets/google-dashboard-widgets'),
    'GoogleMeetDashboardWidget',
  ),
  'google-calendar': lazyNamed(
    () => import('@/components/dashboard/widgets/google-dashboard-widgets'),
    'GoogleCalendarEmbedDashboardWidget',
  ),
  'google-drive': lazyNamed(
    () => import('@/components/dashboard/widgets/google-dashboard-widgets'),
    'GoogleDriveDashboardWidget',
  ),
  'google-gmail': lazyNamed(
    () => import('@/components/dashboard/widgets/google-dashboard-widgets'),
    'GoogleGmailDashboardWidget',
  ),
  'google-chat': lazyNamed(
    () => import('@/components/dashboard/widgets/google-dashboard-widgets'),
    'GoogleChatDashboardWidget',
  ),
  'jira-assigned': lazyNamed(
    () => import('@/components/dashboard/widgets/jira-dashboard-widgets'),
    'JiraAssignedDashboardWidget',
  ),
  'jira-reported': lazyNamed(
    () => import('@/components/dashboard/widgets/jira-dashboard-widgets'),
    'JiraReportedDashboardWidget',
  ),
  'jira-projects': lazyNamed(
    () => import('@/components/dashboard/widgets/jira-dashboard-widgets'),
    'JiraProjectsDashboardWidget',
  ),
  'trello-boards': lazyNamed(
    () => import('@/components/dashboard/widgets/trello-dashboard-widgets'),
    'TrelloBoardsDashboardWidget',
  ),
  'asana-projects': lazyNamed(
    () => import('@/components/dashboard/widgets/asana-dashboard-widgets'),
    'AsanaProjectsDashboardWidget',
  ),
  'monday-boards': lazyNamed(
    () => import('@/components/dashboard/widgets/monday-dashboard-widgets'),
    'MondayBoardsDashboardWidget',
  ),
  'clickup-lists': lazyNamed(
    () => import('@/components/dashboard/widgets/clickup-dashboard-widgets'),
    'ClickUpListsDashboardWidget',
  ),
  'calendly-event-types': lazyNamed(
    () => import('@/components/dashboard/widgets/calendly-dashboard-widgets'),
    'CalendlyEventTypesDashboardWidget',
  ),
  'calendly-events': lazyNamed(
    () => import('@/components/dashboard/widgets/calendly-dashboard-widgets'),
    'CalendlyUpcomingEventsDashboardWidget',
  ),
  'slack-profile': lazyNamed(
    () => import('@/components/dashboard/widgets/slack-dashboard-widgets'),
    'SlackProfileDashboardWidget',
  ),
  'slack-messenger': lazyNamed(
    () => import('@/components/dashboard/widgets/slack-dashboard-widgets'),
    'SlackMessengerDashboardWidget',
  ),
  'zoom-profile': lazyNamed(
    () => import('@/components/dashboard/widgets/zoom-dashboard-widgets'),
    'ZoomProfileDashboardWidget',
  ),
  'zoom-calendar': lazyNamed(
    () => import('@/components/dashboard/widgets/zoom-dashboard-widgets'),
    'ZoomCalendarDashboardWidget',
  ),
  'zoom-meetings': lazyNamed(
    () => import('@/components/dashboard/widgets/zoom-dashboard-widgets'),
    'ZoomMeetingsDashboardWidget',
  ),
  'outlook-calendar': lazyNamed(
    () => import('@/components/dashboard/widgets/outlook-dashboard-widgets'),
    'OutlookCalendarDashboardWidget',
  ),
  'outlook-inbox': lazyNamed(
    () => import('@/components/dashboard/widgets/outlook-dashboard-widgets'),
    'OutlookInboxDashboardWidget',
  ),
  'teams-joined': lazyNamed(
    () => import('@/components/dashboard/widgets/teams-dashboard-widgets'),
    'TeamsJoinedDashboardWidget',
  ),
  'teams-chats': lazyNamed(
    () => import('@/components/dashboard/widgets/teams-dashboard-widgets'),
    'TeamsChatsDashboardWidget',
  ),
  'dropbox-files': lazyNamed(
    () => import('@/components/dashboard/widgets/dropbox-dashboard-widgets'),
    'DropboxFilesDashboardWidget',
  ),
  'box-files': lazyNamed(
    () => import('@/components/dashboard/widgets/box-dashboard-widgets'),
    'BoxFilesDashboardWidget',
  ),
  'onedrive-files': lazyNamed(
    () => import('@/components/dashboard/widgets/onedrive-dashboard-widgets'),
    'OneDriveFilesDashboardWidget',
  ),
  'sharepoint-sites': lazyNamed(
    () => import('@/components/dashboard/widgets/sharepoint-dashboard-widgets'),
    'SharePointSitesDashboardWidget',
  ),
  'hubspot-contacts': lazyNamed(
    () => import('@/components/dashboard/widgets/hubspot-dashboard-widgets'),
    'HubSpotContactsDashboardWidget',
  ),
  'hubspot-deals': lazyNamed(
    () => import('@/components/dashboard/widgets/hubspot-dashboard-widgets'),
    'HubSpotDealsDashboardWidget',
  ),
  'hubspot-tickets': lazyNamed(
    () => import('@/components/dashboard/widgets/hubspot-dashboard-widgets'),
    'HubSpotTicketsDashboardWidget',
  ),
  'salesforce-contacts': lazyNamed(
    () => import('@/components/dashboard/widgets/salesforce-dashboard-widgets'),
    'SalesforceContactsDashboardWidget',
  ),
  'salesforce-accounts': lazyNamed(
    () => import('@/components/dashboard/widgets/salesforce-dashboard-widgets'),
    'SalesforceAccountsDashboardWidget',
  ),
  'salesforce-opportunities': lazyNamed(
    () => import('@/components/dashboard/widgets/salesforce-dashboard-widgets'),
    'SalesforceOpportunitiesDashboardWidget',
  ),
  'dynamics-contacts': lazyNamed(
    () => import('@/components/dashboard/widgets/dynamics-dashboard-widgets'),
    'DynamicsContactsDashboardWidget',
  ),
  'dynamics-accounts': lazyNamed(
    () => import('@/components/dashboard/widgets/dynamics-dashboard-widgets'),
    'DynamicsAccountsDashboardWidget',
  ),
  'dynamics-opportunities': lazyNamed(
    () => import('@/components/dashboard/widgets/dynamics-dashboard-widgets'),
    'DynamicsOpportunitiesDashboardWidget',
  ),
  'zoho-crm-contacts': lazyNamed(
    () => import('@/components/dashboard/widgets/zoho-crm-dashboard-widgets'),
    'ZohoCrmContactsDashboardWidget',
  ),
  'zoho-crm-deals': lazyNamed(
    () => import('@/components/dashboard/widgets/zoho-crm-dashboard-widgets'),
    'ZohoCrmDealsDashboardWidget',
  ),
  'zoho-crm-leads': lazyNamed(
    () => import('@/components/dashboard/widgets/zoho-crm-dashboard-widgets'),
    'ZohoCrmLeadsDashboardWidget',
  ),
  'zoho-people-employees': lazyNamed(
    () => import('@/components/dashboard/widgets/zoho-people-dashboard-widgets'),
    'ZohoPeopleEmployeesDashboardWidget',
  ),
  'zoho-people-leave': lazyNamed(
    () => import('@/components/dashboard/widgets/zoho-people-dashboard-widgets'),
    'ZohoPeopleLeaveDashboardWidget',
  ),
  'workday-articles': lazyNamed(
    () => import('@/components/dashboard/widgets/workday-dashboard-widget'),
    'WorkdayDashboardWidget',
  ),
};
