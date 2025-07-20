import { AccountController } from '../AccountController';
import { IAccountService } from '../../interfaces/account/IAccountService';
import { IAuditService } from '../../interfaces/IAuditService';
import { IPermissionService } from '../../interfaces/IPermissionService';
import { Account } from '../../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../../models/dto/AccountDto';
import { AccountStatus, AccountType } from '../../models/enums/AccountEnums';
import { AccountRelationships } from '../../models/AccountRelationship';
import { RelationshipType } from '../../models/enums/RelationshipEnums';
import { ValidationResult } from '../../interfaces/IService';

// Mock services
const mockAccountService = {
  getAccounts: jest.fn(),
  getAccountById: jest.fn(),
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
  deleteAccount: jest.fn(),
  searchAccounts: jest.fn(),
  getAccountRelationships: jest.fn(),
  updateAccountRelationships: jest.fn(),
  validateAccountData: jest.fn(),
  checkCircularRelationships: jest.fn(),
  getChildAccounts: jest.fn(),
  getParentAccounts: jest.fn(),
  getAccountActivity: jest.fn(),
  hasPermission: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  validate: jest.fn()
} as unknown as IAccountService;

const mockAuditService = {
  logCreation: jest.fn(),
  logUpdate: jest.fn(),
  logDeletion: jest.fn(),
  logAccess: jest.fn(),
  getAuditTrail: jest.fn(),
  getAuditEntriesByUser: jest.fn(),
  getAuditEntriesByAction: jest.fn(),
  getAuditEntriesByDateRange: jest.fn(),
  exportAuditData: jest.fn(),
  deleteAuditData: jest.fn()
} as unknown as IAuditService;

const mockPermissionService = {
  canView: jest.fn(),
  canCreate: jest.fn(),
  canUpdate: jest.fn(),
  canDelete: jest.fn(),
  filterByPermission: jest.fn()
} as unknown as IPermissionService;

// Sample data
const sampleAccount: Account = {
  id: '1',
  name: 'Acme Corporation',
  industry: 'Technology',
  type: AccountType.CUSTOMER,
  status: AccountStatus.ACTIVE,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedBy: 'user-1',
  updatedAt: new Date()
};

const sampleAccountCreateDto: AccountCreateDto = {
  name: 'Acme Corporation',
  industry: 'Technology',
  type: AccountType.CUSTOMER,
  status: AccountStatus.ACTIVE
};

const sampleAccountUpdateDto: AccountUpdateDto = {
  name: 'Acme Corporation Updated',
  industry: 'Software'
};

const sampleRelationships: AccountRelationships = {
  parentRelationships: [
    {
      id: 'rel-1',
      parentAccountId: 'parent-1',
      childAccountId: '1',
      relationshipType: RelationshipType.PARENT_CHILD,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedBy: 'user-1',
      updatedAt: new Date()
    }
  ],
  childRelationships: [
    {
      id: 'rel-2',
      parentAccountId: '1',
      childAccountId: 'child-1',
      relationshipType: RelationshipType.PARENT_CHILD,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedBy: 'user-1',
      updatedAt: new Date()
    }
  ]
};

const sampleRelationshipUpdateDto: RelationshipUpdateDto = {
  addRelationships: [
    {
      targetAccountId: 'new-child-1',
      relationshipType: RelationshipType.PARENT_CHILD,
      isParent: false
    }
  ],
  removeRelationships: ['rel-2']
};

