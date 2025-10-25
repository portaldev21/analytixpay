/**
 * Pagination parameters
 */
export type TPaginationParams = {
  page?: number;
  limit?: number;
};

/**
 * Paginated result wrapper
 */
export type TPaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

/**
 * Calculate pagination metadata
 */
export function calculatePagination(params: {
  page: number;
  limit: number;
  total: number;
}): TPaginatedResult<never>["pagination"] {
  const { page, limit, total } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get pagination range for SQL queries
 * Returns { from, to } for use with Supabase .range()
 */
export function getPaginationRange(
  page: number,
  limit: number,
): {
  from: number;
  to: number;
} {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, to };
}

/**
 * Validate and normalize pagination params
 */
export function normalizePaginationParams(
  params: TPaginationParams = {},
): Required<TPaginationParams> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(Math.max(1, params.limit || 50), 100); // Max 100

  return { page, limit };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: Required<TPaginationParams>,
): TPaginatedResult<T> {
  return {
    data,
    pagination: calculatePagination({
      page: params.page,
      limit: params.limit,
      total,
    }),
  };
}
