export interface HubSpotPreferences {
  showContacts: boolean;
  showDeals: boolean;
  showTickets: boolean;
}

export const DEFAULT_HUBSPOT_PREFERENCES: HubSpotPreferences = {
  showContacts: true,
  showDeals: true,
  showTickets: true,
};

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
