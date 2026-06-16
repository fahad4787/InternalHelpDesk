export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
  firstName: string;
  lastName: string;
}
