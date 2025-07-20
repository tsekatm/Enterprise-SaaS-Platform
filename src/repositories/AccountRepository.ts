import { v4 as uuidv4 } from 'uuid';
import { IAccountRepository, AccountFilters } from '../interfaces/account/IAccountRepository';
import { PaginatedResponse, PaginationParams } from '../interfaces/IRepository';
import { SearchParams } from '../types/common';
import { Account } from '../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../models/dto/AccountDto';
import { AccountRelationship, AccountRelationships } from '../models/AccountRelationship';
import { validateAccountCreateDto, validateAccountUpdateDto, validateRelationshipUpdateDto } from '../models/dto/AccountDto';

/**
 * Implementation of the Account repository
 * Handles data access operations for customer accounts
 */
export class AccountRepository implements IAccountRepository {
  // In-memory storage for accounts and relationships
  // In a real application, this would be replaced with a database connection
  private accounts: Map<string, Account> = new Map<string, Account>();
  private relationships: Map<string, AccountRelationship> = new Map<string, AccountRelationship>();

  /**
   * Find all accounts with optional filtering and pagination
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts
   */
  async findAll(filters?: AccountFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    let accounts = Array.from(this.accounts.values());
    
    // Apply filters if provided
    if (filters) {
      accounts = this.applyFilters(accounts, filters);
    }
    
    // Apply pagination
    return this.paginateResults(accounts, pagination);
  }

