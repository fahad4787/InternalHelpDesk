import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface ZohoCrmPreferences {
  showContacts: boolean;
  showDeals: boolean;
  showLeads: boolean;
}

export interface ZohoCrmStatus {
  connected: boolean;
  status: string;
  zohoEmail: string | null;
  apiDomain: string | null;
  lastSyncedAt: string | null;
  preferences: ZohoCrmPreferences;
}

export interface ZohoCrmContact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface ZohoCrmDeal {
  id: string;
  name: string;
  amount: string | null;
  stage: string | null;
  closingDate: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface ZohoCrmLead {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string | null;
  source: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export const DEFAULT_ZOHO_CRM_PREFERENCES: ZohoCrmPreferences = {
  showContacts: true,
  showDeals: true,
  showLeads: true,
};

export const zohoCrmService = {
  getStatus: () => apiGet<ZohoCrmStatus>('/integrations/zoho-crm/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/zoho-crm/auth-url'),

  disconnect: () => apiPost('/integrations/zoho-crm/disconnect'),

  getContacts: () =>
    apiGet<{ connected: boolean; contacts: ZohoCrmContact[] }>(
      '/integrations/zoho-crm/contacts',
    ),

  getDeals: () =>
    apiGet<{ connected: boolean; deals: ZohoCrmDeal[] }>(
      '/integrations/zoho-crm/deals',
    ),

  getLeads: () =>
    apiGet<{ connected: boolean; leads: ZohoCrmLead[] }>(
      '/integrations/zoho-crm/leads',
    ),

  updatePreferences: (preferences: ZohoCrmPreferences) =>
    apiPatch<ZohoCrmPreferences>(
      '/integrations/zoho-crm/preferences',
      preferences,
    ),
};
