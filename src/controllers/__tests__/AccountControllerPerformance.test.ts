import { AccountController } from '../AccountController';
import { AccountService } from '../../services/AccountService';
import { AccountRepository } from '../../repositories/AccountRepository';
import { AuditService } from '../../services/AuditService';
import { PermissionService } from '../../services/PermissionService';
import { Account } from '../../models/Account';
import { AccountType, AccountStatus } from '../../models/enums/AccountEnums';
import { SearchParams } from '../../types/common';
import { ResponseOptimizer } from '../../utils/ResponseOptimizer';

describe('Account Controller Performance Tests', () => {
  let controller: AccountController;
  let accountService: AccountService;
  let accountRepository: AccountRepository;
  let auditService: AuditService;
  let permissionService: PermissionService;
  
  // Setup test data
  beforeAll(async () => {
    accountRepository = new AccountRepository();
    auditService = new AuditService();
    permissionService = new PermissionService();
    accountService = new AccountService(accountRepository, auditService);
    controller = new AccountController(accountService, auditService, permissionService);
    
    // Generate test accounts
    for (let i = 0; i < 1000; i++) {
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
      
      await accountRepository.create({
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
  });
  
  // Helper function to measure execution time
  const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  };
  
  // Helper function to measure serialization time
  const measureSerializationTime = (obj: any): number => {
    const start = process.hrtime.bigint();
    JSON.stringify(obj);
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  };
  
  test('Search API response time should be under 200ms', async () => {
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
      await controller.searchAccounts(searchParams);
    });
    
    console.log(`Search API execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(200);
  });
  
  test('Response optimization should improve serialization performance', async () => {
    // Get a large response
    const response = await controller.getAll({}, { page: 1, pageSize: 100 });
    
    // Measure serialization time without optimization
    const unoptimizedTime = measureSerializationTime(response);
    
    // Optimize the response
    const optimizedResponse = ResponseOptimizer.optimizePaginatedResponse(response);
    
    // Measure serialization time with optimization
    const optimizedTime = measureSerializationTime(optimizedResponse);
    
    console.log(`Unoptimized serialization time: ${unoptimizedTime.toFixed(2)}ms`);
    console.log(`Optimized serialization time: ${optimizedTime.toFixed(2)}ms`);
    console.log(`Optimization improvement: ${((unoptimizedTime - optimizedTime) / unoptimizedTime * 100).toFixed(2)}%`);
    
    // The optimized serialization should be faster
    expect(optimizedTime).toBeLessThan(unoptimizedTime);
  });
  
  test('Response size should be reduced after optimization', async () => {
    // Get a large response
    const response = await controller.getAll({}, { page: 1, pageSize: 100 });
    
    // Measure response size without optimization
    const unoptimizedSize = Buffer.byteLength(JSON.stringify(response));
    
    // Optimize the response
    const optimizedResponse = ResponseOptimizer.optimizePaginatedResponse(response);
    
    // Measure response size with optimization
    const optimizedSize = Buffer.byteLength(JSON.stringify(optimizedResponse));
    
    console.log(`Unoptimized response size: ${unoptimizedSize} bytes`);
    console.log(`Optimized response size: ${optimizedSize} bytes`);
    console.log(`Size reduction: ${((unoptimizedSize - optimizedSize) / unoptimizedSize * 100).toFixed(2)}%`);
    
    // The optimized response should be smaller
    expect(optimizedSize).toBeLessThan(unoptimizedSize);
  });
  
  test('Account detail API response time should be under 100ms', async () => {
    // Get an account ID
    const accounts = await accountRepository.findAll();
    const accountId = accounts.items[0].id;
    
    const executionTime = await measureExecutionTime(async () => {
      await controller.getById(accountId);
    });
    
    console.log(`Account detail API execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(100);
  });
});