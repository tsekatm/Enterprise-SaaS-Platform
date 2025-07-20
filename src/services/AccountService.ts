import { IAccountService, ActivityRecord, AccountDataExport } from '../interfaces/account/IAccountService';
import { IAccountRepository, AccountFilters } from '../interfaces/account/IAccountRepository';
import { PaginatedResponse, PaginationParams } from '../interfaces/IRepository';
import { SearchParams } from '../types/common';
import { Account } from '../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto, validateAccountCreateDto, validateAccountUpdateDto } from '../models/dto/AccountDto';
import { AccountRelationships, wouldCreateCircularReference } from '../models/AccountRelationship';
import { ValidationResult, ValidationError } from '../interfaces/IService';
import { IAuditService } from '../interfaces/IAuditService';

/**
 * Implementation of the Account service
 * Handles business logic for account management operations
 */
export class AccountService implements IAccountService {
  private accountRepository: IAccountRepository;
  private auditService?: IAuditService;
  
  /**
   * Constructor
   * @param accountRepository Account repository instance
   * @param auditService Optional audit service instance for compliance features
   */
  constructor(accountRepository: IAccountRepository, auditService?: IAuditService) {
    this.accountRepository = accountRepository;
    this.auditService = auditService;
  }

  /**
   * Get accounts with filtering and pagination
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts
   */
  async getAccounts(filters: AccountFilters, pagination: PaginationParams): Promise<PaginatedResponse<Account>> {
    return this.accountRepository.findAll(filters, pagination);
  }

  /**
   * Get all entities with optional filtering and pagination
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts
   */
  async getAll(filters?: AccountFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    return this.accountRepository.findAll(filters, pagination);
  }

  /**
   * Get account by ID
   * @param id Account ID
   * @returns Account if found
   * @throws Error if account not found or user doesn't have permission
   */
  async getAccountById(id: string): Promise<Account> {
    return this.getById(id);
  }

  /**
   * Get entity by ID
   * @param id Account ID
   * @returns Account if found
   * @throws Error if account not found
   */
  async getById(id: string): Promise<Account> {
    return this.accountRepository.findById(id);
  }

  /**
   * Create a new account
   * @param account Account creation DTO
   * @param userId ID of the user creating the account
   * @returns Created account
   * @throws Error if validation fails or user doesn't have permission
   */
  async createAccount(account: AccountCreateDto, userId: string): Promise<Account> {
    return this.create(account, userId);
  }

  /**
   * Create a new entity
   * @param dto Account creation DTO
   * @param userId ID of the user creating the account
   * @returns Created account
   * @throws Error if validation fails
   */
  async create(dto: AccountCreateDto, userId: string): Promise<Account> {
    // Validate the DTO
    const validationResult = this.validateAccountData(dto);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Create the account with the user ID
    const accountToCreate = {
      ...dto,
      createdBy: userId,
      updatedBy: userId
    };

    return this.accountRepository.create(accountToCreate);
  }

  /**
   * Update an existing account
   * @param id Account ID
   * @param account Account update DTO
   * @param userId ID of the user updating the account
   * @returns Updated account
   * @throws Error if validation fails, account not found, or user doesn't have permission
   */
  async updateAccount(id: string, account: AccountUpdateDto, userId: string): Promise<Account> {
    return this.update(id, account, userId);
  }

  /**
   * Update an existing entity
   * @param id Account ID
   * @param dto Account update DTO
   * @param userId ID of the user updating the account
   * @returns Updated account
   * @throws Error if validation fails or account not found
   */
  async update(id: string, dto: AccountUpdateDto, userId: string): Promise<Account> {
    // Validate the DTO
    const validationResult = this.validateAccountData(dto);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Check if account exists
    await this.accountRepository.findById(id);

    // Update the account with the user ID
    const accountToUpdate = {
      ...dto,
      updatedBy: userId
    };

    return this.accountRepository.update(id, accountToUpdate);
  }

  /**
   * Delete an account
   * @param id Account ID
   * @param userId ID of the user deleting the account
   * @returns void
   * @throws Error if account not found, has dependencies, or user doesn't have permission
   */
  async deleteAccount(id: string, userId: string): Promise<void> {
    return this.delete(id, userId);
  }

