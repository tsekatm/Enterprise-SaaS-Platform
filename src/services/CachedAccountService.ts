import { IAccountService, ActivityRecord } from '../interfaces/account/IAccountService';
import { AccountService } from './AccountService';
import { ICacheService } from '../interfaces/ICacheService';
import { PaginatedResponse, PaginationParams } from '../interfaces/IRepository';
import { SearchParams } from '../types/common';
import { Account } from '../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../models/dto/AccountDto';
import { AccountRelationships } from '../models/AccountRelationship';
import { ValidationResult } from '../interfaces/IService';
import { AccountFilters } from '../interfaces/account/IAccountRepository';

/**
 * Cache-enabled implementation of the Account service
 * Wraps the standard AccountService with caching functionality
 */
export class CachedAccountService implements IAccountService {
  private accountService: AccountService;
  private cacheService: ICacheService;
  
  // Cache TTL values in seconds
  private readonly ACCOUNT_CACHE_TTL = 300; // 5 minutes
  private readonly SEARCH_CACHE_TTL = 60; // 1 minute
  private readonly RELATIONSHIP_CACHE_TTL = 300; // 5 minutes
  
  /**
   * Constructor
   * @param accountService The underlying account service
   * @param cacheService The cache service to use
   */
  constructor(accountService: AccountService, cacheService: ICacheService) {
    this.accountService = accountService;
    this.cacheService = cacheService;
  }
  
