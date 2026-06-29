import { TeamsChannel } from '../types/teams-channel.type';

export const MOCK_TEAMS_CHANNELS: TeamsChannel[] = [
  {
    id: 'CH001',
    name: 'General',
    teamId: 'T001',
    teamName: 'Engineering',
    memberCount: 24,
    isPrivate: false,
  },
  {
    id: 'CH002',
    name: 'IT Support',
    teamId: 'T001',
    teamName: 'Engineering',
    memberCount: 8,
    isPrivate: false,
  },
  {
    id: 'CH003',
    name: 'HR Updates',
    teamId: 'T002',
    teamName: 'People Operations',
    memberCount: 18,
    isPrivate: false,
  },
  {
    id: 'CH004',
    name: 'Helpdesk Alerts',
    teamId: 'T003',
    teamName: 'Operations',
    memberCount: 6,
    isPrivate: true,
  },
];
