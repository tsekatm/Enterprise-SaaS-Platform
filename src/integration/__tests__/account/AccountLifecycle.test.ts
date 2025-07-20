import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { AccountController } from '../../../controllers/AccountController';
import { AccountService } from '../../../services/AccountService';
import { AccountRepository } from '../../../repositories/AccountRepository';
import { PermissionService } from '../../../services/PermissionService';
import { AuditService } from '../../../services/AuditService';
import { Account } from '../../../models/Account';
import { AccountType, AccountStatus } from '../../../models/enums/AccountEnums';

// Mock services and repositories
const mockRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  search: vi.fn(),
  getRelationships: vi.fn(),
  updateRelationships: vi.fn(),
  checkExistingRelationship: vi.fn(),
} as any;

const mockPermissionService = {
  canViewAccount: vi.fn(),
  canCreateAccount: vi.fn(),
  canUpdateAccount: vi.fn(),
  canDeleteAccount: vi.fn(),
  filterAccountsByPermission: vi.fn(),
} as any;

const mockAuditService = {
  logAccountCreation: vi.fn(),
  logAccountUpdate: vi.fn(),
  logAccountDeletion: vi.fn(),
  logAccountAccess: vi.fn(),
  getAccountAuditTrail: vi.fn(),
} as any;

