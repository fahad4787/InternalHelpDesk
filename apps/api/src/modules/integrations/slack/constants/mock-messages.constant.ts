import { SlackMessage } from '../types/slack-channel.type';

const now = Date.now();

export const MOCK_SLACK_MESSAGES: Record<string, SlackMessage[]> = {
  C001: [
    {
      id: 'm1',
      text: 'Welcome to the team channel!',
      userId: 'U001',
      userName: 'Programmer DevOps',
      timestamp: new Date(now - 3600000).toISOString(),
    },
    {
      id: 'm2',
      text: 'Please review the updated onboarding guide.',
      userId: 'U002',
      userName: 'HR Bot',
      timestamp: new Date(now - 1800000).toISOString(),
    },
  ],
  C002: [
    {
      id: 'm3',
      text: 'VPN issue resolved for floor 3.',
      userId: 'U003',
      userName: 'IT Support',
      timestamp: new Date(now - 7200000).toISOString(),
    },
    {
      id: 'm4',
      text: 'Laptop request ticket #1042 is in progress.',
      userId: 'U001',
      userName: 'Programmer DevOps',
      timestamp: new Date(now - 900000).toISOString(),
    },
  ],
  C003: [
    {
      id: 'm5',
      text: 'Holiday schedule posted for next month.',
      userId: 'U004',
      userName: 'HR Updates',
      timestamp: new Date(now - 5400000).toISOString(),
    },
  ],
  C004: [
    {
      id: 'm6',
      text: 'New urgent ticket assigned to IT queue.',
      userId: 'U005',
      userName: 'Helpdesk Bot',
      timestamp: new Date(now - 600000).toISOString(),
    },
  ],
  D001: [
    {
      id: 'm7',
      text: 'Hey, can you review the deployment checklist?',
      userId: 'U006',
      userName: 'Arsal',
      timestamp: new Date(now - 2400000).toISOString(),
    },
  ],
};

export function getMockMessagesForChannel(channelId: string): SlackMessage[] {
  return MOCK_SLACK_MESSAGES[channelId] ?? [
    {
      id: 'mock-empty',
      text: 'No messages in this channel yet.',
      userId: null,
      userName: 'System',
      timestamp: new Date().toISOString(),
    },
  ];
}
