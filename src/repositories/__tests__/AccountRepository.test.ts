import { AccountRepository } from '../AccountRepository';
import { AccountCreateDto, AccountUpdateDto, RelationshipUpdateDto } from '../../models/dto/AccountDto';
import { AccountType, AccountStatus } from '../../models/enums/AccountEnums';
import { RelationshipType } from '../../models/enums/RelationshipEnums';
import { PaginationParams } from '../../interfaces/IRepository';
import { SearchParams } from '../../types/common';

describe('AccountRepository', () => {
  let repository: AccountRepository;
  let testAccountId: string;
  let secondAccountId: string;

  beforeEach(async () => {
    repository = new AccountRepository();
    
    // Create a test account
    const createDto: AccountCreateDto = {
      name: 'Test Account',
      industry: 'Technology',
      type: AccountType.CUSTOMER,
      status: AccountStatus.ACTIVE,
      website: 'https://test.com',
      email: 'contact@test.com',
      phone: '+12345678901',
      description: 'Test account description',
      tags: ['test', 'tech']
    };
    
    const account = await repository.create(createDto);
    testAccountId = account.id;
    
    // Create a second test account
    const secondCreateDto: AccountCreateDto = {
      name: 'Second Account',
      industry: 'Healthcare',
      type: AccountType.PROSPECT,
      status: AccountStatus.PENDING,
      tags: ['healthcare']
    };
    
    const secondAccount = await repository.create(secondCreateDto);
    secondAccountId = secondAccount.id;
  });

  describe('CRUD operations', () => {
    test('should create an account', async () => {
      const createDto: AccountCreateDto = {
        name: 'New Account',
        industry: 'Finance',
        type: AccountType.PARTNER,
        status: AccountStatus.ACTIVE
      };
      
      const account = await repository.create(createDto);
      
      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      expect(account.name).toBe('New Account');
      expect(account.industry).toBe('Finance');
      expect(account.type).toBe(AccountType.PARTNER);
      expect(account.status).toBe(AccountStatus.ACTIVE);
      expect(account.createdAt).toBeInstanceOf(Date);
      expect(account.updatedAt).toBeInstanceOf(Date);
    });
    
    test('should throw error when creating account with invalid data', async () => {
      const invalidDto = {
        // Missing required fields
        industry: 'Finance',
        type: AccountType.PARTNER
      } as AccountCreateDto;
      
      await expect(repository.create(invalidDto)).rejects.toThrow();
    });
    
    test('should find account by ID', async () => {
      const account = await repository.findById(testAccountId);
      
      expect(account).toBeDefined();
      expect(account.id).toBe(testAccountId);
      expect(account.name).toBe('Test Account');
    });
    
    test('should throw error when finding non-existent account', async () => {
      await expect(repository.findById('non-existent-id')).rejects.toThrow();
    });
    
    test('should update an account', async () => {
      const updateDto: AccountUpdateDto = {
        name: 'Updated Account',
        description: 'Updated description'
      };
      
      const updatedAccount = await repository.update(testAccountId, updateDto);
      
      expect(updatedAccount).toBeDefined();
      expect(updatedAccount.id).toBe(testAccountId);
      expect(updatedAccount.name).toBe('Updated Account');
      expect(updatedAccount.description).toBe('Updated description');
      // Original fields should be preserved
      expect(updatedAccount.industry).toBe('Technology');
      expect(updatedAccount.type).toBe(AccountType.CUSTOMER);
    });
    
    test('should throw error when updating non-existent account', async () => {
      const updateDto: AccountUpdateDto = {
        name: 'Updated Account'
      };
      
      await expect(repository.update('non-existent-id', updateDto)).rejects.toThrow();
    });
    
    test('should delete an account', async () => {
      await repository.delete(testAccountId);
      
      // Trying to find the deleted account should throw an error
      await expect(repository.findById(testAccountId)).rejects.toThrow();
    });
    
    test('should throw error when deleting non-existent account', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow();
    });
    
    test('should find all accounts', async () => {
      const result = await repository.findAll();
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
    });
    
    test('should find all accounts with pagination', async () => {
      const pagination: PaginationParams = {
        page: 1,
        pageSize: 1
      };
      
      const result = await repository.findAll(undefined, pagination);
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);
      expect(result.totalPages).toBe(2);
    });
    
    test('should find all accounts with filters', async () => {
      const filters = {
        industry: 'Technology'
      };
      
      const result = await repository.findAll(filters);
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].industry).toBe('Technology');
    });
  });

  describe('Search functionality', () => {
    test('should search accounts by query string', async () => {
      const searchParams: SearchParams = {
        query: 'Test'
      };
      
      const result = await repository.search(searchParams);
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe('Test Account');
    });
    
    test('should search accounts with filters', async () => {
      const searchParams: SearchParams = {
        query: '',
        filters: {
          type: AccountType.PROSPECT
        }
      };
      
      const result = await repository.search(searchParams);
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].type).toBe(AccountType.PROSPECT);
    });
    
    test('should search accounts with sorting', async () => {
      const searchParams: SearchParams = {
        query: '',
        sort: {
          field: 'name',
          direction: 'desc'
        }
      };
      
      const result = await repository.search(searchParams);
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(2);
      // Should be sorted in descending order by name
      expect(result.items[0].name).toBe('Test Account');
      expect(result.items[1].name).toBe('Second Account');
    });
    
    test('should find accounts by field', async () => {
      const result = await repository.findByField('industry', 'Technology');
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].industry).toBe('Technology');
    });
    
    test('should find accounts by tag', async () => {
      const result = await repository.findByTag('tech');
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].tags).toContain('tech');
    });
  });

  describe('Relationship management', () => {
    let relationshipId: string;
    
    beforeEach(async () => {
      // Create a parent-child relationship
      const updateDto: RelationshipUpdateDto = {
        addRelationships: [
          {
            targetAccountId: secondAccountId,
            relationshipType: RelationshipType.PARENT_CHILD,
            isParent: false // testAccount is parent of secondAccount
          }
        ],
        removeRelationships: []
      };
      
      const result = await repository.updateRelationships(testAccountId, updateDto);
      relationshipId = result.childRelationships[0].id;
    });
    
    test('should get account relationships', async () => {
      const relationships = await repository.getRelationships(testAccountId);
      
      expect(relationships).toBeDefined();
      expect(relationships.parentRelationships.length).toBe(0);
      expect(relationships.childRelationships.length).toBe(1);
      expect(relationships.childRelationships[0].parentAccountId).toBe(testAccountId);
      expect(relationships.childRelationships[0].childAccountId).toBe(secondAccountId);
    });
    
    test('should check existing relationship', async () => {
      const exists = await repository.checkExistingRelationship(testAccountId, secondAccountId);
      expect(exists).toBe(true);
      
      const notExists = await repository.checkExistingRelationship(secondAccountId, testAccountId);
      expect(notExists).toBe(false);
    });
    
    test('should detect circular relationship', async () => {
      // Trying to create a circular reference (second -> test when test -> second already exists)
      const isCircular = await repository.checkCircularRelationship(secondAccountId, testAccountId);
      expect(isCircular).toBe(true);
      
      // Creating a new account and checking non-circular relationship
      const thirdCreateDto: AccountCreateDto = {
        name: 'Third Account',
        industry: 'Retail',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      
      const thirdAccount = await repository.create(thirdCreateDto);
      
      const notCircular = await repository.checkCircularRelationship(secondAccountId, thirdAccount.id);
      expect(notCircular).toBe(false);
    });
    
    test('should update relationships', async () => {
      // Create a third account
      const thirdCreateDto: AccountCreateDto = {
        name: 'Third Account',
        industry: 'Retail',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };
      
      const thirdAccount = await repository.create(thirdCreateDto);
      
      // Add a new relationship and remove the existing one
      const updateDto: RelationshipUpdateDto = {
        addRelationships: [
          {
            targetAccountId: thirdAccount.id,
            relationshipType: RelationshipType.AFFILIATE,
            isParent: true // thirdAccount is parent of testAccount
          }
        ],
        removeRelationships: [relationshipId]
      };
      
      const result = await repository.updateRelationships(testAccountId, updateDto);
      
      expect(result).toBeDefined();
      expect(result.parentRelationships.length).toBe(1);
      expect(result.parentRelationships[0].parentAccountId).toBe(thirdAccount.id);
      expect(result.childRelationships.length).toBe(0);
    });
    
    test('should get child accounts', async () => {
      const result = await repository.getChildAccounts(testAccountId);
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe(secondAccountId);
    });
    
    test('should get parent accounts', async () => {
      const result = await repository.getParentAccounts(secondAccountId);
      
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe(testAccountId);
    });
    
    test('should throw error when creating circular relationship', async () => {
      const updateDto: RelationshipUpdateDto = {
        addRelationships: [
          {
            targetAccountId: testAccountId,
            relationshipType: RelationshipType.PARENT_CHILD,
            isParent: true // secondAccount would be parent of testAccount, creating a circle
          }
        ],
        removeRelationships: []
      };
      
      await expect(repository.updateRelationships(secondAccountId, updateDto)).rejects.toThrow();
    });
  });
});