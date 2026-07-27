import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface ZohoPeoplePreferences {
  showEmployees: boolean;
  showLeave: boolean;
}

export interface ZohoPeopleStatus {
  connected: boolean;
  status: string;
  zohoEmail: string | null;
  apiDomain: string | null;
  lastSyncedAt: string | null;
  preferences: ZohoPeoplePreferences;
}

export interface ZohoPeopleEmployee {
  id: string;
  name: string;
  email: string | null;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  webUrl: string | null;
}

export interface ZohoPeopleLeave {
  id: string;
  employeeName: string;
  leaveType: string | null;
  fromDate: string | null;
  toDate: string | null;
  days: string | null;
  approvalStatus: string | null;
  webUrl: string | null;
}

export const DEFAULT_ZOHO_PEOPLE_PREFERENCES: ZohoPeoplePreferences = {
  showEmployees: true,
  showLeave: true,
};

export const zohoPeopleService = {
  getStatus: () =>
    apiGet<ZohoPeopleStatus>('/integrations/zoho-people/status'),

  getAuthUrl: () =>
    apiGet<{ url: string }>('/integrations/zoho-people/auth-url'),

  disconnect: () => apiPost('/integrations/zoho-people/disconnect'),

  getEmployees: () =>
    apiGet<{ connected: boolean; employees: ZohoPeopleEmployee[] }>(
      '/integrations/zoho-people/employees',
    ),

  getLeave: () =>
    apiGet<{ connected: boolean; leave: ZohoPeopleLeave[] }>(
      '/integrations/zoho-people/leave',
    ),

  updatePreferences: (preferences: ZohoPeoplePreferences) =>
    apiPatch<ZohoPeoplePreferences>(
      '/integrations/zoho-people/preferences',
      preferences,
    ),
};