describe('AccountController', () => {
  let controller: AccountController;
  
  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AccountController(mockAccountService, mockAuditService, mockPermissionService);
    
    // Default permission responses
    mockPermissionService.canView.mockResolvedValue(true);
    mockPermissionService.canCreate.mockResolvedValue(true);
    mockPermissionService.canUpdate.mockResolvedValue(true);
    mockPermissionService.canDelete.mockResolvedValue(true);
    mockPermissionService.filterByPermission.mockImplementation((userId, entityType, entities) => Promise.resolve(entities));
    
    // Default validation response
    mockAccountService.validateAccountData.mockReturnValue({ isValid: true, errors: [] });
  });
  
  describe('getAll', () => {
    it('should return accounts when user has permission', async () => {
      // Arrange
      const accounts = [sampleAccount];
      mockAccountService.getAccounts.mockResolvedValue({
        items: accounts,
        total: accounts.length,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
      
      // Act
      const result = await controller.getAll();
      
      // Assert
      expect(mockPermissionService.canCreate).toHaveBeenCalledWith('current-user', 'account');
      expect(mockAccountService.getAccounts).toHaveBeenCalled();
      expect(mockPermissionService.filterByPermission).toHaveBeenCalledWith('current-user', 'account', accounts);
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result.items).toEqual(accounts);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canCreate.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getAll()).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.getAccounts).not.toHaveBeenCalled();
    });
  });
  
  describe('getById', () => {
    it('should return account when user has permission', async () => {
      // Arrange
      mockAccountService.getAccountById.mockResolvedValue(sampleAccount);
      
      // Act
      const result = await controller.getById('1');
      
      // Assert
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getAccountById).toHaveBeenCalledWith('1');
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result).toEqual(sampleAccount);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getById('1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.getAccountById).not.toHaveBeenCalled();
    });
    
    it('should handle not found error', async () => {
      // Arrange
      mockAccountService.getAccountById.mockRejectedValue(new Error('Account not found'));
      
      // Act & Assert
      await expect(controller.getById('1')).rejects.toMatchObject({
        status: 404,
        code: 'NOT_FOUND'
      });
    });
  });
  
  describe('create', () => {
    it('should create account when user has permission and data is valid', async () => {
      // Arrange
      mockAccountService.createAccount.mockResolvedValue(sampleAccount);
      
      // Act
      const result = await controller.create(sampleAccountCreateDto);
      
      // Assert
      expect(mockPermissionService.canCreate).toHaveBeenCalledWith('current-user', 'account');
      expect(mockAccountService.validateAccountData).toHaveBeenCalledWith(sampleAccountCreateDto);
      expect(mockAccountService.createAccount).toHaveBeenCalledWith(sampleAccountCreateDto, 'current-user');
      expect(mockAuditService.logCreation).toHaveBeenCalledWith('account', '1', sampleAccount, 'current-user');
      expect(result).toEqual(sampleAccount);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canCreate.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.create(sampleAccountCreateDto)).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.createAccount).not.toHaveBeenCalled();
    });
    
    it('should throw error when validation fails', async () => {
      // Arrange
      mockAccountService.validateAccountData.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Name is required' }]
      });
      
      // Act & Assert
      await expect(controller.create(sampleAccountCreateDto)).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR'
      });
      expect(mockAccountService.createAccount).not.toHaveBeenCalled();
    });
  });
  
  describe('update', () => {
    it('should update account when user has permission and data is valid', async () => {
      // Arrange
      mockAccountService.getAccountById.mockResolvedValue(sampleAccount);
      mockAccountService.updateAccount.mockResolvedValue({
        ...sampleAccount,
        ...sampleAccountUpdateDto
      });
      
      // Act
      const result = await controller.update('1', sampleAccountUpdateDto);
      
      // Assert
      expect(mockPermissionService.canUpdate).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.validateAccountData).toHaveBeenCalledWith(sampleAccountUpdateDto);
      expect(mockAccountService.getAccountById).toHaveBeenCalledWith('1');
      expect(mockAccountService.updateAccount).toHaveBeenCalledWith('1', sampleAccountUpdateDto, 'current-user');
      expect(mockAuditService.logUpdate).toHaveBeenCalled();
      expect(result).toEqual({
        ...sampleAccount,
        ...sampleAccountUpdateDto
      });
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canUpdate.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.update('1', sampleAccountUpdateDto)).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.updateAccount).not.toHaveBeenCalled();
    });
    
    it('should throw error when validation fails', async () => {
      // Arrange
      mockAccountService.validateAccountData.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Name is required' }]
      });
      
      // Act & Assert
      await expect(controller.update('1', sampleAccountUpdateDto)).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR'
      });
      expect(mockAccountService.updateAccount).not.toHaveBeenCalled();
    });
  });
  
  describe('delete', () => {
    it('should delete account when user has permission', async () => {
      // Arrange
      mockAccountService.getAccountById.mockResolvedValue(sampleAccount);
      
      // Act
      await controller.delete('1');
      
      // Assert
      expect(mockPermissionService.canDelete).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getAccountById).toHaveBeenCalledWith('1');
      expect(mockAccountService.deleteAccount).toHaveBeenCalledWith('1', 'current-user');
      expect(mockAuditService.logDeletion).toHaveBeenCalledWith('account', '1', 'current-user');
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canDelete.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.delete('1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.deleteAccount).not.toHaveBeenCalled();
    });
    
    it('should handle dependency error', async () => {
      // Arrange
      mockAccountService.getAccountById.mockResolvedValue(sampleAccount);
      mockAccountService.deleteAccount.mockRejectedValue(new Error('Cannot delete account with ID 1 because it has dependencies'));
      
      // Act & Assert
      await expect(controller.delete('1')).rejects.toMatchObject({
        status: 400,
        code: 'DEPENDENCY_ERROR'
      });
    });
  });
  
  describe('searchAccounts', () => {
    it('should return search results when user has permission', async () => {
      // Arrange
      const accounts = [sampleAccount];
      mockAccountService.searchAccounts.mockResolvedValue({
        items: accounts,
        total: accounts.length,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
      
      // Act
      const result = await controller.searchAccounts({ query: 'acme' });
      
      // Assert
      expect(mockPermissionService.canCreate).toHaveBeenCalledWith('current-user', 'account');
      expect(mockAccountService.searchAccounts).toHaveBeenCalledWith({
        query: 'acme',
        pagination: { page: 1, pageSize: 10 },
        sort: { field: 'name', direction: 'asc' }
      });
      expect(mockPermissionService.filterByPermission).toHaveBeenCalledWith('current-user', 'account', accounts);
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result.items).toEqual(accounts);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.searchTime).toBeDefined();
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canCreate.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.searchAccounts({ query: 'acme' })).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.searchAccounts).not.toHaveBeenCalled();
    });
    
    it('should throw error when search parameters are invalid', async () => {
      // Arrange
      const invalidSearchParams = {
        query: 'acme',
        pagination: { page: 0, pageSize: 200 }, // Invalid pagination
        sort: { field: 'invalid', direction: 'invalid' } // Invalid sort
      };
      
      // Act & Assert
      await expect(controller.searchAccounts(invalidSearchParams)).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR'
      });
      expect(mockAccountService.searchAccounts).not.toHaveBeenCalled();
    });
    
    it('should log warning when search time exceeds 200ms', async () => {
      // Arrange
      const accounts = [sampleAccount];
      mockAccountService.searchAccounts.mockImplementation(async () => {
        // Simulate a slow search operation
        await new Promise(resolve => setTimeout(resolve, 250));
        return {
          items: accounts,
          total: accounts.length,
          page: 1,
          pageSize: 10,
          totalPages: 1
        };
      });
      
      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Act
      await controller.searchAccounts({ query: 'acme' });
      
      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds the 200ms requirement'));
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });
  });
  
  describe('searchAccountsAdvanced', () => {
    it('should return filtered search results when user has permission', async () => {
      // Arrange
      const accounts = [sampleAccount];
      mockAccountService.searchAccounts.mockResolvedValue({
        items: accounts,
        total: accounts.length,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
      
      const filters = {
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        industry: 'Technology'
      };
      
      const pagination = { page: 1, pageSize: 20 };
      const sort = { field: 'name', direction: 'desc' as const };
      
      // Act
      const result = await controller.searchAccountsAdvanced(filters, pagination, sort);
      
      // Assert
      expect(mockPermissionService.canCreate).toHaveBeenCalledWith('current-user', 'account');
      expect(mockAccountService.searchAccounts).toHaveBeenCalledWith({
        query: '',
        filters,
        pagination,
        sort
      });
      expect(mockPermissionService.filterByPermission).toHaveBeenCalledWith('current-user', 'account', accounts);
      expect(result.items).toEqual(accounts);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.searchTime).toBeDefined();
      expect(result.metadata.appliedFilters).toBe(3); // Number of filters applied
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canCreate.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.searchAccountsAdvanced({}, { page: 1, pageSize: 10 })).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.searchAccounts).not.toHaveBeenCalled();
    });
    
    it('should throw error when filters are invalid', async () => {
      // Arrange
      const invalidFilters = {
        type: 'INVALID_TYPE', // Invalid type
        status: 'INVALID_STATUS', // Invalid status
        annualRevenue: { min: 'not-a-number' } // Invalid number
      };
      
      // Act & Assert
      await expect(controller.searchAccountsAdvanced(invalidFilters, { page: 1, pageSize: 10 })).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR'
      });
      expect(mockAccountService.searchAccounts).not.toHaveBeenCalled();
    });
    
    it('should use default sort when not provided', async () => {
      // Arrange
      const accounts = [sampleAccount];
      mockAccountService.searchAccounts.mockResolvedValue({
        items: accounts,
        total: accounts.length,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
      
      // Act
      await controller.searchAccountsAdvanced({}, { page: 1, pageSize: 10 });
      
      // Assert
      expect(mockAccountService.searchAccounts).toHaveBeenCalledWith(expect.objectContaining({
        sort: { field: 'name', direction: 'asc' }
      }));
    });
  });
  
  describe('getSearchFilterOptions', () => {
    it('should return filter options when user has permission', async () => {
      // Act
      const result = await controller.getSearchFilterOptions();
      
      // Assert
      expect(mockPermissionService.canCreate).toHaveBeenCalledWith('current-user', 'account');
      expect(result).toHaveProperty('accountTypes');
      expect(result).toHaveProperty('accountStatuses');
      expect(result).toHaveProperty('industries');
      expect(result).toHaveProperty('sortFields');
      expect(result.accountTypes).toEqual(Object.values(AccountType));
      expect(result.accountStatuses).toEqual(Object.values(AccountStatus));
      expect(result.industries).toContain('Technology');
      expect(result.sortFields).toHaveLength(6);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canCreate.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getSearchFilterOptions()).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
    });
  });
  
  describe('getAccountRelationships', () => {
    it('should return relationships when user has permission', async () => {
      // Arrange
      mockAccountService.getAccountRelationships.mockResolvedValue(sampleRelationships);
      
      // Act
      const result = await controller.getAccountRelationships('1');
      
      // Assert
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getAccountRelationships).toHaveBeenCalledWith('1');
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result).toEqual(sampleRelationships);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getAccountRelationships('1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.getAccountRelationships).not.toHaveBeenCalled();
    });
  });
  
  describe('updateAccountRelationships', () => {
    it('should update relationships when user has permission', async () => {
      // Arrange
      mockAccountService.getAccountRelationships.mockResolvedValue(sampleRelationships);
      mockAccountService.checkCircularRelationships.mockResolvedValue(false);
      mockAccountService.updateAccountRelationships.mockResolvedValue({
        ...sampleRelationships,
        childRelationships: [
          ...sampleRelationships.childRelationships,
          {
            id: 'new-rel',
            parentAccountId: '1',
            childAccountId: 'new-child-1',
            relationshipType: RelationshipType.PARENT_CHILD,
            createdBy: 'current-user',
            createdAt: expect.any(Date),
            updatedBy: 'current-user',
            updatedAt: expect.any(Date)
          }
        ]
      });
      
      // Act
      const result = await controller.updateAccountRelationships('1', sampleRelationshipUpdateDto);
      
      // Assert
      expect(mockPermissionService.canUpdate).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getAccountRelationships).toHaveBeenCalledWith('1');
      expect(mockAccountService.checkCircularRelationships).toHaveBeenCalled();
      expect(mockAccountService.updateAccountRelationships).toHaveBeenCalledWith('1', sampleRelationshipUpdateDto, 'current-user');
      expect(mockAuditService.logUpdate).toHaveBeenCalled();
      expect(result.childRelationships.length).toBeGreaterThan(sampleRelationships.childRelationships.length);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canUpdate.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.updateAccountRelationships('1', sampleRelationshipUpdateDto)).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.updateAccountRelationships).not.toHaveBeenCalled();
    });
    
    it('should throw error when validation fails', async () => {
      // Arrange
      const invalidDto = {
        addRelationships: [
          {
            targetAccountId: '', // Invalid: empty ID
            relationshipType: undefined, // Invalid: missing type
            isParent: false
          }
        ],
        removeRelationships: []
      } as unknown as RelationshipUpdateDto;
      
      // Act & Assert
      await expect(controller.updateAccountRelationships('1', invalidDto)).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR'
      });
      expect(mockAccountService.updateAccountRelationships).not.toHaveBeenCalled();
    });
    
    it('should detect circular relationships before updating', async () => {
      // Arrange
      mockAccountService.getAccountRelationships.mockResolvedValue(sampleRelationships);
      mockAccountService.checkCircularRelationships.mockResolvedValue(true);
      
      // Act & Assert
      await expect(controller.updateAccountRelationships('1', sampleRelationshipUpdateDto)).rejects.toMatchObject({
        status: 400,
        code: 'CIRCULAR_REFERENCE',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'addRelationships',
            error: 'Circular reference detected'
          })
        ])
      });
      expect(mockAccountService.updateAccountRelationships).not.toHaveBeenCalled();
    });
  });
  
  describe('getAccountRelationshipHierarchy', () => {
    it('should return relationship hierarchy when user has permission', async () => {
      // Arrange
      mockAccountService.getAccountById.mockResolvedValue(sampleAccount);
      mockAccountService.getAccountRelationships.mockResolvedValue(sampleRelationships);
      
      // Mock the hierarchy building process
      const mockHierarchy = {
        id: '1',
        name: 'Acme Corporation',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        parents: [
          {
            id: 'parent-1',
            name: 'Parent Corp',
            type: AccountType.CUSTOMER,
            status: AccountStatus.ACTIVE,
            relationshipType: RelationshipType.PARENT_CHILD,
            parents: [],
            children: []
          }
        ],
        children: [
          {
            id: 'child-1',
            name: 'Child Corp',
            type: AccountType.CUSTOMER,
            status: AccountStatus.ACTIVE,
            relationshipType: RelationshipType.PARENT_CHILD,
            parents: [],
            children: []
          }
        ]
      };
      
      // Mock implementation to return the hierarchy
      mockAccountService.getAccountById.mockImplementation(async (id) => {
        if (id === '1') return sampleAccount;
        if (id === 'parent-1') {
          return {
            id: 'parent-1',
            name: 'Parent Corp',
            type: AccountType.CUSTOMER,
            status: AccountStatus.ACTIVE,
            createdBy: 'user-1',
            createdAt: new Date(),
            updatedBy: 'user-1',
            updatedAt: new Date()
          };
        }
        if (id === 'child-1') {
          return {
            id: 'child-1',
            name: 'Child Corp',
            type: AccountType.CUSTOMER,
            status: AccountStatus.ACTIVE,
            createdBy: 'user-1',
            createdAt: new Date(),
            updatedBy: 'user-1',
            updatedAt: new Date()
          };
        }
        throw new Error(`Account not found: ${id}`);
      });
      
      mockAccountService.getAccountRelationships.mockImplementation(async (id) => {
        if (id === '1') return sampleRelationships;
        return { parentRelationships: [], childRelationships: [] };
      });
      
      // Act
      const result = await controller.getAccountRelationshipHierarchy('1', 2);
      
      // Assert
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getAccountById).toHaveBeenCalledWith('1');
      expect(mockAccountService.getAccountRelationships).toHaveBeenCalled();
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.parents).toBeDefined();
      expect(result.children).toBeDefined();
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getAccountRelationshipHierarchy('1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.getAccountById).not.toHaveBeenCalled();
    });
    
    it('should throw error when depth is invalid', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(true);
      
      // Act & Assert
      await expect(controller.getAccountRelationshipHierarchy('1', 6)).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'depth',
            error: 'Depth must be between 1 and 5'
          })
        ])
      });
      expect(mockAccountService.getAccountById).not.toHaveBeenCalled();
    });
  });
  
  describe('checkCircularRelationship', () => {
    it('should check for circular relationships when user has permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(true);
      mockAccountService.checkCircularRelationships.mockResolvedValue(false);
      
      // Act
      const result = await controller.checkCircularRelationship('parent-1', 'child-1');
      
      // Assert
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', 'parent-1');
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', 'child-1');
      expect(mockAccountService.checkCircularRelationships).toHaveBeenCalledWith('parent-1', 'child-1');
      expect(result.wouldCreateCircular).toBe(false);
      expect(result.path).toBeUndefined();
    });
    
    it('should detect circular relationships', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(true);
      mockAccountService.checkCircularRelationships.mockResolvedValue(true);
      
      // Act
      const result = await controller.checkCircularRelationship('parent-1', 'child-1');
      
      // Assert
      expect(mockAccountService.checkCircularRelationships).toHaveBeenCalledWith('parent-1', 'child-1');
      expect(result.wouldCreateCircular).toBe(true);
      expect(result.path).toBeDefined();
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.checkCircularRelationship('parent-1', 'child-1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.checkCircularRelationships).not.toHaveBeenCalled();
    });
  });
  
  describe('getAccountActivity', () => {
    it('should return activity when user has permission', async () => {
      // Arrange
      const activity = {
        items: [{ id: 'act-1', accountId: '1', action: 'update' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
      mockAccountService.getAccountActivity.mockResolvedValue(activity);
      
      // Act
      const result = await controller.getAccountActivity('1');
      
      // Assert
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getAccountActivity).toHaveBeenCalledWith('1', undefined);
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result).toEqual(activity);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getAccountActivity('1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.getAccountActivity).not.toHaveBeenCalled();
    });
  });
  
  describe('getChildAccounts', () => {
    it('should return child accounts when user has permission', async () => {
      // Arrange
      const childAccounts = {
        items: [{ id: 'child-1', name: 'Child Account' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
      mockAccountService.getChildAccounts.mockResolvedValue(childAccounts);
      
      // Act
      const result = await controller.getChildAccounts('1');
      
      // Assert
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getChildAccounts).toHaveBeenCalledWith('1', undefined);
      expect(mockPermissionService.filterByPermission).toHaveBeenCalledWith('current-user', 'account', childAccounts.items);
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result.items).toEqual(childAccounts.items);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getChildAccounts('1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.getChildAccounts).not.toHaveBeenCalled();
    });
  });
  
  describe('getParentAccounts', () => {
    it('should return parent accounts when user has permission', async () => {
      // Arrange
      const parentAccounts = {
        items: [{ id: 'parent-1', name: 'Parent Account' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
      mockAccountService.getParentAccounts.mockResolvedValue(parentAccounts);
      
      // Act
      const result = await controller.getParentAccounts('1');
      
      // Assert
      expect(mockPermissionService.canView).toHaveBeenCalledWith('current-user', 'account', '1');
      expect(mockAccountService.getParentAccounts).toHaveBeenCalledWith('1', undefined);
      expect(mockPermissionService.filterByPermission).toHaveBeenCalledWith('current-user', 'account', parentAccounts.items);
      expect(mockAuditService.logAccess).toHaveBeenCalledWith('account', '1', 'current-user');
      expect(result.items).toEqual(parentAccounts.items);
    });
    
    it('should throw error when user does not have permission', async () => {
      // Arrange
      mockPermissionService.canView.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.getParentAccounts('1')).rejects.toMatchObject({
        status: 403,
        code: 'PERMISSION_DENIED'
      });
      expect(mockAccountService.getParentAccounts).not.toHaveBeenCalled();
    });
  });
});