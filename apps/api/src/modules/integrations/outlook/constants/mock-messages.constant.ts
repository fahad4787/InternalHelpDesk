export const MOCK_OUTLOOK_MESSAGES = [
  {
    id: 'mock-outlook-1',
    conversationId: 'mock-conversation-1',
    subject: 'Q2 Planning Sync — Action Items',
    from: 'Sarah Chen',
    fromEmail: 'sarah.chen@company.com',
    snippet:
      'Hi team, following up on yesterday\'s planning session. Please review the attached agenda...',
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isUnread: true,
    webViewLink: 'https://outlook.office.com/mail/inbox',
  },
  {
    id: 'mock-outlook-2',
    conversationId: 'mock-conversation-2',
    subject: 'Your expense report was approved',
    from: 'Finance Team',
    fromEmail: 'finance@company.com',
    snippet:
      'Your expense report #EXP-2041 has been approved and will be processed in the next payroll cycle.',
    receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isUnread: false,
    webViewLink: 'https://outlook.office.com/mail/inbox',
  },
  {
    id: 'mock-outlook-3',
    conversationId: 'mock-conversation-3',
    subject: 'Welcome to the Internal Helpdesk',
    from: 'IT Support',
    fromEmail: 'it-support@company.com',
    snippet:
      'Your account is ready. Here is how to get started with documents, chat, and integrations.',
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isUnread: false,
    webViewLink: 'https://outlook.office.com/mail/inbox',
  },
];
