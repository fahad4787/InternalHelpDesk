export const WORKDAY_INTEGRATION_TYPE = 'WORKDAY';

export const WORKDAY_ENVIRONMENTS = ['SANDBOX', 'PRODUCTION'] as const;

export const WORKDAY_MODE = {
  MOCK: 'mock',
  LIVE: 'live',
} as const;

export const WORKDAY_ERRORS = {
  NOT_CONFIGURED: 'Real Workday API is not configured yet',
  CONNECTION_FAILED: 'Workday connection test failed',
  SYNC_FAILED: 'Workday sync failed',
} as const;

export const WORKDAY_STATUS_LABELS: Record<string, string> = {
  NOT_CONNECTED: 'Not Connected',
  CONNECTED: 'Connected',
  ERROR: 'Error',
};
