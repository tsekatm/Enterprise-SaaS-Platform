import { IRepository, PaginatedResponse, PaginationParams } from '../IRepository';
import { SearchParams } from '../../types/common';
import { Account } from '../../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../../models/dto/AccountDto';
import { AccountRelationships } from '../../models/AccountRelationship';

/**
 * Interface for filtering accounts
 */
export interface AccountFilters {
  name?: string;
  industry?: string;
  type?: string;
  status?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  minRevenue?: number;
  maxRevenue?: number;
  minEmployees?: number;
  maxEmployees?: number;
  [key: string]: any; // For custom fields
}

/**
 * Account repository interface
 * Handles data access operations for customer accounts
 */
export interface IAccountRepository extends IRepository<Account, AccountCreateDto, AccountUpdateDto> {
  /**
   * Search accounts with the given parameters
   * @param searchParams Search parameters including query string, filters, pagination, and sorting
   * @returns Paginated list of accounts matching the search criteria
   */
  search(searchParams: SearchParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Get relationships for an account
   * @param id Account ID
   * @returns Object containing parent and child relationships
   */
  getRelationships(id: string): Promise<AccountRelationships>;
  
  /**
   * Update relationships for an account
   * @param id Account ID
   * @param relationships DTO containing relationships to add and remove
   * @returns Updated account relationships
   */
  updateRelationships(id: string, relationships: RelationshipUpdateDto): Promise<AccountRelationships>;
  
  /**
   * Check if a relationship exists between two accounts
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if relationship exists, false otherwise
   */
  checkExistingRelationship(parentId: string, childId: string): Promise<boolean>;
  
  /**
   * Check if adding a relationship would create a circular reference
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if circular reference would be created, false otherwise
   */
  checkCircularRelationship(parentId: string, childId: string): Promise<boolean>;
  
  /**
   * Find accounts by specific field value
   * @param field Field name
   * @param value Field value
   * @param pagination Optional pagination parameters
   * @returns Paginated list of matching accounts
   */
  findByField(field: string, value: any, pagination?: PaginationParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Find accounts by tag
   * @param tag Tag to search for
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts with the specified tag
   */
  findByTag(tag: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Get child accounts for a parent account
   * @param parentId Parent account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of child accounts
   */
  getChildAccounts(parentId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Get parent accounts for a child account
   * @param childId Child account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of parent accounts
   */
  getParentAccounts(childId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>>;
}