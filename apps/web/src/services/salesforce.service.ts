import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface SalesforcePreferences {
  showContacts: boolean;
  showAccounts: boolean;
  showOpportunities: boolean;
}

export interface SalesforceStatus {
  connected: boolean;
  status: string;
  salesforceEmail: string | null;
  instanceUrl: string | null;
  lastSyncedAt: string | null;
  preferences: SalesforcePreferences;
}

export interface SalesforceContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface SalesforceAccount {
  id: string;
  name: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface SalesforceOpportunity {
  id: string;
  name: string;
  amount: number | null;
  stageName: string | null;
  closeDate: string | null;
  probability: number | null;
  updatedAt: string;
  webUrl: string | null;
}

export const DEFAULT_SALESFORCE_PREFERENCES: SalesforcePreferences = {
  showContacts: true,
  showAccounts: true,
  showOpportunities: true,
};

export const salesforceService = {
  getStatus: () => apiGet<SalesforceStatus>('/integrations/salesforce/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/salesforce/auth-url'),

  disconnect: () => apiPost('/integrations/salesforce/disconnect'),

  getContacts: () =>
    apiGet<{ connected: boolean; contacts: SalesforceContact[] }>(
      '/integrations/salesforce/contacts',
    ),

  getAccounts: () =>
    apiGet<{ connected: boolean; accounts: SalesforceAccount[] }>(
      '/integrations/salesforce/accounts',
    ),

  getOpportunities: () =>
    apiGet<{ connected: boolean; opportunities: SalesforceOpportunity[] }>(
      '/integrations/salesforce/opportunities',
    ),

  updatePreferences: (preferences: SalesforcePreferences) =>
    apiPatch<SalesforcePreferences>(
      '/integrations/salesforce/preferences',
      preferences,
    ),
};
