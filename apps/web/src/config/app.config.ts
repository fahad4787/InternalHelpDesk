export const appConfig = {
  name: 'AI Internal Helpdesk',
  description: 'AI-powered internal support for your organization',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
} as const;
