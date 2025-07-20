import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CachedAccountService } from '../CachedAccountService';
import { AccountService } from '../AccountService';
import { MockCacheService } from '../MockCacheService';
import { Account } from '../../models/Account';
import { AccountCreateDto, AccountUpdateDto } from '../../models/dto/AccountDto';
import { PaginatedResponse } from '../../interfaces/IRepository';
import { AccountType, AccountStatus } from '../../models/enums/AccountEnums';

// Mock the AccountRepository
const mockAccountRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  search: vi.fn(),
  getRelationships: vi.fn(),
  updateRelationships: vi.fn(),
  checkExistingRelationship: vi.fn(),
  checkCircularRelationship: vi.fn(),
  getChildAccounts: vi.fn(),
  getParentAccounts: vi.fn()
};

describe('CachedAccountService', () => {
  let accountService: AccountService;
  let cacheService: MockCacheService;
  let cachedAccountService: CachedAccountService;
  
  // Sample account data
  const sampleAccount: Account = {
    id: '123',
    name: 'Test Account',
    industry: 'Technology',
    type: AccountType.CUSTOMER,
    status: AccountStatus.ACTIVE,
    createdBy: 'user1',
    createdAt: new Date(),
    updatedBy: 'user1',
    updatedAt: new Date()
  };
  
  const samplePaginatedResponse: PaginatedResponse<Account> = {
    items: [sampleAccount],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create services
    accountService = new AccountService(mockAccountRepository);
    cacheService = new MockCacheService();
    cachedAccountService = new CachedAccountService(accountService, cacheService);
    
    // Setup mock implementations
    mockAccountRepository.findById.mockResolvedValue(sampleAccount);
    mockAccountRepository.findAll.mockResolvedValue(samplePaginatedResponse);
    mockAccountRepository.search.mockResolvedValue(samplePaginatedResponse);
    mockAccountRepository.create.mockImplementation((dto) => {
      return Promise.resolve({
        id: '123',
        ...dto,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      });
    });
    mockAccountRepository.update.mockImplementation((id, dto) => {
      return Promise.resolve({
        ...sampleAccount,
        ...dto,
        id,
        updatedBy: 'user1',
        updatedAt: new Date()
      });
    });
  });
  
  afterEach(async () => {
    await cacheService.clear();
  });
  
  describe('getById', () => {
    it('should get account from cache on second call', async () => {
      // First call should hit the repository
      const result1 = await cachedAccountService.getById('123');
      expect(result1).toEqual(sampleAccount);
      expect(mockAccountRepository.findById).toHaveBeenCalledTimes(1);
      
      // Second call should get from cache
      const result2 = await cachedAccountService.getById('123');
      expect(result2).toEqual(sampleAccount);
      expect(mockAccountRepository.findById).toHaveBeenCalledTimes(1); // Still only called once
    });
    
    it('should update cache after account update', async () => {
      // First get the account (caches it)
      await cachedAccountService.getById('123');
      
      // Mock validateAccountData to return valid
      vi.spyOn(accountService, 'validateAccountData').mockReturnValue({
        isValid: true,
        errors: []
      });
      
      // Update the account with all required fields
      const updateDto: AccountUpdateDto = { 
        name: 'Updated Account',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      await cachedAccountService.update('123', updateDto, 'user1');
      
      // Get the account again
      const result = await cachedAccountService.getById('123');
      
      // Should have the updated name
      expect(result.name).toBe('Updated Account');
      
      // Repository should have been called twice (once for get, once for update)
      expect(mockAccountRepository.findById).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getAccounts', () => {
    it('should get accounts from cache on second call', async () => {
      const filters = { industry: 'Technology' };
      const pagination = { page: 1, pageSize: 10 };
      
      // First call should hit the repository
      const result1 = await cachedAccountService.getAccounts(filters, pagination);
      expect(result1).toEqual(samplePaginatedResponse);
      expect(mockAccountRepository.findAll).toHaveBeenCalledTimes(1);
      
      // Second call should get from cache
      const result2 = await cachedAccountService.getAccounts(filters, pagination);
      expect(result2).toEqual(samplePaginatedResponse);
      expect(mockAccountRepository.findAll).toHaveBeenCalledTimes(1); // Still only called once
    });
    
    it('should invalidate list cache after account creation', async () => {
      const filters = { industry: 'Technology' };
      const pagination = { page: 1, pageSize: 10 };
      
      // First get the accounts (caches it)
      await cachedAccountService.getAccounts(filters, pagination);
      
      // Create a new account
      const createDto: AccountCreateDto = {
        name: 'New Account',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      await cachedAccountService.create(createDto, 'user1');
      
      // Get the accounts again
      await cachedAccountService.getAccounts(filters, pagination);
      
      // Repository should have been called twice (once for initial get, once after cache invalidation)
      expect(mockAccountRepository.findAll).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('searchAccounts', () => {
    it('should get search results from cache on second call', async () => {
      const searchParams = {
        query: 'test',
        pagination: { page: 1, pageSize: 10 }
      };
      
      // First call should hit the repository
      const result1 = await cachedAccountService.searchAccounts(searchParams);
      expect(result1).toEqual(samplePaginatedResponse);
      expect(mockAccountRepository.search).toHaveBeenCalledTimes(1);
      
      // Second call should get from cache
      const result2 = await cachedAccountService.searchAccounts(searchParams);
      expect(result2).toEqual(samplePaginatedResponse);
      expect(mockAccountRepository.search).toHaveBeenCalledTimes(1); // Still only called once
    });
    
    it('should invalidate search cache after account update', async () => {
      const searchParams = {
        query: 'test',
        pagination: { page: 1, pageSize: 10 }
      };
      
      // First search (caches it)
      await cachedAccountService.searchAccounts(searchParams);
      
      // Mock validateAccountData to return valid
      vi.spyOn(accountService, 'validateAccountData').mockReturnValue({
        isValid: true,
        errors: []
      });
      
      // Update an account with all required fields
      const updateDto: AccountUpdateDto = { 
        name: 'Updated Account',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      await cachedAccountService.update('123', updateDto, 'user1');
      
      // Search again
      await cachedAccountService.searchAccounts(searchParams);
      
      // Repository should have been called twice (once for initial search, once after cache invalidation)
      expect(mockAccountRepository.search).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('delete', () => {
    it('should invalidate account cache after deletion', async () => {
      // First get the account (caches it)
      await cachedAccountService.getById('123');
      
      // Verify we can get it from cache
      const cachedAccount = await cacheService.get('account:123');
      expect(cachedAccount).not.toBeNull();
      
      // Mock getChildAccounts to return empty result
      mockAccountRepository.getChildAccounts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      });
      
      // Delete the account
      await cachedAccountService.delete('123', 'user1');
      
      // Verify the cache was invalidated
      const cachedAccountAfterDelete = await cacheService.get('account:123');
      expect(cachedAccountAfterDelete).toBeNull();
    });
  });
});