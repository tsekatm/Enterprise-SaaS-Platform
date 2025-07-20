import { AccountRepository } from '../AccountRepository';
import { Account } from '../../models/Account';
import { AccountType, AccountStatus } from '../../models/enums/AccountEnums';
import { RelationshipType } from '../../models/enums/RelationshipEnums';
import { SearchParams } from '../../types/common';

describe('Account Repository Performance Tests', () => {
  let repository: AccountRepository;
  const ACCOUNT_COUNT = 10000; // Large number of accounts for performance testing
  
  // Setup test data
  beforeAll(async () => {
    repository = new AccountRepository();
    
    // Generate test accounts
    for (let i = 0; i < ACCOUNT_COUNT; i++) {
      const industry = i % 5 === 0 ? 'Technology' : 
                      i % 5 === 1 ? 'Healthcare' : 
                      i % 5 === 2 ? 'Finance' : 
                      i % 5 === 3 ? 'Retail' : 'Manufacturing';
      
      const status = i % 4 === 0 ? AccountStatus.ACTIVE : 
                    i % 4 === 1 ? AccountStatus.INACTIVE : 
                    i % 4 === 2 ? AccountStatus.PENDING : AccountStatus.CLOSED;
      
      const type = i % 5 === 0 ? AccountType.CUSTOMER : 
                  i % 5 === 1 ? AccountType.PROSPECT : 
                  i % 5 === 2 ? AccountType.PARTNER : 
                  i % 5 === 3 ? AccountType.COMPETITOR : AccountType.OTHER;
      
      await repository.create({
        name: `Test Account ${i}`,
        industry,
        type,
        status,
        website: i % 2 === 0 ? `https://example${i}.com` : undefined,
        phone: i % 3 === 0 ? `+1-555-${i.toString().padStart(4, '0')}` : undefined,
        email: i % 2 === 0 ? `contact${i}@example.com` : undefined,
        description: i % 4 === 0 ? `This is a test account description for account ${i}` : undefined,
        annualRevenue: i % 3 === 0 ? i * 10000 : undefined,
        employeeCount: i % 3 === 0 ? i * 10 : undefined,
        tags: i % 5 === 0 ? ['important', 'vip'] : 
              i % 5 === 1 ? ['new', 'prospect'] : 
              i % 5 === 2 ? ['partner'] : undefined,
        customFields: i % 4 === 0 ? { 
          region: i % 3 === 0 ? 'North' : i % 3 === 1 ? 'South' : 'East',
          priority: i % 5 === 0 ? 'High' : i % 5 === 1 ? 'Medium' : 'Low'
        } : undefined
      });
    }
    
    // Create some relationships for testing
    const accounts = (await repository.findAll()).items;
    
    // Create parent-child relationships
    for (let i = 0; i < Math.min(accounts.length, 1000); i++) {
      if (i + 5 < accounts.length) {
        await repository.updateRelationships(accounts[i].id, {
          addRelationships: [
            {
              targetAccountId: accounts[i + 5].id,
              relationshipType: RelationshipType.PARENT_CHILD,
              isParent: false
            }
          ],
          removeRelationships: []
        });
      }
    }
  });
  
  // Helper function to measure execution time
  const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  };
  
  test('Search performance should be under 200ms', async () => {
    const searchParams: SearchParams = {
      query: 'Test',
      filters: {
        industry: 'Technology',
        status: AccountStatus.ACTIVE
      },
      pagination: {
        page: 1,
        pageSize: 10
      },
      sort: {
        field: 'name',
        direction: 'asc'
      }
    };
    
    const executionTime = await measureExecutionTime(async () => {
      await repository.search(searchParams);
    });
    
    console.log(`Search execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(200);
  });
  
  test('Relationship query performance should be under 100ms', async () => {
    const accounts = (await repository.findAll()).items;
    const testAccountId = accounts[0].id;
    
    const executionTime = await measureExecutionTime(async () => {
      await repository.getRelationships(testAccountId);
    });
    
    console.log(`Relationship query execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(100);
  });
  
  test('Circular relationship check performance should be under 100ms', async () => {
    const accounts = (await repository.findAll()).items;
    const parentId = accounts[0].id;
    const childId = accounts[5].id;
    
    const executionTime = await measureExecutionTime(async () => {
      await repository.checkCircularRelationship(parentId, childId);
    });
    
    console.log(`Circular relationship check execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(100);
  });
  
  test('Complex filtering performance should be under 200ms', async () => {
    const executionTime = await measureExecutionTime(async () => {
      await repository.findAll({
        industry: 'Technology',
        status: AccountStatus.ACTIVE,
        minRevenue: 50000,
        maxRevenue: 500000,
        minEmployees: 100,
        maxEmployees: 1000,
        createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        tags: ['important']
      });
    });
    
    console.log(`Complex filtering execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(200);
  });
  
  test('Child accounts query performance should be under 100ms', async () => {
    const accounts = (await repository.findAll()).items;
    const parentId = accounts[0].id;
    
    const executionTime = await measureExecutionTime(async () => {
      await repository.getChildAccounts(parentId);
    });
    
    console.log(`Child accounts query execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(100);
  });
});