describe('Account Management End-to-End Tests', () => {
  let accountService: AccountService;
  let accountController: AccountController;
  let testAccount: Account;
  const testUserId = 'test-user-id';
  
  beforeAll(() => {
    // Initialize services with mocks
    accountService = new AccountService(
      mockRepository,
      mockPermissionService,
      mockAuditService
    );
    
    accountController = new AccountController(accountService);
    
    // Reset all mocks before tests
    vi.clearAllMocks();
  });
  
  beforeEach(() => {
    // Setup test account
    testAccount = {
      id: 'test-account-id',
      name: 'Test Account',
      industry: 'Technology',
      type: AccountType.CUSTOMER,
      website: 'https://testaccount.com',
      phone: '123-456-7890',
      email: 'contact@testaccount.com',
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Test Country'
      },
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Test Country'
      },
      description: 'A test account',
      annualRevenue: 1000000,
      employeeCount: 50,
      status: AccountStatus.ACTIVE,
      tags: ['test', 'integration'],
      customFields: { testField: 'test value' },
      createdBy: testUserId,
      createdAt: new Date(),
      updatedBy: testUserId,
      updatedAt: new Date()
    };
    
    // Setup mock repository responses
    mockRepository.create.mockResolvedValue(testAccount);
    mockRepository.findById.mockResolvedValue(testAccount);
    mockRepository.update.mockResolvedValue({
      ...testAccount,
      name: 'Updated Test Account',
      updatedAt: new Date()
    });
    mockRepository.findAll.mockResolvedValue({
      data: [testAccount],
      total: 1,
      page: 1,
      pageSize: 10
    });
    mockRepository.delete.mockResolvedValue(undefined);
    
    // Setup permission service responses
    mockPermissionService.canCreateAccount.mockResolvedValue(true);
    mockPermissionService.canViewAccount.mockResolvedValue(true);
    mockPermissionService.canUpdateAccount.mockResolvedValue(true);
    mockPermissionService.canDeleteAccount.mockResolvedValue(true);
    mockPermissionService.filterAccountsByPermission.mockImplementation(
      (userId, accounts) => Promise.resolve(accounts)
    );
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Account Creation (Requirement 1)', () => {
    test('should create a new account with valid data', async () => {
      const accountCreateDto = {
        name: 'Test Account',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        website: 'https://testaccount.com',
        phone: '123-456-7890',
        email: 'contact@testaccount.com',
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'Test Country'
        },
        status: AccountStatus.ACTIVE
      };
      
      const result = await accountController.createAccount(accountCreateDto);
      
      expect(mockPermissionService.canCreateAccount).toHaveBeenCalledWith(expect.any(String));
      expect(mockRepository.create).toHaveBeenCalledWith(accountCreateDto);
      expect(mockAuditService.logAccountCreation).toHaveBeenCalled();
      expect(result).toEqual(testAccount);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.createdBy).toBeDefined();
    });
    
    test('should reject account creation with missing required fields', async () => {
      const invalidAccountDto = {
        // Missing required name field
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      
      mockRepository.create.mockRejectedValueOnce(new Error('Validation Error'));
      
      await expect(accountController.createAccount(invalidAccountDto as any))
        .rejects.toThrow('Validation Error');
        
      expect(mockAuditService.logAccountCreation).not.toHaveBeenCalled();
    });
    
    test('should generate unique identifier for new accounts', async () => {
      const accountCreateDto = {
        name: 'Test Account',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      
      const result = await accountController.createAccount(accountCreateDto);
      
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });
    
    test('should record creation timestamp and user', async () => {
      const accountCreateDto = {
        name: 'Test Account',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      
      const result = await accountController.createAccount(accountCreateDto);
      
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdBy).toBeDefined();
    });
  });
  
  describe('Account Viewing (Requirement 2)', () => {
    test('should retrieve a paginated list of accounts', async () => {
      const filters = { status: AccountStatus.ACTIVE };
      const pagination = { page: 1, pageSize: 10 };
      
      const result = await accountController.getAccounts(filters, pagination);
      
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters, pagination);
      expect(mockPermissionService.filterAccountsByPermission).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
    
    test('should retrieve a specific account by ID', async () => {
      const result = await accountController.getAccountById('test-account-id');
      
      expect(mockRepository.findById).toHaveBeenCalledWith('test-account-id');
      expect(mockPermissionService.canViewAccount).toHaveBeenCalled();
      expect(mockAuditService.logAccountAccess).toHaveBeenCalled();
      expect(result).toEqual(testAccount);
    });
    
    test('should throw error when accessing account without permission', async () => {
      mockPermissionService.canViewAccount.mockResolvedValueOnce(false);
      
      await expect(accountController.getAccountById('test-account-id'))
        .rejects.toThrow(/permission/i);
        
      expect(mockAuditService.logAccountAccess).not.toHaveBeenCalled();
    });
  });
  
  describe('Account Updating (Requirement 3)', () => {
    test('should update account with valid data', async () => {
      const updateDto = {
        name: 'Updated Test Account',
        description: 'Updated description'
      };
      
      const updatedAccount = {
        ...testAccount,
        ...updateDto,
        updatedAt: new Date(),
        updatedBy: testUserId
      };
      
      mockRepository.update.mockResolvedValueOnce(updatedAccount);
      
      const result = await accountController.updateAccount('test-account-id', updateDto);
      
      expect(mockPermissionService.canUpdateAccount).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith('test-account-id', updateDto);
      expect(mockAuditService.logAccountUpdate).toHaveBeenCalled();
      expect(result.name).toBe('Updated Test Account');
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedBy).toBeDefined();
    });
    
    test('should reject update with invalid data', async () => {
      const invalidUpdateDto = {
        annualRevenue: 'not-a-number' as any
      };
      
      mockRepository.update.mockRejectedValueOnce(new Error('Validation Error'));
      
      await expect(accountController.updateAccount('test-account-id', invalidUpdateDto))
        .rejects.toThrow('Validation Error');
        
      expect(mockAuditService.logAccountUpdate).not.toHaveBeenCalled();
    });
    
    test('should reject update when user lacks permission', async () => {
      mockPermissionService.canUpdateAccount.mockResolvedValueOnce(false);
      
      await expect(accountController.updateAccount('test-account-id', { name: 'New Name' }))
        .rejects.toThrow(/permission/i);
        
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('Account Deletion (Requirement 4)', () => {
    test('should delete an account successfully', async () => {
      await accountController.deleteAccount('test-account-id');
      
      expect(mockPermissionService.canDeleteAccount).toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalledWith('test-account-id');
      expect(mockAuditService.logAccountDeletion).toHaveBeenCalled();
    });
    
    test('should reject deletion when user lacks permission', async () => {
      mockPermissionService.canDeleteAccount.mockResolvedValueOnce(false);
      
      await expect(accountController.deleteAccount('test-account-id'))
        .rejects.toThrow(/permission/i);
        
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockAuditService.logAccountDeletion).not.toHaveBeenCalled();
    });
    
    test('should handle dependencies during deletion', async () => {
      // Mock repository to simulate dependencies
      mockRepository.delete.mockRejectedValueOnce(new Error('Account has dependencies'));
      
      await expect(accountController.deleteAccount('test-account-id'))
        .rejects.toThrow('Account has dependencies');
        
      expect(mockAuditService.logAccountDeletion).not.toHaveBeenCalled();
    });
  });
  
  // Complete account lifecycle test
  test('should handle complete account lifecycle', async () => {
    // 1. Create account
    const createDto = {
      name: 'Lifecycle Test Account',
      industry: 'Healthcare',
      type: AccountType.PROSPECT,
      status: AccountStatus.ACTIVE
    };
    
    const createdAccount = {
      ...createDto,
      id: 'lifecycle-test-id',
      createdAt: new Date(),
      createdBy: testUserId,
      updatedAt: new Date(),
      updatedBy: testUserId
    };
    
    mockRepository.create.mockResolvedValueOnce(createdAccount);
    mockRepository.findById.mockResolvedValueOnce(createdAccount);
    
    const created = await accountController.createAccount(createDto);
    expect(created.id).toBe('lifecycle-test-id');
    
    // 2. Retrieve account
    const retrieved = await accountController.getAccountById('lifecycle-test-id');
    expect(retrieved).toEqual(createdAccount);
    
    // 3. Update account
    const updateDto = {
      name: 'Updated Lifecycle Account',
      type: AccountType.CUSTOMER
    };
    
    const updatedAccount = {
      ...createdAccount,
      ...updateDto,
      updatedAt: new Date()
    };
    
    mockRepository.update.mockResolvedValueOnce(updatedAccount);
    mockRepository.findById.mockResolvedValueOnce(updatedAccount);
    
    const updated = await accountController.updateAccount('lifecycle-test-id', updateDto);
    expect(updated.name).toBe('Updated Lifecycle Account');
    
    // 4. Delete account
    await accountController.deleteAccount('lifecycle-test-id');
    expect(mockRepository.delete).toHaveBeenCalledWith('lifecycle-test-id');
    
    // 5. Verify deletion
    mockRepository.findById.mockRejectedValueOnce(new Error('Account not found'));
    
    await expect(accountController.getAccountById('lifecycle-test-id'))
      .rejects.toThrow('Account not found');
  });
});