  /**
   * Get accounts with filtering and pagination
   * Uses caching for frequently accessed queries
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts
   */
  async getAccounts(filters: AccountFilters, pagination: PaginationParams): Promise<PaginatedResponse<Account>> {
    // Create a cache key based on the filters and pagination
    const cacheKey = `accounts:list:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
    
    // Try to get from cache first
    const cachedResult = await this.cacheService.get<PaginatedResponse<Account>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // If not in cache, get from service
    const result = await this.accountService.getAccounts(filters, pagination);
    
    // Cache the result
    await this.cacheService.set(cacheKey, result, this.ACCOUNT_CACHE_TTL);
    
    return result;
  }
  
  /**
   * Get all entities with optional filtering and pagination
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts
   */
  async getAll(filters?: AccountFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    return this.getAccounts(filters || {}, pagination || { page: 1, pageSize: 10 });
  }
  
  /**
   * Get account by ID
   * Uses caching for individual account lookups
   * @param id Account ID
   * @returns Account if found
   */
  async getAccountById(id: string): Promise<Account> {
    return this.getById(id);
  }
  
  /**
   * Get entity by ID
   * Uses caching for individual account lookups
   * @param id Account ID
   * @returns Account if found
   */
  async getById(id: string): Promise<Account> {
    // Create a cache key for this account
    const cacheKey = `account:${id}`;
    
    // Try to get from cache first
    const cachedAccount = await this.cacheService.get<Account>(cacheKey);
    if (cachedAccount) {
      return cachedAccount;
    }
    
    // If not in cache, get from service
    const account = await this.accountService.getById(id);
    
    // Cache the result
    await this.cacheService.set(cacheKey, account, this.ACCOUNT_CACHE_TTL);
    
    return account;
  }
  
  /**
   * Create a new account
   * Invalidates relevant caches after creation
   * @param account Account creation DTO
   * @param userId ID of the user creating the account
   * @returns Created account
   */
  async createAccount(account: AccountCreateDto, userId: string): Promise<Account> {
    return this.create(account, userId);
  }
  
  /**
   * Create a new entity
   * Invalidates relevant caches after creation
   * @param dto Account creation DTO
   * @param userId ID of the user creating the account
   * @returns Created account
   */
  async create(dto: AccountCreateDto, userId: string): Promise<Account> {
    // Create the account
    const createdAccount = await this.accountService.create(dto, userId);
    
    // Invalidate list caches
    await this.invalidateListCaches();
    
    // Cache the new account
    const cacheKey = `account:${createdAccount.id}`;
    await this.cacheService.set(cacheKey, createdAccount, this.ACCOUNT_CACHE_TTL);
    
    return createdAccount;
  }
  
  /**
   * Update an existing account
   * Invalidates relevant caches after update
   * @param id Account ID
   * @param account Account update DTO
   * @param userId ID of the user updating the account
   * @returns Updated account
   */
  async updateAccount(id: string, account: AccountUpdateDto, userId: string): Promise<Account> {
    return this.update(id, account, userId);
  }
  
  /**
   * Update an existing entity
   * Invalidates relevant caches after update
   * @param id Account ID
   * @param dto Account update DTO
   * @param userId ID of the user updating the account
   * @returns Updated account
   */
  async update(id: string, dto: AccountUpdateDto, userId: string): Promise<Account> {
    // Update the account
    const updatedAccount = await this.accountService.update(id, dto, userId);
    
    // Invalidate account cache
    const accountCacheKey = `account:${id}`;
    await this.cacheService.delete(accountCacheKey);
    
    // Invalidate list caches
    await this.invalidateListCaches();
    
    // Invalidate relationship caches
    await this.cacheService.deleteByPattern(`account:${id}:relationships*`);
    
    // Cache the updated account
    await this.cacheService.set(accountCacheKey, updatedAccount, this.ACCOUNT_CACHE_TTL);
    
    return updatedAccount;
  }
  
  /**
   * Delete an account
   * Invalidates relevant caches after deletion
   * @param id Account ID
   * @param userId ID of the user deleting the account
   */
  async deleteAccount(id: string, userId: string): Promise<void> {
    return this.delete(id, userId);
  }
  
  /**
   * Delete an entity
   * Invalidates relevant caches after deletion
   * @param id Account ID
   * @param userId ID of the user deleting the account
   */
  async delete(id: string, userId: string): Promise<void> {
    // Delete the account
    await this.accountService.delete(id, userId);
    
    // Invalidate account cache
    const accountCacheKey = `account:${id}`;
    await this.cacheService.delete(accountCacheKey);
    
    // Invalidate list caches
    await this.invalidateListCaches();
    
    // Invalidate relationship caches
    await this.cacheService.deleteByPattern(`account:${id}:relationships*`);
    await this.cacheService.deleteByPattern(`account:*:relationships*`);
  }
  
  /**
   * Search accounts with the given parameters
   * Uses caching for search results to improve performance
   * @param searchParams Search parameters including query string, filters, pagination, and sorting
   * @returns Paginated list of accounts matching the search criteria
   */
  async searchAccounts(searchParams: SearchParams): Promise<PaginatedResponse<Account>> {
    // Create a cache key based on the search parameters
    const cacheKey = `accounts:search:${JSON.stringify(searchParams)}`;
    
    // Try to get from cache first
    const cachedResult = await this.cacheService.get<PaginatedResponse<Account>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // If not in cache, get from service
    const result = await this.accountService.searchAccounts(searchParams);
    
    // Cache the result
    await this.cacheService.set(cacheKey, result, this.SEARCH_CACHE_TTL);
    
    return result;
  }
  
  /**
   * Get relationships for an account
   * Uses caching for relationship data
   * @param id Account ID
   * @returns Object containing parent and child relationships
   */
  async getAccountRelationships(id: string): Promise<AccountRelationships> {
    // Create a cache key for this account's relationships
    const cacheKey = `account:${id}:relationships`;
    
    // Try to get from cache first
    const cachedRelationships = await this.cacheService.get<AccountRelationships>(cacheKey);
    if (cachedRelationships) {
      return cachedRelationships;
    }
    
    // If not in cache, get from service
    const relationships = await this.accountService.getAccountRelationships(id);
    
    // Cache the result
    await this.cacheService.set(cacheKey, relationships, this.RELATIONSHIP_CACHE_TTL);
    
    return relationships;
  }
  
  /**
   * Update relationships for an account
   * Invalidates relevant caches after update
   * @param id Account ID
   * @param relationships DTO containing relationships to add and remove
   * @param userId ID of the user updating the relationships
   * @returns Updated account relationships
   */
  async updateAccountRelationships(id: string, relationships: RelationshipUpdateDto, userId: string): Promise<AccountRelationships> {
    // Update the relationships
    const updatedRelationships = await this.accountService.updateAccountRelationships(id, relationships, userId);
    
    // Invalidate relationship caches
    await this.cacheService.deleteByPattern(`account:${id}:relationships*`);
    
    // If relationships were added, invalidate the related accounts' relationship caches
    if (relationships.addRelationships && relationships.addRelationships.length > 0) {
      for (const rel of relationships.addRelationships) {
        await this.cacheService.deleteByPattern(`account:${rel.targetAccountId}:relationships*`);
      }
    }
    
    // If relationships were removed, we need to invalidate all relationship caches
    // since we don't know which accounts were affected
    if (relationships.removeRelationships && relationships.removeRelationships.length > 0) {
      await this.cacheService.deleteByPattern(`account:*:relationships*`);
    }
    
    // Cache the updated relationships
    const cacheKey = `account:${id}:relationships`;
    await this.cacheService.set(cacheKey, updatedRelationships, this.RELATIONSHIP_CACHE_TTL);
    
    return updatedRelationships;
  }
  
  /**
   * Validate account data
   * No caching needed for validation
   * @param account Account DTO to validate
   * @returns Validation result with errors if any
   */
  validateAccountData(account: AccountCreateDto | AccountUpdateDto): ValidationResult {
    return this.accountService.validateAccountData(account);
  }
  
  /**
   * Check for circular relationships
   * Uses caching to improve performance of repeated checks
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if adding the relationship would create a circular reference
   */
  checkCircularRelationships(parentId: string, childId: string): boolean {
    // This is a synchronous method in the interface, but our cache is async
    // We'll need to implement it without caching for now
    return this.accountService.checkCircularRelationships(parentId, childId);
  }
  
  /**
   * Get child accounts for a parent account
   * Uses caching for child account lists
   * @param parentId Parent account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of child accounts
   */
  async getChildAccounts(parentId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    // Create a cache key for this parent's child accounts
    const cacheKey = `account:${parentId}:children:${JSON.stringify(pagination || {})}`;
    
    // Try to get from cache first
    const cachedChildren = await this.cacheService.get<PaginatedResponse<Account>>(cacheKey);
    if (cachedChildren) {
      return cachedChildren;
    }
    
    // If not in cache, get from service
    const children = await this.accountService.getChildAccounts(parentId, pagination);
    
    // Cache the result
    await this.cacheService.set(cacheKey, children, this.RELATIONSHIP_CACHE_TTL);
    
    return children;
  }
  
  /**
   * Get parent accounts for a child account
   * Uses caching for parent account lists
   * @param childId Child account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of parent accounts
   */
  async getParentAccounts(childId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    // Create a cache key for this child's parent accounts
    const cacheKey = `account:${childId}:parents:${JSON.stringify(pagination || {})}`;
    
    // Try to get from cache first
    const cachedParents = await this.cacheService.get<PaginatedResponse<Account>>(cacheKey);
    if (cachedParents) {
      return cachedParents;
    }
    
    // If not in cache, get from service
    const parents = await this.accountService.getParentAccounts(childId, pagination);
    
    // Cache the result
    await this.cacheService.set(cacheKey, parents, this.RELATIONSHIP_CACHE_TTL);
    
    return parents;
  }
  
  /**
   * Get account activity history
   * Uses caching for activity records
   * @param id Account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of activity records
   */
  async getAccountActivity(id: string, pagination?: PaginationParams): Promise<PaginatedResponse<ActivityRecord>> {
    // Create a cache key for this account's activity
    const cacheKey = `account:${id}:activity:${JSON.stringify(pagination || {})}`;
    
    // Try to get from cache first
    const cachedActivity = await this.cacheService.get<PaginatedResponse<ActivityRecord>>(cacheKey);
    if (cachedActivity) {
      return cachedActivity;
    }
    
    // If not in cache, get from service
    const activity = await this.accountService.getAccountActivity(id, pagination);
    
    // Cache the result (shorter TTL for activity as it changes frequently)
    await this.cacheService.set(cacheKey, activity, 60); // 1 minute TTL
    
    return activity;
  }
  
  /**
   * Check if a user has permission to perform an action on an account
   * Uses caching for permission checks
   * @param userId User ID
   * @param accountId Account ID
   * @param action Action to check (view, edit, delete)
   * @returns True if user has permission, false otherwise
   */
  async hasPermission(userId: string, accountId: string, action: 'view' | 'edit' | 'delete'): Promise<boolean> {
    // Create a cache key for this permission check
    const cacheKey = `permission:${userId}:${accountId}:${action}`;
    
    // Try to get from cache first
    const cachedPermission = await this.cacheService.get<boolean>(cacheKey);
    if (cachedPermission !== null) {
      return cachedPermission;
    }
    
    // If not in cache, get from service
    const hasPermission = await this.accountService.hasPermission(userId, accountId, action);
    
    // Cache the result (shorter TTL for permissions)
    await this.cacheService.set(cacheKey, hasPermission, 60); // 1 minute TTL
    
    return hasPermission;
  }
  
  /**
   * Validate entity data
   * No caching needed for validation
   * @param dto DTO to validate
   * @returns Validation result
   */
  validate(dto: AccountCreateDto | AccountUpdateDto): ValidationResult {
    return this.accountService.validate(dto);
  }
  
  /**
   * Invalidate all list-related caches
   * Called after create, update, or delete operations
   */
  private async invalidateListCaches(): Promise<void> {
    await this.cacheService.deleteByPattern('accounts:list:*');
    await this.cacheService.deleteByPattern('accounts:search:*');
  }
}