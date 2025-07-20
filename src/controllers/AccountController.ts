import { IController } from '../interfaces/IController';
import { Account } from '../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../models/dto/AccountDto';
import { IAccountService } from '../interfaces/account/IAccountService';
import { IAuditService } from '../interfaces/IAuditService';
import { IPermissionService } from '../interfaces/IPermissionService';
import { PaginatedResponse, PaginationParams } from '../interfaces/IRepository';
import { AccountFilters } from '../interfaces/account/IAccountRepository';
import { SearchParams, SortParams } from '../types/common';
import { AccountRelationships } from '../models/AccountRelationship';
import { ErrorResponse, ErrorDetail } from '../types/common';
import { AccountStatus, AccountType } from '../models/enums/AccountEnums';

/**
 * Controller for handling account-related HTTP requests
 */
export class AccountController implements IController<Account, AccountCreateDto, AccountUpdateDto> {
  private accountService: IAccountService;
  private auditService: IAuditService;
  private permissionService: IPermissionService;
  
  /**
   * Constructor
   * @param accountService Account service instance
   * @param auditService Audit service instance
   * @param permissionService Permission service instance
   */
  constructor(
    accountService: IAccountService,
    auditService: IAuditService,
    permissionService: IPermissionService
  ) {
    this.accountService = accountService;
    this.auditService = auditService;
    this.permissionService = permissionService;
  }
  
  /**
   * Get all accounts with optional filtering and pagination
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts
   */
  async getAll(filters?: AccountFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view accounts
      const hasPermission = await this.permissionService.canCreate(userId, 'account');
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', 'You do not have permission to view accounts');
      }
      
      // Get accounts from service
      const accounts = await this.accountService.getAccounts(filters || {}, pagination || { page: 1, pageSize: 10 });
      
      // Filter accounts by permission
      const filteredAccounts = await this.permissionService.filterByPermission(userId, 'account', accounts.items);
      
      // Log access for each account
      for (const account of filteredAccounts) {
        await this.auditService.logAccess('account', account.id, userId);
      }
      
      // Return filtered accounts
      return {
        ...accounts,
        items: filteredAccounts,
        total: filteredAccounts.length
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get account by ID
   * @param id Account ID
   * @returns Account if found
   */
  async getById(id: string): Promise<Account> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view this account
      const hasPermission = await this.permissionService.canView(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to view account ${id}`);
      }
      
      // Get account from service
      const account = await this.accountService.getAccountById(id);
      
      // Log access
      await this.auditService.logAccess('account', id, userId);
      
      return account;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Create a new account
   * @param dto Account creation DTO
   * @returns Created account
   */
  async create(dto: AccountCreateDto): Promise<Account> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to create accounts
      const hasPermission = await this.permissionService.canCreate(userId, 'account');
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', 'You do not have permission to create accounts');
      }
      
      // Validate the DTO
      const validationResult = this.accountService.validateAccountData(dto);
      if (!validationResult.isValid) {
        throw this.createValidationErrorResponse(validationResult.errors);
      }
      
      // Create account
      const account = await this.accountService.createAccount(dto, userId);
      
      // Log creation
      await this.auditService.logCreation('account', account.id, account, userId);
      
      return account;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Update an existing account
   * @param id Account ID
   * @param dto Account update DTO
   * @returns Updated account
   */
  async update(id: string, dto: AccountUpdateDto): Promise<Account> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to update this account
      const hasPermission = await this.permissionService.canUpdate(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to update account ${id}`);
      }
      
      // Validate the DTO
      const validationResult = this.accountService.validateAccountData(dto);
      if (!validationResult.isValid) {
        throw this.createValidationErrorResponse(validationResult.errors);
      }
      
      // Get the original account for audit purposes
      const originalAccount = await this.accountService.getAccountById(id);
      
      // Update account
      const updatedAccount = await this.accountService.updateAccount(id, dto, userId);
      
      // Log update
      await this.auditService.logUpdate('account', id, {
        original: originalAccount,
        changes: dto,
        updated: updatedAccount
      }, userId);
      
