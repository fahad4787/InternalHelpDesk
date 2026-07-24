export interface SalesforcePreferences {
  showContacts: boolean;
  showAccounts: boolean;
  showOpportunities: boolean;
}

export const DEFAULT_SALESFORCE_PREFERENCES: SalesforcePreferences = {
  showContacts: true,
  showAccounts: true,
  showOpportunities: true,
};

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
