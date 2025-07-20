import { IService, ValidationResult } from '../IService';
import { PaginatedResponse, PaginationParams } from '../IRepository';
import { SearchParams } from '../../types/common';
import { Account } from '../../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../../models/dto/AccountDto';
import { AccountRelationships } from '../../models/AccountRelationship';
import { AccountFilters } from './IAccountRepository';

/**
 * Account data export format for GDPR compliance
 */
export interface AccountDataExport {
  account: Account;
  relationships: AccountRelationships;
  auditTrail: any[];
  exportDate: Date;
  exportedBy: string;
}

/**
 * Account service interface
 * Implements business logic for account management operations
 */
export interface IAccountService extends IService<Account, AccountCreateDto, AccountUpdateDto> {
  /**
   * Get accounts with filtering and pagination
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts
   */
  getAccounts(filters: AccountFilters, pagination: PaginationParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Get account by ID
   * @param id Account ID
   * @returns Account if found
   * @throws Error if account not found or user doesn't have permission
   */
  getAccountById(id: string): Promise<Account>;
  
  /**
   * Create a new account
   * @param account Account creation DTO
   * @param userId ID of the user creating the account
   * @returns Created account
   * @throws Error if validation fails or user doesn't have permission
   */
  createAccount(account: AccountCreateDto, userId: string): Promise<Account>;
  
  /**
   * Update an existing account
   * @param id Account ID
   * @param account Account update DTO
   * @param userId ID of the user updating the account
   * @returns Updated account
   * @throws Error if validation fails, account not found, or user doesn't have permission
   */
  updateAccount(id: string, account: AccountUpdateDto, userId: string): Promise<Account>;
  
  /**
   * Delete an account
   * @param id Account ID
   * @param userId ID of the user deleting the account
   * @returns void
   * @throws Error if account not found, has dependencies, or user doesn't have permission
   */
  deleteAccount(id: string, userId: string): Promise<void>;
  
  /**
   * Search accounts with the given parameters
   * @param searchParams Search parameters including query string, filters, pagination, and sorting
   * @returns Paginated list of accounts matching the search criteria
   */
  searchAccounts(searchParams: SearchParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Get relationships for an account
   * @param id Account ID
   * @returns Object containing parent and child relationships
   * @throws Error if account not found or user doesn't have permission
   */
  getAccountRelationships(id: string): Promise<AccountRelationships>;
  
  /**
   * Update relationships for an account
   * @param id Account ID
   * @param relationships DTO containing relationships to add and remove
   * @param userId ID of the user updating the relationships
   * @returns Updated account relationships
   * @throws Error if account not found, validation fails, or user doesn't have permission
   */
  updateAccountRelationships(id: string, relationships: RelationshipUpdateDto, userId: string): Promise<AccountRelationships>;
  
  /**
   * Validate account data
   * @param account Account DTO to validate
   * @returns Validation result with errors if any
   */
  validateAccountData(account: AccountCreateDto | AccountUpdateDto): ValidationResult;
  
  /**
   * Check for circular relationships
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if adding the relationship would create a circular reference
   */
  checkCircularRelationships(parentId: string, childId: string): boolean;
  
  /**
   * Get child accounts for a parent account
   * @param parentId Parent account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of child accounts
   * @throws Error if account not found or user doesn't have permission
   */
  getChildAccounts(parentId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Get parent accounts for a child account
   * @param childId Child account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of parent accounts
   * @throws Error if account not found or user doesn't have permission
   */
  getParentAccounts(childId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>>;
  
  /**
   * Get account activity history
   * @param id Account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of activity records
   * @throws Error if account not found or user doesn't have permission
   */
  getAccountActivity(id: string, pagination?: PaginationParams): Promise<PaginatedResponse<ActivityRecord>>;
  
  /**
   * Check if a user has permission to perform an action on an account
   * @param userId User ID
   * @param accountId Account ID
   * @param action Action to check (view, edit, delete)
   * @returns True if user has permission, false otherwise
   */
  hasPermission(userId: string, accountId: string, action: 'view' | 'edit' | 'delete'): Promise<boolean>;
  
  /**
   * Export all data related to an account for GDPR compliance
   * @param id Account ID
   * @param userId ID of the user requesting the export
   * @returns Complete account data export including relationships and audit trail
   * @throws Error if account not found or user doesn't have permission
   */
  exportAccountData(id: string, userId: string): Promise<AccountDataExport>;
  
  /**
   * Completely remove all data related to an account for GDPR compliance
   * This is different from regular deletion as it removes all traces including audit logs
   * @param id Account ID
   * @param userId ID of the user requesting the removal
   * @returns Promise that resolves when all data is removed
   * @throws Error if account not found or user doesn't have permission
   */
  completelyRemoveAccountData(id: string, userId: string): Promise<void>;
}

/**
 * Account activity record
 */
export interface ActivityRecord {
  id: string;
  accountId: string;
  userId: string;
  userName: string;
  action: string;
  details: any;
  timestamp: Date;
}