  /**
   * Find account by ID
   * @param id Account ID
   * @returns Account if found
   * @throws Error if account not found
   */
  async findById(id: string): Promise<Account> {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error(`Account with ID ${id} not found`);
    }
    return account;
  }

  /**
   * Create a new account
   * @param dto Account creation DTO
   * @returns Created account
   * @throws Error if validation fails
   */
  async create(dto: AccountCreateDto): Promise<Account> {
    // Validate the DTO
    const validationErrors = validateAccountCreateDto(dto);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Create a new account with generated ID and timestamps
    const now = new Date();
    const account: Account = {
      id: uuidv4(),
      ...dto,
      createdBy: 'system', // In a real app, this would come from the authenticated user
      createdAt: now,
      updatedBy: 'system',
      updatedAt: now
    };
    
    // Store the account
    this.accounts.set(account.id, account);
    
    return account;
  }

  /**
   * Update an existing account
   * @param id Account ID
   * @param dto Account update DTO
   * @returns Updated account
   * @throws Error if account not found or validation fails
   */
  async update(id: string, dto: AccountUpdateDto): Promise<Account> {
    // Validate the DTO
    const validationErrors = validateAccountUpdateDto(dto);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Find the existing account
    const existingAccount = await this.findById(id);
    
    // Update the account
    const updatedAccount: Account = {
      ...existingAccount,
      ...dto,
      id, // Ensure ID doesn't change
      updatedBy: 'system', // In a real app, this would come from the authenticated user
      updatedAt: new Date()
    };
    
    // Store the updated account
    this.accounts.set(id, updatedAccount);
    
    return updatedAccount;
  }

  /**
   * Delete an account
   * @param id Account ID
   * @throws Error if account not found
   */
  async delete(id: string): Promise<void> {
    // Check if account exists
    await this.findById(id);
    
    // Delete the account
    this.accounts.delete(id);
    
    // Delete all relationships involving this account
    const relationshipsToDelete: string[] = [];
    
    this.relationships.forEach((relationship, relationshipId) => {
      if (relationship.parentAccountId === id || relationship.childAccountId === id) {
        relationshipsToDelete.push(relationshipId);
      }
    });
    
    relationshipsToDelete.forEach(relationshipId => {
      this.relationships.delete(relationshipId);
    });
  }

  /**
   * Search accounts with the given parameters
   * @param searchParams Search parameters
   * @returns Paginated list of accounts matching the search criteria
   */
  async search(searchParams: SearchParams): Promise<PaginatedResponse<Account>> {
    // Start with all accounts
    let accounts = Array.from(this.accounts.values());
    
    // Optimization: Apply most restrictive filters first to reduce the dataset early
    
    // Apply specific filters first if available to reduce the dataset
    if (searchParams.filters) {
      // Extract high-selectivity filters that can quickly reduce the dataset
      const highSelectivityFilters: AccountFilters = {};
      const remainingFilters: AccountFilters = {};
      
      // Identify high-selectivity filters (those likely to filter out many records)
      for (const [key, value] of Object.entries(searchParams.filters)) {
        if (value === undefined || value === null) continue;
        
        // These filters are typically more selective
        if (['id', 'email', 'phone', 'status', 'type'].includes(key) || 
            key.startsWith('customFields.') || 
            key === 'tags') {
          highSelectivityFilters[key] = value;
        } else {
          remainingFilters[key] = value;
        }
      }
      
      // Apply high-selectivity filters first
      if (Object.keys(highSelectivityFilters).length > 0) {
        accounts = this.applyFilters(accounts, highSelectivityFilters);
      }
      
      // Then apply remaining filters
      if (Object.keys(remainingFilters).length > 0) {
        accounts = this.applyFilters(accounts, remainingFilters);
      }
    }
    
    // Apply search query after initial filtering
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      
      // Optimization: Use a more efficient search approach
      // 1. Create a search index for faster lookups (in a real DB this would be a full-text index)
      // 2. Use a more targeted approach to avoid checking every field for every account
      
      // For demonstration purposes, we'll optimize the in-memory search
      accounts = accounts.filter(account => {
        // Check most commonly searched fields first
        if (account.name.toLowerCase().includes(query)) return true;
        if (account.industry.toLowerCase().includes(query)) return true;
        
        // Only check optional fields if they exist
        if (account.email?.toLowerCase().includes(query)) return true;
        if (account.website?.toLowerCase().includes(query)) return true;
        if (account.description?.toLowerCase().includes(query)) return true;
        
        // Check tags last as it's more expensive (array iteration)
        if (account.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
        
        return false;
      });
    }
    
    // Apply sorting - optimize for common sort fields
    if (searchParams.sort) {
      const { field, direction } = searchParams.sort;
      
      // Optimization: Use specialized sorting for common fields
      if (['name', 'industry', 'type', 'status', 'createdAt', 'updatedAt'].includes(field)) {
        accounts = this.optimizedSorting(accounts, field, direction);
      } else {
        accounts = this.applySorting(accounts, field, direction);
      }
    }
    
    // Apply pagination
    return this.paginateResults(accounts, searchParams.pagination);
  }
  
  /**
   * Optimized sorting for common fields
   * @param accounts List of accounts to sort
   * @param field Field to sort by
   * @param direction Sort direction
   * @returns Sorted list of accounts
   */
  private optimizedSorting(accounts: Account[], field: string, direction: 'asc' | 'desc'): Account[] {
    // Create a specialized comparator function based on the field
    let compareFn: (a: Account, b: Account) => number;
    
    switch (field) {
      case 'name':
        compareFn = (a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          return direction === 'asc' ? 
            nameA.localeCompare(nameB) : 
            nameB.localeCompare(nameA);
        };
        break;
        
      case 'industry':
        compareFn = (a, b) => {
          const industryA = a.industry.toLowerCase();
          const industryB = b.industry.toLowerCase();
          return direction === 'asc' ? 
            industryA.localeCompare(industryB) : 
            industryB.localeCompare(industryA);
        };
        break;
        
      case 'type':
      case 'status':
        compareFn = (a, b) => {
          const valueA = a[field];
          const valueB = b[field];
          if (valueA === valueB) return 0;
          return direction === 'asc' ? 
            (valueA < valueB ? -1 : 1) : 
            (valueA < valueB ? 1 : -1);
        };
        break;
        
      case 'createdAt':
      case 'updatedAt':
        compareFn = (a, b) => {
          const dateA = a[field].getTime();
          const dateB = b[field].getTime();
          return direction === 'asc' ? dateA - dateB : dateB - dateA;
        };
        break;
        
      default:
        // Fallback to generic sorting
        return this.applySorting(accounts, field, direction);
    }
    
    // Sort using the specialized comparator
    return [...accounts].sort(compareFn);
  }

  /**
   * Get relationships for an account
   * @param id Account ID
   * @returns Object containing parent and child relationships
   * @throws Error if account not found
   */
  async getRelationships(id: string): Promise<AccountRelationships> {
    // Check if account exists
    await this.findById(id);
    
    const relationships = Array.from(this.relationships.values());
    
    const parentRelationships = relationships.filter(rel => rel.childAccountId === id);
    const childRelationships = relationships.filter(rel => rel.parentAccountId === id);
    
    return {
      parentRelationships,
      childRelationships
    };
  }

  /**
   * Update relationships for an account
   * @param id Account ID
   * @param relationshipsDto DTO containing relationships to add and remove
   * @returns Updated account relationships
   * @throws Error if account not found or validation fails
   */
  async updateRelationships(id: string, relationshipsDto: RelationshipUpdateDto): Promise<AccountRelationships> {
    // Validate the DTO
    const validationErrors = validateRelationshipUpdateDto(relationshipsDto);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Check if account exists
    await this.findById(id);
    
    // Process relationship additions
    if (relationshipsDto.addRelationships) {
      for (const rel of relationshipsDto.addRelationships) {
        // Check if target account exists
        await this.findById(rel.targetAccountId);
        
        const parentId = rel.isParent ? rel.targetAccountId : id;
        const childId = rel.isParent ? id : rel.targetAccountId;
        
        // Check for circular relationships
        const wouldCreateCircular = await this.checkCircularRelationship(parentId, childId);
        if (wouldCreateCircular) {
          throw new Error(`Adding this relationship would create a circular reference`);
        }
        
        // Check if relationship already exists
        const existingRelationship = await this.checkExistingRelationship(parentId, childId);
        if (existingRelationship) {
          continue; // Skip if relationship already exists
        }
        
        // Create new relationship
        const now = new Date();
        const relationship: AccountRelationship = {
          id: uuidv4(),
          parentAccountId: parentId,
          childAccountId: childId,
          relationshipType: rel.relationshipType,
          createdBy: 'system', // In a real app, this would come from the authenticated user
          createdAt: now,
          updatedBy: 'system',
          updatedAt: now
        };
        
        this.relationships.set(relationship.id, relationship);
      }
    }
    
    // Process relationship removals
    if (relationshipsDto.removeRelationships) {
      for (const relationshipId of relationshipsDto.removeRelationships) {
        // Check if relationship exists
        const relationship = this.relationships.get(relationshipId);
        if (!relationship) {
          throw new Error(`Relationship with ID ${relationshipId} not found`);
        }
        
        // Check if relationship involves the current account
        if (relationship.parentAccountId !== id && relationship.childAccountId !== id) {
          throw new Error(`Relationship with ID ${relationshipId} does not involve account ${id}`);
        }
        
        // Delete the relationship
        this.relationships.delete(relationshipId);
      }
    }
    
    // Return updated relationships
    return this.getRelationships(id);
  }

  /**
   * Check if a relationship exists between two accounts
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if relationship exists, false otherwise
   */
  async checkExistingRelationship(parentId: string, childId: string): Promise<boolean> {
    const relationships = Array.from(this.relationships.values());
    
    return relationships.some(rel => 
      rel.parentAccountId === parentId && rel.childAccountId === childId
    );
  }

  /**
   * Check if adding a relationship would create a circular reference
   * @param parentId Parent account ID
   * @param childId Child account ID
   * @returns True if circular reference would be created, false otherwise
   */
  async checkCircularRelationship(parentId: string, childId: string): Promise<boolean> {
    // If parent and child are the same, it's circular
    if (parentId === childId) {
      return true;
    }
    
    // Check if child is already a parent of parent (direct circular reference)
    const directCircular = await this.checkExistingRelationship(childId, parentId);
    if (directCircular) {
      return true;
    }
    
    // Optimization: Use breadth-first search with early termination
    // This is more efficient for detecting cycles in relationship graphs
    // as it explores nearest neighbors first
    return this.hasCircularPath(childId, parentId);
  }
  
  /**
   * Optimized breadth-first search to check for circular relationships
   * @param startId Starting account ID
   * @param targetId Target account ID
   * @returns True if a circular path exists, false otherwise
   */
  private async hasCircularPath(startId: string, targetId: string): Promise<boolean> {
    // Use a queue for BFS
    const queue: string[] = [startId];
    // Track visited nodes to avoid cycles
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      // Get the next account to check
      const currentId = queue.shift()!;
      
      // Skip if already visited
      if (visited.has(currentId)) {
        continue;
      }
      
      // Mark as visited
      visited.add(currentId);
      
      // Get all parent relationships for this account
      const parentRelationships = Array.from(this.relationships.values())
        .filter(rel => rel.childAccountId === currentId);
      
      // Check each parent
      for (const rel of parentRelationships) {
        const parentId = rel.parentAccountId;
        
        // If parent is the target, we found a circular path
        if (parentId === targetId) {
          return true;
        }
        
        // Add parent to queue for checking
        queue.push(parentId);
      }
    }
    
    // No circular path found
    return false;
  }

  /**
   * Find accounts by specific field value
   * @param field Field name
   * @param value Field value
   * @param pagination Optional pagination parameters
   * @returns Paginated list of matching accounts
   */
  async findByField(field: string, value: any, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    let accounts = Array.from(this.accounts.values());
    
    // Filter by field value
    accounts = accounts.filter(account => {
      const accountValue = account[field as keyof Account];
      
      // Handle different types of values
      if (typeof value === 'string' && typeof accountValue === 'string') {
        return accountValue.toLowerCase() === value.toLowerCase();
      }
      
      return accountValue === value;
    });
    
    // Apply pagination
    return this.paginateResults(accounts, pagination);
  }

  /**
   * Find accounts by tag
   * @param tag Tag to search for
   * @param pagination Optional pagination parameters
   * @returns Paginated list of accounts with the specified tag
   */
  async findByTag(tag: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    let accounts = Array.from(this.accounts.values());
    
    // Filter by tag
    accounts = accounts.filter(account => 
      account.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
    );
    
    // Apply pagination
    return this.paginateResults(accounts, pagination);
  }

  /**
   * Get child accounts for a parent account
   * @param parentId Parent account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of child accounts
   */
  async getChildAccounts(parentId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    // Check if parent account exists
    await this.findById(parentId);
    
    // Get all relationships where this account is the parent
    const relationships = Array.from(this.relationships.values())
      .filter(rel => rel.parentAccountId === parentId);
    
    // Get the child account IDs
    const childIds = relationships.map(rel => rel.childAccountId);
    
    // Get the child accounts
    let childAccounts = childIds.map(id => this.accounts.get(id)!).filter(Boolean);
    
    // Apply pagination
    return this.paginateResults(childAccounts, pagination);
  }

  /**
   * Get parent accounts for a child account
   * @param childId Child account ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of parent accounts
   */
  async getParentAccounts(childId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Account>> {
    // Check if child account exists
    await this.findById(childId);
    
    // Get all relationships where this account is the child
    const relationships = Array.from(this.relationships.values())
      .filter(rel => rel.childAccountId === childId);
    
    // Get the parent account IDs
    const parentIds = relationships.map(rel => rel.parentAccountId);
    
    // Get the parent accounts
    let parentAccounts = parentIds.map(id => this.accounts.get(id)!).filter(Boolean);
    
    // Apply pagination
    return this.paginateResults(parentAccounts, pagination);
  }

  /**
   * Apply filters to a list of accounts
   * @param accounts List of accounts to filter
   * @param filters Filters to apply
   * @returns Filtered list of accounts
   */
  private applyFilters(accounts: Account[], filters: AccountFilters): Account[] {
    return accounts.filter(account => {
      // Check each filter
      for (const [key, value] of Object.entries(filters)) {
        // Skip undefined or null filters
        if (value === undefined || value === null) {
          continue;
        }
        
        switch (key) {
          case 'name':
            if (!account.name.toLowerCase().includes((value as string).toLowerCase())) {
              return false;
            }
            break;
            
          case 'industry':
            if (!account.industry.toLowerCase().includes((value as string).toLowerCase())) {
              return false;
            }
            break;
            
          case 'type':
            if (account.type !== value) {
              return false;
            }
            break;
            
          case 'status':
            if (account.status !== value) {
              return false;
            }
            break;
            
          case 'tags':
            if (!account.tags || !(value as string[]).every(tag => 
              account.tags!.some(t => t.toLowerCase() === tag.toLowerCase())
            )) {
              return false;
            }
            break;
            
          case 'createdAfter':
            if (account.createdAt < (value as Date)) {
              return false;
            }
            break;
            
          case 'createdBefore':
            if (account.createdAt > (value as Date)) {
              return false;
            }
            break;
            
          case 'updatedAfter':
            if (account.updatedAt < (value as Date)) {
              return false;
            }
            break;
            
          case 'updatedBefore':
            if (account.updatedAt > (value as Date)) {
              return false;
            }
            break;
            
          case 'minRevenue':
            if (!account.annualRevenue || account.annualRevenue < (value as number)) {
              return false;
            }
            break;
            
          case 'maxRevenue':
            if (!account.annualRevenue || account.annualRevenue > (value as number)) {
              return false;
            }
            break;
            
          case 'minEmployees':
            if (!account.employeeCount || account.employeeCount < (value as number)) {
              return false;
            }
            break;
            
          case 'maxEmployees':
            if (!account.employeeCount || account.employeeCount > (value as number)) {
              return false;
            }
            break;
            
          default:
            // Handle custom fields
            if (key.startsWith('customFields.')) {
              const customFieldKey = key.substring('customFields.'.length);
              if (!account.customFields || account.customFields[customFieldKey] !== value) {
                return false;
              }
            }
            break;
        }
      }
      
      return true;
    });
  }

  /**
   * Apply sorting to a list of accounts
   * @param accounts List of accounts to sort
   * @param field Field to sort by
   * @param direction Sort direction
   * @returns Sorted list of accounts
   */
  private applySorting(accounts: Account[], field: string, direction: 'asc' | 'desc'): Account[] {
    return [...accounts].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Handle nested fields (e.g., 'billingAddress.country')
      if (field.includes('.')) {
        const parts = field.split('.');
        valueA = parts.reduce((obj, part) => obj && obj[part], a as any);
        valueB = parts.reduce((obj, part) => obj && obj[part], b as any);
      } else {
        valueA = (a as any)[field];
        valueB = (b as any)[field];
      }
      
      // Handle undefined values
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return direction === 'asc' ? -1 : 1;
      if (valueB === undefined) return direction === 'asc' ? 1 : -1;
      
      // Compare values
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Apply pagination to a list of accounts
   * @param accounts List of accounts to paginate
   * @param pagination Pagination parameters
   * @returns Paginated response
   */
  private paginateResults(accounts: Account[], pagination?: PaginationParams): PaginatedResponse<Account> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedItems = accounts.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      total: accounts.length,
      page,
      pageSize,
      totalPages: Math.ceil(accounts.length / pageSize)
    };
  }

  /**
   * Check if there is a path between two accounts in the relationship graph
   * @param startId Starting account ID
   * @param targetId Target account ID
   * @param visited Set of visited account IDs
   * @returns True if a path exists, false otherwise
   */
  private hasPathBetween(startId: string, targetId: string, visited: Set<string>): boolean {
    // If we've already visited this node, stop to prevent infinite recursion
    if (visited.has(startId)) {
      return false;
    }
    
    // Mark current node as visited
    visited.add(startId);
    
    // Get all relationships where this account is the parent
    const childRelationships = Array.from(this.relationships.values())
      .filter(rel => rel.parentAccountId === startId);
    
    // Check each child
    for (const rel of childRelationships) {
      // If child is the target, we found a path
      if (rel.childAccountId === targetId) {
        return true;
      }
      
      // Recursively check if there's a path from this child to the target
      if (this.hasPathBetween(rel.childAccountId, targetId, visited)) {
        return true;
      }
    }
    
    // No path found
    return false;
  }
}