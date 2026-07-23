export interface DynamicsPreferences {
  showContacts: boolean;
  showAccounts: boolean;
  showOpportunities: boolean;
}

export const DEFAULT_DYNAMICS_PREFERENCES: DynamicsPreferences = {
  showContacts: true,
  showAccounts: true,
  showOpportunities: true,
};

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

export interface DynamicsProfile {
  email: string | null;
  dynamicsUserId: string | null;
}
