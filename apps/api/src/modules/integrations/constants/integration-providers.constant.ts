import { IntegrationProvider } from '@prisma/client';

export const INTEGRATION_PROVIDERS = [
  {
    provider: IntegrationProvider.GOOGLE_CALENDAR,
    name: 'Google',
    description: 'Calendar, Google Meet, and Drive from your linked Google account',
    category: 'google',
  },
  {
    provider: IntegrationProvider.ZOOM,
    name: 'Zoom',
    description: 'Profile, calendar, and meetings from your linked Zoom account',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.WORKDAY,
    name: 'Workday',
    description: 'Sync help articles and SOPs from Workday',
    category: 'hr',
  },
  {
    provider: IntegrationProvider.SLACK,
    name: 'Slack',
    description: 'Connect Slack for notifications and chatbot access',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.MICROSOFT_TEAMS,
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams channels',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.GOOGLE_MEET,
    name: 'Google Meet',
    description: 'Schedule meetings from tickets',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.GMAIL,
    name: 'Gmail',
    description: 'Send and receive emails for tickets',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.OUTLOOK,
    name: 'Outlook',
    description: 'Integrate with Outlook email',
    category: 'communication',
  },
  {
    provider: IntegrationProvider.JIRA,
    name: 'Jira',
    description: 'Sync tickets with Jira issues',
    category: 'project-management',
  },
  {
    provider: IntegrationProvider.SERVICENOW,
    name: 'ServiceNow',
    description: 'Connect with ServiceNow incidents',
    category: 'itsm',
  },
] as const;
