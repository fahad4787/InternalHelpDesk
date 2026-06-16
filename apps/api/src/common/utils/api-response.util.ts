import { ApiResponse, PaginationMeta } from '../types/api-response.type';

export function successResponse<T>(
  data: T,
  message = 'Success',
  meta?: PaginationMeta,
): ApiResponse<T> {
  return { success: true, message, data, ...(meta && { meta }) };
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): { data: T[]; meta: PaginationMeta } {
  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
