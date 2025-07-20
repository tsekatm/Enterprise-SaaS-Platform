/**
 * Permission service interface for access control
 */
export interface IPermissionService {
  /**
   * Check if a user can view an entity
   */
  canView(userId: string, entityType: string, entityId: string): Promise<boolean>;
  
  /**
   * Check if a user can create an entity
   */
  canCreate(userId: string, entityType: string): Promise<boolean>;
  
  /**
   * Check if a user can update an entity
   */
  canUpdate(userId: string, entityType: string, entityId: string): Promise<boolean>;
  
  /**
   * Check if a user can delete an entity
   */
  canDelete(userId: string, entityType: string, entityId: string): Promise<boolean>;
  
  /**
   * Filter entities by permission
   */
  filterByPermission<T extends { id: string }>(userId: string, entityType: string, entities: T[]): Promise<T[]>;
}