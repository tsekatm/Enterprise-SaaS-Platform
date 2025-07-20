import { IPermissionService } from '../interfaces/IPermissionService';

/**
 * Permission service implementation for access control
 */
export class PermissionService implements IPermissionService {
  // In a real application, this would be connected to a user/role management system
  // For now, we'll use a simple in-memory approach for demonstration
  
  // Map of entity types to roles that can access them
  private entityPermissions: Map<string, EntityPermissions> = new Map();
  
  // Map of user IDs to their roles
  private userRoles: Map<string, string[]> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    // Initialize with some default permissions
    this.setupDefaultPermissions();
  }
  
  /**
   * Check if a user can view an entity
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @returns True if user has permission, false otherwise
   */
  async canView(userId: string, entityType: string, entityId: string): Promise<boolean> {
    // Get entity permissions
    const permissions = this.entityPermissions.get(entityType);
    if (!permissions) {
      return false; // No permissions defined for this entity type
    }
    
    // Get user roles
    const roles = this.getUserRoles(userId);
    if (roles.includes('admin')) {
      return true; // Admins can view everything
    }
    
    // Check if any of the user's roles have view permission
    for (const role of roles) {
      if (permissions.viewRoles.includes(role)) {
        return true;
      }
    }
    
    // Check for specific entity permissions
    return this.hasSpecificEntityPermission(userId, entityType, entityId, 'view');
  }
  
  /**
   * Check if a user can create an entity
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @returns True if user has permission, false otherwise
   */
  async canCreate(userId: string, entityType: string): Promise<boolean> {
    // Get entity permissions
    const permissions = this.entityPermissions.get(entityType);
    if (!permissions) {
      return false; // No permissions defined for this entity type
    }
    
    // Get user roles
    const roles = this.getUserRoles(userId);
    if (roles.includes('admin')) {
      return true; // Admins can create everything
    }
    
    // Check if any of the user's roles have create permission
    for (const role of roles) {
      if (permissions.createRoles.includes(role)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a user can update an entity
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @returns True if user has permission, false otherwise
   */
  async canUpdate(userId: string, entityType: string, entityId: string): Promise<boolean> {
    // Get entity permissions
    const permissions = this.entityPermissions.get(entityType);
    if (!permissions) {
      return false; // No permissions defined for this entity type
    }
    
    // Get user roles
    const roles = this.getUserRoles(userId);
    if (roles.includes('admin')) {
      return true; // Admins can update everything
    }
    
    // Check if any of the user's roles have update permission
    for (const role of roles) {
      if (permissions.updateRoles.includes(role)) {
        return true;
      }
    }
    
    // Check for specific entity permissions
    return this.hasSpecificEntityPermission(userId, entityType, entityId, 'update');
  }
  
  /**
   * Check if a user can delete an entity
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @returns True if user has permission, false otherwise
   */
  async canDelete(userId: string, entityType: string, entityId: string): Promise<boolean> {
    // Get entity permissions
    const permissions = this.entityPermissions.get(entityType);
    if (!permissions) {
      return false; // No permissions defined for this entity type
    }
    
    // Get user roles
    const roles = this.getUserRoles(userId);
    if (roles.includes('admin')) {
      return true; // Admins can delete everything
    }
    
    // Check if any of the user's roles have delete permission
    for (const role of roles) {
      if (permissions.deleteRoles.includes(role)) {
        return true;
      }
    }
    
    // Check for specific entity permissions
    return this.hasSpecificEntityPermission(userId, entityType, entityId, 'delete');
  }
  
  /**
   * Filter entities by permission
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entities Array of entities to filter
   * @returns Filtered array of entities the user has permission to view
   */
  async filterByPermission<T extends { id: string }>(userId: string, entityType: string, entities: T[]): Promise<T[]> {
    // Get user roles
    const roles = this.getUserRoles(userId);
    if (roles.includes('admin')) {
      return entities; // Admins can view everything
    }
    
    // Get entity permissions
    const permissions = this.entityPermissions.get(entityType);
    if (!permissions) {
      return []; // No permissions defined for this entity type
    }
    
    // Check if user has general view permission for this entity type
    let hasGeneralViewPermission = false;
    for (const role of roles) {
      if (permissions.viewRoles.includes(role)) {
        hasGeneralViewPermission = true;
        break;
      }
    }
    
    if (hasGeneralViewPermission) {
      return entities; // User can view all entities of this type
    }
    
    // Filter entities based on specific permissions
    const result: T[] = [];
    for (const entity of entities) {
      if (await this.hasSpecificEntityPermission(userId, entityType, entity.id, 'view')) {
        result.push(entity);
      }
    }
    
    return result;
  }
  
  /**
   * Add a role to a user
   * @param userId User ID
   * @param role Role to add
   */
  addUserRole(userId: string, role: string): void {
    const roles = this.userRoles.get(userId) || [];
    if (!roles.includes(role)) {
      roles.push(role);
      this.userRoles.set(userId, roles);
    }
  }
  
  /**
   * Remove a role from a user
   * @param userId User ID
   * @param role Role to remove
   */
  removeUserRole(userId: string, role: string): void {
    const roles = this.userRoles.get(userId) || [];
    const index = roles.indexOf(role);
    if (index !== -1) {
      roles.splice(index, 1);
      this.userRoles.set(userId, roles);
    }
  }
  
  /**
   * Set permissions for an entity type
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param permissions Permissions configuration
   */
  setEntityPermissions(entityType: string, permissions: EntityPermissions): void {
    this.entityPermissions.set(entityType, permissions);
  }
  
  /**
   * Grant specific permission to a user for a specific entity
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param permission Permission type ('view', 'update', 'delete')
   */
  grantSpecificPermission(userId: string, entityType: string, entityId: string, permission: 'view' | 'update' | 'delete'): void {
    const key = `${entityType}:${entityId}:${permission}`;
    const users = this.specificPermissions.get(key) || [];
    if (!users.includes(userId)) {
      users.push(userId);
      this.specificPermissions.set(key, users);
    }
  }
  
  /**
   * Revoke specific permission from a user for a specific entity
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param permission Permission type ('view', 'update', 'delete')
   */
  revokeSpecificPermission(userId: string, entityType: string, entityId: string, permission: 'view' | 'update' | 'delete'): void {
    const key = `${entityType}:${entityId}:${permission}`;
    const users = this.specificPermissions.get(key) || [];
    const index = users.indexOf(userId);
    if (index !== -1) {
      users.splice(index, 1);
      this.specificPermissions.set(key, users);
    }
  }
  
  /**
   * Get roles for a user
   * @param userId User ID
   * @returns Array of roles
   */
  private getUserRoles(userId: string): string[] {
    return this.userRoles.get(userId) || ['user']; // Default to 'user' role
  }
  
  /**
   * Check if a user has specific permission for an entity
   * @param userId User ID
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param permission Permission type ('view', 'update', 'delete')
   * @returns True if user has permission, false otherwise
   */
  private hasSpecificEntityPermission(userId: string, entityType: string, entityId: string, permission: 'view' | 'update' | 'delete'): boolean {
    const key = `${entityType}:${entityId}:${permission}`;
    const users = this.specificPermissions.get(key) || [];
    return users.includes(userId);
  }
  
  /**
   * Set up default permissions
   */
  private setupDefaultPermissions(): void {
    // Set up entity permissions
    this.setEntityPermissions('account', {
      viewRoles: ['user', 'sales', 'manager'],
      createRoles: ['sales', 'manager'],
      updateRoles: ['sales', 'manager'],
      deleteRoles: ['manager']
    });
    
    // Set up user roles
    this.userRoles.set('admin-user', ['admin']);
    this.userRoles.set('manager-user', ['manager']);
    this.userRoles.set('sales-user', ['sales']);
    this.userRoles.set('regular-user', ['user']);
  }
  
  // Map of specific entity permissions
  // Key format: entityType:entityId:permission
  // Value: Array of user IDs
  private specificPermissions: Map<string, string[]> = new Map();
}

/**
 * Entity permissions configuration
 */
export interface EntityPermissions {
  viewRoles: string[];
  createRoles: string[];
  updateRoles: string[];
  deleteRoles: string[];
}