  /**
   * Delete an entity
   * @param id Account ID
   * @param userId ID of the user deleting the account
   * @returns void
   * @throws Error if account not found
   */
  async delete(id: string, userId: string): Promise<void> {
    // Check if account exists
    await this.accountRepository.findById(id);

    // Check for dependencies (child accounts)
    const childAccounts = await this.accountRepository.getChildAccounts(id);
    if (childAccounts.total > 0) {
      throw new Error(`Cannot delete account with ID ${id} because it has ${childAccounts.total} child accounts. Please remove the relationships first.`);
    }

    // Delete the account
    await this.accountRepository.delete(id);
  }

  /**
   * Search accounts with the given parameters
   * @param searchParams Search parameters including query string, filters, pagination, and sorting
   * @returns Paginated list of accounts matching the search criteria
   */
  async searchAccounts(searchParams: SearchParams): Promise<PaginatedResponse<Account>> {
    return this.accountRepository.search(searchParams);
  }

  /**
   * Get relationships for an account
   * @param id Account ID
   * @returns Object containing parent and child relationships
   * @throws Error if account not found or user doesn't have permission
   */
  async getAccountRelationships(id: string): Promise<AccountRelationships> {
    // Check if account exists
    await this.accountRepository.findById(id);

    return this.accountRepository.getRelationships(id);
  }

  /**
   * Update relationships for an account
   * @param id Account ID
   * @param relationships DTO containing relationships to add and remove
   * @param userId ID of the user updating the relationships
   * @returns Updated account relationships
   * @throws Error if account not found, validation fails, or user doesn't have permission
   */
  async updateAccountRelationships(id: string, relationships: RelationshipUpdateDto, userId: string): Promise<AccountRelationships> {
    // Check if account exists
    await this.accountRepository.findById(id);

    // Check for circular relationships in the relationships to add
    if (relationships.addRelationships) {
      for (const rel of relationships.addRelationships) {
        const parentId = rel.isParent ? rel.targetAccountId : id;
        const childId = rel.isParent ? id : rel.targetAccountId;

        if (await this.checkCircularRelationships(parentId, childId)) {
          throw new Error(`Adding a relationship between ${parentId} and ${childId} would create a circular reference`);
        }
      }
    }

    // Update the relationships
    return this.accountRepository.updateRelationships(id, relationships);
  }

  /**
   * Validate account data
   * @param account Account DTO to validate
   * @returns Validation result with errors if any
   */
  validateAccountData(dto: AccountCreateDto | AccountUpdateDto): ValidationResult {
    let errors: string[] = [];

    // Use the appropriate validation function based on the DTO type
    if ('name' in dto && dto.name !== undefined) {
      // If name is present and not undefined, it's likely a CreateDto
      errors = validateAccountCreateDto(dto as AccountCreateDto);
    } else {
      // Otherwise, it's likely an UpdateDto
      errors = validateAccountUpdateDto(dto as AccountUpdateDto);
    }

    // Convert string errors to ValidationError objects
    const validationErrors: ValidationError[] = errors.map(error => {
      // Extract field name from error message if possible
      const fieldMatch = error.match(/^([^:]+) is required/) || 
                        error.match(/^Invalid ([^ ]+) format/);
      
      const field = fieldMatch ? fieldMatch[1].toLowerCase() : 'general';
      
      return {
        field,
        message: error
      };
    });

    return {
      isValid: errors.length === 0,
      errors: validationErrors
    };
  }

  /**
   * Check for circular relationships
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if adding the relationship would create a circular reference
   */
  async checkCircularRelationships(parentId: string, childId: string): Promise<boolean> {
    return this.accountRepository.checkCircularRelationship(parentId, childId);
  }

  /**
   * Get child accounts for a parent account
   * @param parentId Parent account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of child accounts
   * @throws Error if account not found or user doesn't have permission
   */
  async getChildAccounts(parentId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    // Check if account exists
    await this.accountRepository.findById(parentId);

    return this.accountRepository.getChildAccounts(parentId, pagination);
  }

  /**
   * Get parent accounts for a child account
   * @param childId Child account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of parent accounts
   * @throws Error if account not found or user doesn't have permission
   */
  async getParentAccounts(childId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    // Check if account exists
    await this.accountRepository.findById(childId);

    return this.accountRepository.getParentAccounts(childId, pagination);
  }

