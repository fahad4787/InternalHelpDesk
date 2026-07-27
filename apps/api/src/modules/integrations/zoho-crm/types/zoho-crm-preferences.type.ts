export interface ZohoCrmPreferences {
  showContacts: boolean;
  showDeals: boolean;
  showLeads: boolean;
}

export const DEFAULT_ZOHO_CRM_PREFERENCES: ZohoCrmPreferences = {
  showContacts: true,
  showDeals: true,
  showLeads: true,
};

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
