import { Account, AccountStatus, AccountType } from '../../models/Account';
import { Address } from '../../models/Address';

export interface AccountListItem {
  id: string;
  name: string;
  industry: string;
  type: AccountType;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountFilters {
  name?: string;
  industry?: string;
  type?: AccountType;
  status?: AccountStatus;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface SortOption {
  field: keyof AccountListItem;
  direction: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AccountListProps {
  initialFilters?: AccountFilters;
  initialSort?: SortOption;
  initialPagination?: PaginationParams;
}