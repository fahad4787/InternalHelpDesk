import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface DynamicsPreferences {
  showContacts: boolean;
  showAccounts: boolean;
  showOpportunities: boolean;
}

export interface DynamicsStatus {
  connected: boolean;
  status: string;
  dynamicsEmail: string | null;
  orgUrl: string | null;
  lastSyncedAt: string | null;
  preferences: DynamicsPreferences;
}

export interface DynamicsContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface DynamicsAccount {
  id: string;
  name: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface DynamicsOpportunity {
  id: string;
  name: string;
  estimatedValue: number | null;
  closeProbability: number | null;
  estimatedCloseDate: string | null;
  statusCode: number | null;
  updatedAt: string;
  webUrl: string | null;
}

export const DEFAULT_DYNAMICS_PREFERENCES: DynamicsPreferences = {
  showContacts: true,
  showAccounts: true,
  showOpportunities: true,
};

export const dynamicsService = {
  getStatus: () => apiGet<DynamicsStatus>('/integrations/dynamics/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/dynamics/auth-url'),

  disconnect: () => apiPost('/integrations/dynamics/disconnect'),

  getContacts: () =>
    apiGet<{ connected: boolean; contacts: DynamicsContact[] }>(
      '/integrations/dynamics/contacts',
    ),

  getAccounts: () =>
    apiGet<{ connected: boolean; accounts: DynamicsAccount[] }>(
      '/integrations/dynamics/accounts',
    ),

  getOpportunities: () =>
    apiGet<{ connected: boolean; opportunities: DynamicsOpportunity[] }>(
      '/integrations/dynamics/opportunities',
    ),

  updatePreferences: (preferences: DynamicsPreferences) =>
    apiPatch<DynamicsPreferences>(
      '/integrations/dynamics/preferences',
      preferences,
    ),
};
