import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface HubSpotPreferences {
  showContacts: boolean;
  showDeals: boolean;
  showTickets: boolean;
}

export interface HubSpotStatus {
  connected: boolean;
  status: string;
  hubspotEmail: string | null;
  hubDomain: string | null;
  hubspotPortalId: string | null;
  lastSyncedAt: string | null;
  preferences: HubSpotPreferences;
}

export interface HubSpotContact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  jobTitle: string | null;
  lifecycleStage: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface HubSpotDeal {
  id: string;
  name: string;
  amount: string | null;
  stage: string | null;
  pipeline: string | null;
  closeDate: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface HubSpotTicket {
  id: string;
  subject: string;
  stage: string | null;
  priority: string | null;
  pipeline: string | null;
  content: string | null;
  createdAt: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export const DEFAULT_HUBSPOT_PREFERENCES: HubSpotPreferences = {
  showContacts: true,
  showDeals: true,
  showTickets: true,
};

export const hubspotService = {
  getStatus: () => apiGet<HubSpotStatus>('/integrations/hubspot/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/hubspot/auth-url'),

  disconnect: () => apiPost('/integrations/hubspot/disconnect'),

  getContacts: () =>
    apiGet<{ connected: boolean; contacts: HubSpotContact[] }>(
      '/integrations/hubspot/contacts',
    ),

  getDeals: () =>
    apiGet<{ connected: boolean; deals: HubSpotDeal[] }>(
      '/integrations/hubspot/deals',
    ),

  getTickets: () =>
    apiGet<{ connected: boolean; tickets: HubSpotTicket[] }>(
      '/integrations/hubspot/tickets',
    ),

  updatePreferences: (preferences: HubSpotPreferences) =>
    apiPatch<HubSpotPreferences>(
      '/integrations/hubspot/preferences',
      preferences,
    ),
};
