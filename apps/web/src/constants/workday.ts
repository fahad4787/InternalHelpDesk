export const WORKDAY_ENVIRONMENTS = [
  { value: 'SANDBOX', label: 'Sandbox' },
  { value: 'PRODUCTION', label: 'Production' },
] as const;

export const SYNC_STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'secondary'> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  PARTIAL: 'warning',
  IN_PROGRESS: 'info',
};

export const CONNECTION_STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'secondary'> = {
  CONNECTED: 'success',
  NOT_CONNECTED: 'secondary',
  ERROR: 'danger',
};