  /**
   * Get account activity history
   * @param id Account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of activity records
   * @throws Error if account not found or user doesn't have permission
   */
  async getAccountActivity(id: string, pagination?: PaginationParams): Promise<PaginatedResponse<ActivityRecord>> {
    // Check if account exists
    await this.accountRepository.findById(id);

    // In a real implementation, this would fetch activity records from an audit service
    // For now, we'll return an empty list
    return {
      items: [],
      total: 0,
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 10,
      totalPages: 0
    };
  }

  /**
   * Check if a user has permission to perform an action on an account
   * @param userId User ID
   * @param accountId Account ID
   * @param action Action to check (view, edit, delete)
   * @returns True if user has permission, false otherwise
   */
  async hasPermission(userId: string, accountId: string, action: 'view' | 'edit' | 'delete'): Promise<boolean> {
    // In a real implementation, this would check permissions from a permission service
    // For now, we'll assume all users have all permissions
    return true;
  }

  /**
   * Validate entity data
   * @param dto DTO to validate
   * @returns Validation result
   */
  validate(dto: AccountCreateDto | AccountUpdateDto): ValidationResult {
    return this.validateAccountData(dto);
  }

  /**
   * Export all data related to an account for GDPR compliance
   * @param id Account ID
   * @param userId ID of the user requesting the export
   * @returns Complete account data export including relationships and audit trail
   * @throws Error if account not found or user doesn't have permission
   */
  async exportAccountData(id: string, userId: string): Promise<AccountDataExport> {
    // Check if account exists
    const account = await this.accountRepository.findById(id);
    
    // Check if user has permission to export this account's data
    const hasPermission = await this.hasPermission(userId, id, 'view');
    if (!hasPermission) {
      throw new Error(`User ${userId} does not have permission to export data for account ${id}`);
    }
    
    // Get account relationships
    const relationships = await this.accountRepository.getRelationships(id);
    
    // Get audit trail if audit service is available
    let auditTrail: any[] = [];
    if (this.auditService) {
      try {
        const auditExport = await this.auditService.exportAuditData('account', id);
        auditTrail = auditExport.entries;
      } catch (error) {
        console.error('Failed to export audit data:', error);
        // Continue with export even if audit data retrieval fails
      }
    }
    
    // Create the export object
    const exportData: AccountDataExport = {
      account,
      relationships,
      auditTrail,
      exportDate: new Date(),
      exportedBy: userId
    };
    
    // Log the export operation if audit service is available
    if (this.auditService) {
      try {
        await this.auditService.logAccess('account', id, userId);
      } catch (error) {
        console.error('Failed to log data export:', error);
        // Continue with export even if logging fails
      }
    }
    
    return exportData;
  }
  
  /**
   * Completely remove all data related to an account for GDPR compliance
   * This is different from regular deletion as it removes all traces including audit logs
   * @param id Account ID
   * @param userId ID of the user requesting the removal
   * @returns Promise that resolves when all data is removed
   * @throws Error if account not found or user doesn't have permission
   */
  async completelyRemoveAccountData(id: string, userId: string): Promise<void> {
    // Check if account exists
    await this.accountRepository.findById(id);
    
    // Check if user has permission to delete this account
    const hasPermission = await this.hasPermission(userId, id, 'delete');
    if (!hasPermission) {
      throw new Error(`User ${userId} does not have permission to delete account ${id}`);
    }
    
    // First, get all relationships to ensure we clean up properly
    const relationships = await this.accountRepository.getRelationships(id);
    
    // Remove all relationships
    if (relationships.parentRelationships.length > 0 || relationships.childRelationships.length > 0) {
      const relationshipUpdateDto: RelationshipUpdateDto = {
        addRelationships: [],
        removeRelationships: [
          ...relationships.parentRelationships.map(rel => rel.id),
          ...relationships.childRelationships.map(rel => rel.id)
        ]
      };
      
      await this.accountRepository.updateRelationships(id, relationshipUpdateDto);
    }
    
    // Delete the account from the repository
    await this.accountRepository.delete(id);
    
    // Delete audit data if audit service is available
    if (this.auditService) {
      try {
        await this.auditService.deleteAuditData('account', id);
      } catch (error) {
        console.error('Failed to delete audit data:', error);
        throw new Error(`Account was deleted but failed to remove audit data: ${error.message}`);
      }
    }
    
    // In a real implementation, we would also:
    // 1. Delete any associated files or documents
    // 2. Remove references from other entities
    // 3. Notify any integrated systems about the deletion
    // 4. Generate a deletion certificate for compliance records
  }
}