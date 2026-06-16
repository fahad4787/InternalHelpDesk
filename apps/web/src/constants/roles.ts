import { UserRole } from '@/types/api.types';

export const USER_ROLES: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  EMPLOYEE: 'Employee',
};

export const ROLE_OPTIONS = Object.entries(USER_ROLES).map(([value, label]) => ({
  value: value as UserRole,
  label,
}));
