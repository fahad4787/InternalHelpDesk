import { TeamsMessage } from '../types/teams-channel.type';

const now = Date.now();

export const MOCK_TEAMS_MESSAGES: Record<string, TeamsMessage[]> = {
  'T001:CH001': [
    {
      id: 'tm1',
      text: 'Welcome to the Engineering General channel.',
      userId: 'U001',
      userName: 'Programmer DevOps',
      timestamp: new Date(now - 3600000).toISOString(),
    },
    {
      id: 'tm2',
      text: 'Sprint planning is scheduled for tomorrow at 10 AM.',
      userId: 'U002',
      userName: 'Team Lead',
      timestamp: new Date(now - 1800000).toISOString(),
    },
  ],
  'T001:CH002': [
    {
      id: 'tm3',
      text: 'VPN access restored for floor 3.',
      userId: 'U003',
      userName: 'IT Support',
      timestamp: new Date(now - 7200000).toISOString(),
    },
  ],
  'T002:CH003': [
    {
      id: 'tm4',
      text: 'Holiday schedule posted for next month.',
      userId: 'U004',
      userName: 'HR Updates',
      timestamp: new Date(now - 5400000).toISOString(),
    },
  ],
  'T003:CH004': [
    {
      id: 'tm5',
      text: 'New urgent ticket assigned to IT queue.',
      userId: 'U005',
      userName: 'Helpdesk Bot',
      timestamp: new Date(now - 600000).toISOString(),
    },
  ],
};

export function getMockMessagesForChannel(
  teamId: string,
  channelId: string,
): TeamsMessage[] {
  return (
    MOCK_TEAMS_MESSAGES[`${teamId}:${channelId}`] ?? [
      {
        id: 'mock-empty',
        text: 'No messages in this channel yet.',
        userId: null,
        userName: 'System',
        timestamp: new Date().toISOString(),
      },
    ]
  );
}
