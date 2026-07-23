export const appConfig = {
  name: 'Workhub',
  tagline: 'Employee Experience',
  description: 'Your unified work command center across apps and integrations',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/api',
} as const;
