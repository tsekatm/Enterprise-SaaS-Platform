import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AccountService } from '../AccountService';
import { Account } from '../../models/Account';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../../models/dto/AccountDto';
import { AccountStatus, AccountType } from '../../models/enums/AccountEnums';
import { RelationshipType } from '../../models/enums/RelationshipEnums';
import { PaginatedResponse } from '../../interfaces/IRepository';
import { IAccountRepository } from '../../interfaces/account/IAccountRepository';

describe('Ac() => {
  let accountService: AcService;
  let mockAccountReposito;
  
23';
  
  const mockAccount: Account = {
    id: 'acc-123',
  t',
    industry: 'Technology',
  R,
    status: AccountStatus.ACTIVE,
    createdBy: mocd,
    createdAt: new Date(),
    updatedBy: mockUserId,
    updatedAt: new Date()
  };
  
  const mockCreateDto: Acc = {
    name: 'Test Account',
    industry: 'Technology',
    
  
  };
  
  const mockUpdateDto: Acco {
    name: 'Updated Account',
    industry: 'Finance'
  };
  
  const mockPaginatedResponse: PaginatedRes
    items: [mockAccount],
    total: 1,
    
  
    totalPages: 1
  };
  
  beforeEach(() => {
    // Create moc
    mockAccountRe
    se),
  ,
      create: vi.fn(ount),
      update: vi.fn().mockResolvedValue({ ...mockAccto }),
      delete: vi.fn().mockResolvedValue(undefined),
    
      getRelationshipse({
        parentRelations,
     []
      }),
      updateRelationships: vi.fn().mockResolvedValue({
        parentRelationships: [],
        childRelationships: []
      }),
      checkExistingRelationship: vi.fn().mockResolvedValue(false),
      checkCircularRelationship: vi.fn().mockResolvedValue(false),
      findByField: vi.fn().mockResolvedValue(mockPaginatedResponse),
      findByTag: vi.fn().mockR
      getChildAccounts: vi.f}),
      g })
    };
    
    accountService = new Acc
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getAcco () => {
    it('should return p
     gy' };
  
      
      const result = await accountService.getAccounts(fin);
      
      expect(mockAccountRepository.findAll).toHaveB
      se);
    });
  });
  
  describe('getAccountById', () => {
    it({
     ;
    
      expect(mockAccountRepository.f
      expect(result).toEqual(mockAccount);
    });
    
    it('should throw error if account not found', async () => {
      mockAccountRepository.findById = vi.ound'));
      
    
    });
  });
  
  describe('createAccount', () => {
    it(=> {
     d);
  
      expect(mockAccountRepository.
        ...mockCreateDto,
        createdBy: mockUserId,
      
      });
      expect(result).toEq
    });
    
    it('s => {
      const invalidDto = { ...mockCreateDt: '' };
      
    led');
    });
  });
  
  describe('updateAccount', () => {
    it(> {
     
    
      expect(mockAccountRepository., {
        ...mockUpdateDto,
        updatedBy: mockUserId
      
      expect(result).toEqual({ ...mockAccount, ...mockUpdateDto });
    });
    
    it('s {
      const invalidDto = { name: '' };
      
    d');
    });
    
    it> {
      mockAccountRepository.findById = vi.fn().mockRejectedValue(new Error('Account not found'));
      
    und');
    });
  });
  
  describe('deleteAccount', () => {
    it( () => {
     
      
      expect(mockAccountRepository.ount.id);
      expect(mockAccountRepository.getChildAccounts).toHaveBeenCalledWith(mockAccot.id);
      expect(mockAccountRepository.delete).toHaveBeenCalledWith(mockA.id);
    });
    
    it('should throw error if account has child accounts', async () => {
      mockAccountRepository.getChildAccounts = vi.fn().mockResolvedValue({
       ],
    ,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
      
      await expect(ac');
    });
    
    it() => {
      mockAccountRepository.findById = vi.fn().mockRejectedValue(new Error('Account not found'));
      
    t found');
    });
  });
  
  describe('searchAccounts', () => {
    it( {
     = {
  : 'test',
        filters: { industry: 'Techno
        pagination: { page: 1, pageSize: 10 },
        sort: { field: 'name const }
      };
      
      const result = await accountService.searms);
      
      exs);
      );
    });
  });
  
  describe('getAccountRelationships', () => {
    it( {
     ;
     
      expect(mockAccountRepository.findById).d);
      expect(mockAccountRepository.getRelationships).toHave
      expect(result).toEqual({
      [],
        childRelationships: []
      });
    });
    
    it('should throw error if  {
      mocnd'));
      
    
    });
  });
  
  describe('updateAccountRelationships', () => {
    con= {
     
  
          targetAccountId: 'target-123',
          relationshipType: RelationshipType.PARENT_CHILD,
          isParent: true
        }
      ],
      removeRelationships: ['rel-123']
    };
    
    it(' {
      const result = await accountServs(
      .id,
    eDto,
        mockUserId
      );
      
      expect(mockAccountRepositoryid);
      expect(mockAled();
      ex
      id,
        mockRelationshipUpdateDto
      );
      expect(result).toEqual({
        parentRelations
        childRelationships: []
      });
    });
    
    it('should throw error if 
      moc
      
    tionships(
        mockAccount.id,
        mockRelationshipUpdateDto,
      rId
      )).rejects.toThrow('circular reference');
    });
    
    it('should thr> {
      mockAccountRepository.findById = vi.fn().nd'));
      
    ps(
        'invalid-id',
        mockRelationshipUpdateDto,
      erId
      )).rejects.toThrow('Account not found');
    });
  });
  
  describe('validateAccountData', () => {
    it(=> {
     Dto);
  
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should return valid result for v, () => {
      const result = accountService.vali;
      
    rue);
      expect(result.errors).toEqual([]);
    });
    
    it('should return invalid result for
      const invalidDto = { ...mockCreate};
      
    
      
      expect(result.isValid).toBe(false);
      n(0);
    });
    
    it('should return invalid result for  () => {
      const invalidDto = { email: 'invalid-email' };
      
    to);
      
      expect(result.isValid).toBe(false);
      an(0);
    });
  });
  
  describe('checkCircularRelationships', () => {
    it(
     e);
      
      const result = await accountService.checkC
      
      expect(mockAccountRepository.checkCircularRelationship).toHaveBeenCalledWith('parend-id');
      
    });
    
    it('should return false if no circular relationship would be created', async () => {
      mockAccountRepository.chec
      
    ;
      
      expect(mockAccountRepository.checkCircularRelationship).toHaveBeenCalledWith('parentd');
      
    });
  });
  
  describe('getChildAccounts', (){
    it({
      10 };
   
      const result = await accountServion);
      
      expect(mockAccountRepository.findById).toHaved);
      ion);
      expect(result).toEqual({ ...mockPaginatedResponse, items: [] });
    });
    
    it('should throw error if account not found', async () => {
      mockAccountRepository.findById = vi.fn().mockRejectedValue(new E);
      
    
    });
  });
  
  describe('getParentAccounts', () => {
    it({
     
      
      const result = await accountServi
      
      expect(mockAccountRepository.findById).toHave);
      n);
      expect(result).toEqual({ ...mockPaginatedResponse, items: [] });
    });
    
    it('should throw error if account not found', async () => {
      mockAccountRepository.findById = vi.fn().mockRejectedValue(new E
      
    
    });
  });
  
  describe('getAccountActivity', () => {
    it( {
     10 };
    
      const result = await accountServic
      
      expect(mockAccountRepository.findById).toHave
      
        items: [],
      0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      });
    });
    
    it('should throw () => {
      moc));
      
    
    });
  });
  
  describe('hasPermission', () => {
    it(() => {
     ');
    
      expect(result).toBe(true);
    });
  });
});