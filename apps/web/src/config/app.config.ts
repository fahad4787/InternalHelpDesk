export const appConfig = {
  name: 'Workhub',
  tagline: 'Employee Experience',
  description: 'Your unified work command center across apps and integrations',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
} as const;
