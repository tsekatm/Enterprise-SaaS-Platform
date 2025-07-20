import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionService } from '../PermissionService';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  
  const adminUserId = 'admin-user';
  const managerUserId = 'manager-user';
  const salesUserId = 'sales-user';
  const regularUserId = 'regular-user';
  const unauthorizedUserId = 'unauthorized-user';
  
  const accountId = 'account-123';
  const entityType = 'account';
  
  beforeEach(() => {
    permissionService = new PermissionService();
  });
  
  describe('canView', () => {
    it('should allow admin to view any entity', async () => {
      const result = await permissionService.canView(adminUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should allow manager to view accounts', async () => {
      const result = await permissionService.canView(managerUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should allow sales to view accounts', async () => {
      const result = await permissionService.canView(salesUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should allow regular user to view accounts', async () => {
      const result = await permissionService.canView(regularUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should allow user with specific permission to view an entity', async () => {
      permissionService.grantSpecificPermission(unauthorizedUserId, entityType, accountId, 'view');
      const result = await permissionService.canView(unauthorizedUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should deny view permission for unknown entity type', async () => {
      const result = await permissionService.canView(regularUserId, 'unknown', accountId);
      expect(result).toBe(false);
    });
  });
  
  describe('canCreate', () => {
    it('should allow admin to create any entity', async () => {
      const result = await permissionService.canCreate(adminUserId, entityType);
      expect(result).toBe(true);
    });
    
    it('should allow manager to create accounts', async () => {
      const result = await permissionService.canCreate(managerUserId, entityType);
      expect(result).toBe(true);
    });
    
    it('should allow sales to create accounts', async () => {
      const result = await permissionService.canCreate(salesUserId, entityType);
      expect(result).toBe(true);
    });
    
    it('should deny regular user from creating accounts', async () => {
      const result = await permissionService.canCreate(regularUserId, entityType);
      expect(result).toBe(false);
    });
    
    it('should deny create permission for unknown entity type', async () => {
      const result = await permissionService.canCreate(managerUserId, 'unknown');
      expect(result).toBe(false);
    });
  });
  
  describe('canUpdate', () => {
    it('should allow admin to update any entity', async () => {
      const result = await permissionService.canUpdate(adminUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should allow manager to update accounts', async () => {
      const result = await permissionService.canUpdate(managerUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should allow sales to update accounts', async () => {
      const result = await permissionService.canUpdate(salesUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should deny regular user from updating accounts', async () => {
      const result = await permissionService.canUpdate(regularUserId, entityType, accountId);
      expect(result).toBe(false);
    });
    
    it('should allow user with specific permission to update an entity', async () => {
      permissionService.grantSpecificPermission(unauthorizedUserId, entityType, accountId, 'update');
      const result = await permissionService.canUpdate(unauthorizedUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should deny update permission for unknown entity type', async () => {
      const result = await permissionService.canUpdate(managerUserId, 'unknown', accountId);
      expect(result).toBe(false);
    });
  });
  
  describe('canDelete', () => {
    it('should allow admin to delete any entity', async () => {
      const result = await permissionService.canDelete(adminUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should allow manager to delete accounts', async () => {
      const result = await permissionService.canDelete(managerUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should deny sales from deleting accounts', async () => {
      const result = await permissionService.canDelete(salesUserId, entityType, accountId);
      expect(result).toBe(false);
    });
    
    it('should deny regular user from deleting accounts', async () => {
      const result = await permissionService.canDelete(regularUserId, entityType, accountId);
      expect(result).toBe(false);
    });
    
    it('should allow user with specific permission to delete an entity', async () => {
      permissionService.grantSpecificPermission(unauthorizedUserId, entityType, accountId, 'delete');
      const result = await permissionService.canDelete(unauthorizedUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should deny delete permission for unknown entity type', async () => {
      const result = await permissionService.canDelete(managerUserId, 'unknown', accountId);
      expect(result).toBe(false);
    });
  });
  
  describe('filterByPermission', () => {
    const entities = [
      { id: 'account-1', name: 'Account 1' },
      { id: 'account-2', name: 'Account 2' },
      { id: 'account-3', name: 'Account 3' }
    ];
    
    it('should return all entities for admin', async () => {
      const result = await permissionService.filterByPermission(adminUserId, entityType, entities);
      expect(result).toEqual(entities);
    });
    
    it('should return all entities for users with general view permission', async () => {
      const result = await permissionService.filterByPermission(salesUserId, entityType, entities);
      expect(result).toEqual(entities);
    });
    
    it('should return only entities with specific permissions for unauthorized user', async () => {
      permissionService.grantSpecificPermission(unauthorizedUserId, entityType, 'account-1', 'view');
      permissionService.grantSpecificPermission(unauthorizedUserId, entityType, 'account-3', 'view');
      
      const result = await permissionService.filterByPermission(unauthorizedUserId, entityType, entities);
      expect(result).toEqual([entities[0], entities[2]]);
    });
    
    it('should return empty array for unknown entity type', async () => {
      const result = await permissionService.filterByPermission(salesUserId, 'unknown', entities);
      expect(result).toEqual([]);
    });
  });
  
  describe('Role management', () => {
    it('should add role to user', async () => {
      permissionService.addUserRole(unauthorizedUserId, 'sales');
      const result = await permissionService.canCreate(unauthorizedUserId, entityType);
      expect(result).toBe(true);
    });
    
    it('should remove role from user', async () => {
      permissionService.addUserRole(unauthorizedUserId, 'sales');
      permissionService.removeUserRole(unauthorizedUserId, 'sales');
      const result = await permissionService.canCreate(unauthorizedUserId, entityType);
      expect(result).toBe(false);
    });
  });
  
  describe('Permission management', () => {
    it('should grant specific permission to user', async () => {
      permissionService.grantSpecificPermission(unauthorizedUserId, entityType, accountId, 'update');
      const result = await permissionService.canUpdate(unauthorizedUserId, entityType, accountId);
      expect(result).toBe(true);
    });
    
    it('should revoke specific permission from user', async () => {
      permissionService.grantSpecificPermission(unauthorizedUserId, entityType, accountId, 'update');
      permissionService.revokeSpecificPermission(unauthorizedUserId, entityType, accountId, 'update');
      const result = await permissionService.canUpdate(unauthorizedUserId, entityType, accountId);
      expect(result).toBe(false);
    });
    
    it('should set entity permissions', async () => {
      permissionService.setEntityPermissions('custom', {
        viewRoles: ['custom-role'],
        createRoles: ['custom-role'],
        updateRoles: ['custom-role'],
        deleteRoles: ['custom-role']
      });
      
      permissionService.addUserRole(unauthorizedUserId, 'custom-role');
      
      const result = await permissionService.canView(unauthorizedUserId, 'custom', 'entity-id');
      expect(result).toBe(true);
    });
  });
});