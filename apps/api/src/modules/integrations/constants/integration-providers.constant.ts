import { IntegrationProvider } from '@prisma/client';

export const INTEGRATION_PROVIDERS = [
  {
    provider: IntegrationProvider.GOOGLE_CALENDAR,
    name: 'Google',
    description: 'Calendar, Google Meet, Drive, Gmail, and Chat from your linked Google account',
    category: 'google',
  },
  {
    provider: IntegrationProvider.WORKDAY,
    name: 'Workday',
    description: 'Sync help articles and SOPs from Workday',
    category: 'hr',
  },
  {
    provider: IntegrationProvider.JIRA,
    name: 'Jira',
    description: 'Sync tickets with Jira issues',
    category: 'project-management',
  },
  {
    provider: IntegrationProvider.TRELLO,
    name: 'Trello',
    description: 'Boards and cards from your linked Trello account',
    category: 'project-management',
  },
  {
    provider: IntegrationProvider.CALENDLY,
    name: 'Calendly',
    description: 'Event types and upcoming meetings from your Calendly account',
    category: 'calendar',
  },
  {
    provider: IntegrationProvider.SLACK,
    name: 'Slack',
    description: 'Connect Slack for notifications and chatbot access',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.ZOOM,
    name: 'Zoom',
    description: 'Profile, calendar, and meetings from your linked Zoom account',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.MICROSOFT_TEAMS,
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams channels',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.OUTLOOK,
    name: 'Outlook',
    description: 'Inbox and email from your linked Microsoft account',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.DROPBOX,
    name: 'Dropbox',
    description: 'Files and folders from your linked Dropbox account',
    category: 'productivity',
  },
  {
    provider: IntegrationProvider.SERVICENOW,
    name: 'ServiceNow',
    description: 'Connect with ServiceNow incidents',
    category: 'itsm',
  },
] as const;
