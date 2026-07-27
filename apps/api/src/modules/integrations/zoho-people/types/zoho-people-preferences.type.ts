export interface ZohoPeoplePreferences {
  showEmployees: boolean;
  showLeave: boolean;
}

export const DEFAULT_ZOHO_PEOPLE_PREFERENCES: ZohoPeoplePreferences = {
  showEmployees: true,
  showLeave: true,
};

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
