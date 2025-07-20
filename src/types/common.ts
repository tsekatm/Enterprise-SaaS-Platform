/**
 * Common types used across the system
 */

/**
 * Search parameters for search operations
 */
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
  sort?: SortParams;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * API error response
 */
export interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: ErrorDetail[];
}

/**
 * Error detail
 */
export interface ErrorDetail {
  field?: string;
  error: string;
}