import { SlackChannel } from '../types/slack-channel.type';

export const MOCK_SLACK_CHANNELS: SlackChannel[] = [
  { id: 'C001', name: 'general', memberCount: 42, isPrivate: false },
  { id: 'C002', name: 'it-support', memberCount: 12, isPrivate: false },
  { id: 'C003', name: 'hr-updates', memberCount: 28, isPrivate: false },
  { id: 'C004', name: 'helpdesk-alerts', memberCount: 8, isPrivate: true },
];
