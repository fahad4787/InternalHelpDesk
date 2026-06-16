import { UserRole } from '@prisma/client';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.COMPANY_ADMIN]: 80,
  [UserRole.MANAGER]: 60,
  [UserRole.AGENT]: 40,
  [UserRole.EMPLOYEE]: 20,
};

export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
];

export const MANAGEMENT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.MANAGER,
];
