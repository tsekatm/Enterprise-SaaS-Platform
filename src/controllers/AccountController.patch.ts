// Add this import at the top of the file
import { ResponseOptimizer } from '../utils/ResponseOptimizer';

// Replace the getAll method with this optimized version
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
    
    // Return optimized filtered accounts
    return ResponseOptimizer.optimizePaginatedResponse({
      ...accounts,
      items: filteredAccounts,
      total: filteredAccounts.length
    });
  } catch (error) {
    throw this.handleError(error);
  }
}

// Replace the getById method with this optimized version
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
    
    // Return optimized account
    return ResponseOptimizer.optimizeForSerialization(account) as Account;
  } catch (error) {
    throw this.handleError(error);
  }
}

// Replace the searchAccounts method with this optimized version
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
    
    // Return optimized filtered accounts
    return ResponseOptimizer.optimizePaginatedResponse({
      ...accounts,
      items: filteredAccounts,
      total: filteredAccounts.length,
      metadata: {
        ...accounts.metadata,
        searchTime
      }
    });
  } catch (error) {
    throw this.handleError(error);
  }
}

// Replace the getAccountRelationships method with this optimized version
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
    
    // Return optimized relationships
    return ResponseOptimizer.optimizeForSerialization(relationships) as AccountRelationships;
  } catch (error) {
    throw this.handleError(error);
  }
}