      return updatedAccount;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Delete an account
   * @param id Account ID
   * @returns void
   */
  async delete(id: string): Promise<void> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to delete this account
      const hasPermission = await this.permissionService.canDelete(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to delete account ${id}`);
      }
      
      // Get the account for audit purposes
      const account = await this.accountService.getAccountById(id);
      
      // Delete account
      await this.accountService.deleteAccount(id, userId);
      
      // Log deletion
      await this.auditService.logDeletion('account', id, userId);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Search accounts with the given parameters
   * @param searchParams Search parameters
   * @returns Paginated list of accounts matching the search criteria
   */
  async searchAccounts(searchParams: SearchParams): Promise<PaginatedResponse<Account>> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view accounts
      const hasPermission = await this.permissionService.canCreate(userId, 'account');
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', 'You do not have permission to search accounts');
      }
      
      // Validate search parameters
      this.validateSearchParams(searchParams);
      
      // Apply default pagination if not provided
      if (!searchParams.pagination) {
        searchParams.pagination = { page: 1, pageSize: 10 };
      }
      
      // Apply default sorting if not provided
      if (!searchParams.sort) {
        searchParams.sort = { field: 'name', direction: 'asc' };
      }
      
      // Search accounts
      const startTime = Date.now();
      const accounts = await this.accountService.searchAccounts(searchParams);
      const endTime = Date.now();
      
      // Check if search performance meets requirements (sub-200ms as per NF4)
      const searchTime = endTime - startTime;
      if (searchTime > 200) {
        console.warn(`Search operation took ${searchTime}ms, which exceeds the 200ms requirement`);
      }
      
      // Filter accounts by permission
      const filteredAccounts = await this.permissionService.filterByPermission(userId, 'account', accounts.items);
      
      // Log access for each account (batch logging would be more efficient in production)
      for (const account of filteredAccounts) {
        await this.auditService.logAccess('account', account.id, userId);
      }
      
      // Return filtered accounts
      return {
        ...accounts,
        items: filteredAccounts,
        total: filteredAccounts.length,
        metadata: {
          ...accounts.metadata,
          searchTime
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Search accounts with advanced filtering
   * @param filters Advanced filters
   * @param pagination Pagination parameters
   * @param sort Sorting parameters
   * @returns Paginated list of accounts matching the filters
   */
  async searchAccountsAdvanced(
    filters: Record<string, any>,
    pagination: PaginationParams,
    sort?: SortParams
  ): Promise<PaginatedResponse<Account>> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view accounts
      const hasPermission = await this.permissionService.canCreate(userId, 'account');
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', 'You do not have permission to search accounts');
      }
      
      // Validate filters
      this.validateFilters(filters);
      
      // Create search params
      const searchParams: SearchParams = {
        query: '',
        filters,
        pagination,
        sort: sort || { field: 'name', direction: 'asc' }
      };
      
      // Search accounts
      const startTime = Date.now();
      const accounts = await this.accountService.searchAccounts(searchParams);
      const endTime = Date.now();
      
      // Check if search performance meets requirements (sub-200ms as per NF4)
      const searchTime = endTime - startTime;
      if (searchTime > 200) {
        console.warn(`Search operation took ${searchTime}ms, which exceeds the 200ms requirement`);
      }
      
      // Filter accounts by permission
      const filteredAccounts = await this.permissionService.filterByPermission(userId, 'account', accounts.items);
      
      // Log access for each account (batch logging would be more efficient in production)
      for (const account of filteredAccounts) {
        await this.auditService.logAccess('account', account.id, userId);
      }
      
      // Return filtered accounts
      return {
        ...accounts,
        items: filteredAccounts,
        total: filteredAccounts.length,
        metadata: {
          ...accounts.metadata,
          searchTime,
          appliedFilters: Object.keys(filters).length
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get available filter options for account search
   * @returns Available filter options
   */
  async getSearchFilterOptions(): Promise<Record<string, any>> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view accounts
      const hasPermission = await this.permissionService.canCreate(userId, 'account');
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', 'You do not have permission to access search options');
      }
      
      // In a real implementation, this would fetch dynamic options from the database
      // For now, we'll return static options
      return {
        accountTypes: Object.values(AccountType),
        accountStatuses: Object.values(AccountStatus),
        industries: [
          'Technology',
          'Finance',
          'Healthcare',
          'Manufacturing',
          'Retail',
          'Education',
          'Government',
          'Other'
        ],
        sortFields: [
          { field: 'name', label: 'Account Name' },
          { field: 'industry', label: 'Industry' },
          { field: 'type', label: 'Account Type' },
          { field: 'status', label: 'Status' },
          { field: 'createdAt', label: 'Created Date' },
          { field: 'updatedAt', label: 'Updated Date' }
        ]
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get relationships for an account
   * @param id Account ID
   * @returns Object containing parent and child relationships
   */
  async getAccountRelationships(id: string): Promise<AccountRelationships> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view this account
      const hasPermission = await this.permissionService.canView(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to view account ${id} relationships`);
      }
      
      // Get relationships
      const relationships = await this.accountService.getAccountRelationships(id);
      
      // Log access
      await this.auditService.logAccess('account', id, userId);
      
      return relationships;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Update relationships for an account
   * @param id Account ID
   * @param relationships DTO containing relationships to add and remove
   * @returns Updated account relationships
   */
  async updateAccountRelationships(id: string, relationships: RelationshipUpdateDto): Promise<AccountRelationships> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to update this account
      const hasPermission = await this.permissionService.canUpdate(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to update account ${id} relationships`);
      }
      
      // Validate the relationship update DTO
      this.validateRelationshipUpdateDto(relationships);
      
      // Get the original relationships for audit purposes
      const originalRelationships = await this.accountService.getAccountRelationships(id);
      
      // Check for circular relationships before updating
      if (relationships.addRelationships && relationships.addRelationships.length > 0) {
        for (const rel of relationships.addRelationships) {
          const parentId = rel.isParent ? rel.targetAccountId : id;
          const childId = rel.isParent ? id : rel.targetAccountId;
          
          // Check if this would create a circular reference
          const wouldCreateCircular = await this.accountService.checkCircularRelationships(parentId, childId);
          if (wouldCreateCircular) {
            throw this.createErrorResponse(
              400,
              'CIRCULAR_REFERENCE',
              `Adding a relationship between ${parentId} and ${childId} would create a circular reference`,
              [{
                field: 'addRelationships',
                error: 'Circular reference detected'
              }]
            );
          }
        }
      }
      
      // Update relationships
      const updatedRelationships = await this.accountService.updateAccountRelationships(id, relationships, userId);
      
      // Log update
      await this.auditService.logUpdate('account_relationship', id, {
        original: originalRelationships,
        changes: relationships,
        updated: updatedRelationships
      }, userId);
      
      return updatedRelationships;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get relationship hierarchy for an account
   * @param id Account ID
   * @param depth Maximum depth to traverse (default: 3)
   * @returns Hierarchical representation of account relationships
   */
  async getAccountRelationshipHierarchy(id: string, depth: number = 3): Promise<any> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view this account
      const hasPermission = await this.permissionService.canView(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to view account ${id} relationships`);
      }
      
      // Validate depth parameter
      if (depth < 1 || depth > 5) {
        throw this.createErrorResponse(
          400,
          'VALIDATION_ERROR',
          'Depth must be between 1 and 5',
          [{ field: 'depth', error: 'Depth must be between 1 and 5' }]
        );
      }
      
      // Get the account
      const account = await this.accountService.getAccountById(id);
      
      // Build the hierarchy
      const hierarchy = await this.buildRelationshipHierarchy(account, depth, 0, new Set<string>());
      
      // Log access
      await this.auditService.logAccess('account', id, userId);
      
      return hierarchy;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Check if adding a relationship would create a circular reference
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if adding the relationship would create a circular reference
   */
  async checkCircularRelationship(parentId: string, childId: string): Promise<{ wouldCreateCircular: boolean, path?: string[] }> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view these accounts
      const canViewParent = await this.permissionService.canView(userId, 'account', parentId);
      const canViewChild = await this.permissionService.canView(userId, 'account', childId);
      
      if (!canViewParent || !canViewChild) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', 'You do not have permission to check relationships');
      }
      
      // Check for circular reference
      const wouldCreateCircular = await this.accountService.checkCircularRelationships(parentId, childId);
      
      // In a real implementation, we would also return the path of the circular reference
      // For now, we'll just return a simple result
      return {
        wouldCreateCircular,
        path: wouldCreateCircular ? [parentId, '...', childId, '...', parentId] : undefined
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get account activity history
   * @param id Account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of activity records
   */
  async getAccountActivity(id: string, pagination?: PaginationParams): Promise<PaginatedResponse<any>> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view this account
      const hasPermission = await this.permissionService.canView(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to view account ${id} activity`);
      }
      
      // Get activity
      const activity = await this.accountService.getAccountActivity(id, pagination);
      
      // Log access
      await this.auditService.logAccess('account', id, userId);
      
      return activity;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get child accounts for a parent account
   * @param parentId Parent account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of child accounts
   */
  async getChildAccounts(parentId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view this account
      const hasPermission = await this.permissionService.canView(userId, 'account', parentId);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to view account ${parentId} children`);
      }
      
      // Get child accounts
      const childAccounts = await this.accountService.getChildAccounts(parentId, pagination);
      
      // Filter accounts by permission
      const filteredAccounts = await this.permissionService.filterByPermission(userId, 'account', childAccounts.items);
      
      // Log access
      await this.auditService.logAccess('account', parentId, userId);
      
      // Return filtered accounts
      return {
        ...childAccounts,
        items: filteredAccounts,
        total: filteredAccounts.length
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get parent accounts for a child account
   * @param childId Child account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of parent accounts
   */
  async getParentAccounts(childId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to view this account
      const hasPermission = await this.permissionService.canView(userId, 'account', childId);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to view account ${childId} parents`);
      }
      
      // Get parent accounts
      const parentAccounts = await this.accountService.getParentAccounts(childId, pagination);
      
      // Filter accounts by permission
      const filteredAccounts = await this.permissionService.filterByPermission(userId, 'account', parentAccounts.items);
      
      // Log access
      await this.auditService.logAccess('account', childId, userId);
      
      // Return filtered accounts
      return {
        ...parentAccounts,
        items: filteredAccounts,
        total: filteredAccounts.length
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Export all data related to an account for GDPR compliance
   * @param id Account ID
   * @returns Complete account data export
   */
  async exportAccountData(id: string): Promise<any> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to export this account's data
      const hasPermission = await this.permissionService.canView(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to export data for account ${id}`);
      }
      
      // Export account data
      const exportData = await this.accountService.exportAccountData(id, userId);
      
      // Log the export operation
      await this.auditService.logAccess('account', id, userId);
      
      return exportData;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Completely remove all data related to an account for GDPR compliance
   * This is different from regular deletion as it removes all traces including audit logs
   * @param id Account ID
   * @returns Success message
   */
  async completelyRemoveAccountData(id: string): Promise<{ success: boolean, message: string }> {
    try {
      // Get the user ID from the authenticated user
      const userId = this.getCurrentUserId();
      
      // Check if user has permission to delete this account
      const hasPermission = await this.permissionService.canDelete(userId, 'account', id);
      if (!hasPermission) {
        throw this.createErrorResponse(403, 'PERMISSION_DENIED', `You do not have permission to delete account ${id}`);
      }
      
      // Get the account for confirmation
      const account = await this.accountService.getAccountById(id);
      
      // Completely remove account data
      await this.accountService.completelyRemoveAccountData(id, userId);
      
      // Note: We don't log this operation in the audit trail since we've deleted all audit records
      // In a real system, we might want to keep a separate compliance log for these operations
      
      return {
        success: true,
        message: `Account ${account.name} (${id}) has been completely removed from the system in compliance with GDPR requirements`
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get the current user ID from the authentication context
   * @returns User ID
   */
  private getCurrentUserId(): string {
    // In a real application, this would get the user ID from the authentication context
    // For now, we'll return a default user ID
    return 'current-user';
  }
  
  /**
   * Handle errors and convert them to appropriate HTTP responses
   * @param error Error to handle
   * @returns Standardized error response
   */
  private handleError(error: any): ErrorResponse {
    // If the error is already an ErrorResponse, return it
    if (error && error.status && error.code && error.message) {
      return error;
    }
    
    // Check for specific error types
    if (error.message && error.message.includes('not found')) {
      return this.createErrorResponse(404, 'NOT_FOUND', error.message);
    }
    
    if (error.message && error.message.includes('Validation failed')) {
      return this.createErrorResponse(400, 'VALIDATION_ERROR', error.message);
    }
    
    if (error.message && error.message.includes('circular reference')) {
      return this.createErrorResponse(400, 'CIRCULAR_REFERENCE', error.message);
    }
    
    if (error.message && error.message.includes('dependencies')) {
      return this.createErrorResponse(400, 'DEPENDENCY_ERROR', error.message);
    }
    
    // Default to internal server error
    console.error('Unhandled error in AccountController:', error);
    return this.createErrorResponse(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
  }
  
  /**
   * Create a standardized error response
   * @param status HTTP status code
   * @param code Error code
   * @param message Error message
   * @param details Optional error details
   * @returns Error response
   */
  private createErrorResponse(status: number, code: string, message: string, details?: ErrorDetail[]): ErrorResponse {
    return {
      status,
      code,
      message,
      details
    };
  }
  
  /**
   * Create a validation error response
   * @param errors Validation errors
   * @returns Error response
   */
  private createValidationErrorResponse(errors: { field: string, message: string }[]): ErrorResponse {
    return this.createErrorResponse(
      400,
      'VALIDATION_ERROR',
      'Validation failed',
      errors.map(error => ({
        field: error.field,
        error: error.message
      }))
    );
  }
  
  /**
   * Validate search parameters
   * @param searchParams Search parameters to validate
   * @throws Error if validation fails
   */
  private validateSearchParams(searchParams: SearchParams): void {
    const errors: ErrorDetail[] = [];
    
    // Validate pagination if provided
    if (searchParams.pagination) {
      if (searchParams.pagination.page < 1) {
        errors.push({ field: 'pagination.page', error: 'Page number must be greater than or equal to 1' });
      }
      
      if (searchParams.pagination.pageSize < 1 || searchParams.pagination.pageSize > 100) {
        errors.push({ field: 'pagination.pageSize', error: 'Page size must be between 1 and 100' });
      }
    }
    
    // Validate sort if provided
    if (searchParams.sort) {
      const validSortFields = ['name', 'industry', 'type', 'status', 'createdAt', 'updatedAt'];
      if (!validSortFields.includes(searchParams.sort.field)) {
        errors.push({ field: 'sort.field', error: `Sort field must be one of: ${validSortFields.join(', ')}` });
      }
      
      if (searchParams.sort.direction !== 'asc' && searchParams.sort.direction !== 'desc') {
        errors.push({ field: 'sort.direction', error: 'Sort direction must be either "asc" or "desc"' });
      }
    }
    
    // Validate filters if provided
    if (searchParams.filters) {
      this.validateFilters(searchParams.filters, errors);
    }
    
    // Throw error if validation fails
    if (errors.length > 0) {
      throw this.createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid search parameters', errors);
    }
  }
  
  /**
   * Validate filters
   * @param filters Filters to validate
   * @param existingErrors Optional array to add errors to
   * @throws Error if validation fails and existingErrors is not provided
   */
  private validateFilters(filters: Record<string, any>, existingErrors?: ErrorDetail[]): void {
    const errors: ErrorDetail[] = existingErrors || [];
    
    // Validate known filter fields
    if ('type' in filters) {
      const validTypes = Object.values(AccountType);
      if (!validTypes.includes(filters.type)) {
        errors.push({ field: 'filters.type', error: `Account type must be one of: ${validTypes.join(', ')}` });
      }
    }
    
    if ('status' in filters) {
      const validStatuses = Object.values(AccountStatus);
      if (!validStatuses.includes(filters.status)) {
        errors.push({ field: 'filters.status', error: `Account status must be one of: ${validStatuses.join(', ')}` });
      }
    }
    
    if ('createdAt' in filters) {
      if (filters.createdAt.from && isNaN(Date.parse(filters.createdAt.from))) {
        errors.push({ field: 'filters.createdAt.from', error: 'Invalid date format' });
      }
      
      if (filters.createdAt.to && isNaN(Date.parse(filters.createdAt.to))) {
        errors.push({ field: 'filters.createdAt.to', error: 'Invalid date format' });
      }
    }
    
    if ('updatedAt' in filters) {
      if (filters.updatedAt.from && isNaN(Date.parse(filters.updatedAt.from))) {
        errors.push({ field: 'filters.updatedAt.from', error: 'Invalid date format' });
      }
      
      if (filters.updatedAt.to && isNaN(Date.parse(filters.updatedAt.to))) {
        errors.push({ field: 'filters.updatedAt.to', error: 'Invalid date format' });
      }
    }
    
    if ('annualRevenue' in filters) {
      if (filters.annualRevenue.min && typeof filters.annualRevenue.min !== 'number') {
        errors.push({ field: 'filters.annualRevenue.min', error: 'Must be a number' });
      }
      
      if (filters.annualRevenue.max && typeof filters.annualRevenue.max !== 'number') {
        errors.push({ field: 'filters.annualRevenue.max', error: 'Must be a number' });
      }
    }
    
    if ('employeeCount' in filters) {
      if (filters.employeeCount.min && typeof filters.employeeCount.min !== 'number') {
        errors.push({ field: 'filters.employeeCount.min', error: 'Must be a number' });
      }
      
      if (filters.employeeCount.max && typeof filters.employeeCount.max !== 'number') {
        errors.push({ field: 'filters.employeeCount.max', error: 'Must be a number' });
      }
    }
    
    // Throw error if validation fails and no existing errors array was provided
    if (!existingErrors && errors.length > 0) {
      throw this.createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid filters', errors);
    }
  }
  
  /**
   * Validate relationship update DTO
   * @param dto Relationship update DTO to validate
   * @throws Error if validation fails
   */
  private validateRelationshipUpdateDto(dto: RelationshipUpdateDto): void {
    const errors: ErrorDetail[] = [];
    
    // Check if at least one operation is provided
    if ((!dto.addRelationships || dto.addRelationships.length === 0) && 
        (!dto.removeRelationships || dto.removeRelationships.length === 0)) {
      errors.push({ 
        field: 'general', 
        error: 'At least one relationship operation (add or remove) must be provided' 
      });
      throw this.createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid relationship update', errors);
    }
    
    // Validate add relationships
    if (dto.addRelationships) {
      dto.addRelationships.forEach((rel, index) => {
        if (!rel.targetAccountId || rel.targetAccountId.trim() === '') {
          errors.push({ 
            field: `addRelationships[${index}].targetAccountId`, 
            error: 'Target account ID is required' 
          });
        }
        
        if (rel.relationshipType === undefined) {
          errors.push({ 
            field: `addRelationships[${index}].relationshipType`, 
            error: 'Relationship type is required' 
          });
        }
      });
    }
    
    // Validate remove relationships
    if (dto.removeRelationships) {
      dto.removeRelationships.forEach((relId, index) => {
        if (!relId || relId.trim() === '') {
          errors.push({ 
            field: `removeRelationships[${index}]`, 
            error: 'Relationship ID is required' 
          });
        }
      });
    }
    
    // Throw error if validation fails
    if (errors.length > 0) {
      throw this.createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid relationship update', errors);
    }
  }
  
  /**
   * Build a hierarchical representation of account relationships
   * @param account The account to build the hierarchy for
   * @param maxDepth Maximum depth to traverse
   * @param currentDepth Current depth in the traversal
   * @param visitedIds Set of account IDs that have already been visited (to prevent cycles)
   * @returns Hierarchical representation of the account and its relationships
   */
  private async buildRelationshipHierarchy(
    account: Account,
    maxDepth: number,
    currentDepth: number,
    visitedIds: Set<string>
  ): Promise<any> {
    // Base case: we've reached the maximum depth or we've already visited this account
    if (currentDepth >= maxDepth || visitedIds.has(account.id)) {
      return {
        id: account.id,
        name: account.name,
        type: account.type,
        status: account.status,
        isCycle: visitedIds.has(account.id)
      };
    }
    
    // Add this account to the visited set
    visitedIds.add(account.id);
    
    // Get relationships for this account
    const relationships = await this.accountService.getAccountRelationships(account.id);
    
    // Build the hierarchy node
    const node = {
      id: account.id,
      name: account.name,
      type: account.type,
      status: account.status,
      parents: [],
      children: []
    };
    
    // Add parent accounts
    if (relationships.parentRelationships.length > 0) {
      for (const parentRel of relationships.parentRelationships) {
        try {
          const parentAccount = await this.accountService.getAccountById(parentRel.parentAccountId);
          const parentNode = await this.buildRelationshipHierarchy(
            parentAccount,
            maxDepth,
            currentDepth + 1,
            new Set(visitedIds)
          );
          node.parents.push({
            ...parentNode,
            relationshipType: parentRel.relationshipType
          });
        } catch (error) {
          // If we can't get the parent account, just add a reference
          node.parents.push({
            id: parentRel.parentAccountId,
            relationshipType: parentRel.relationshipType,
            error: 'Could not load account details'
          });
        }
      }
    }
    
    // Add child accounts
    if (relationships.childRelationships.length > 0) {
      for (const childRel of relationships.childRelationships) {
        try {
          const childAccount = await this.accountService.getAccountById(childRel.childAccountId);
          const childNode = await this.buildRelationshipHierarchy(
            childAccount,
            maxDepth,
            currentDepth + 1,
            new Set(visitedIds)
          );
          node.children.push({
            ...childNode,
            relationshipType: childRel.relationshipType
          });
        } catch (error) {
          // If we can't get the child account, just add a reference
          node.children.push({
            id: childRel.childAccountId,
            relationshipType: childRel.relationshipType,
            error: 'Could not load account details'
          });
        }
      }
    }
    
    return node;
  }
}