import { AccountController } from '../AccountController';
import { AccountService } from '../../services/AccountService';
import { AuditService } from '../../services/AuditService';
import { PermissionService } from '../../services/PermissionService';
import { AccountRepository } from '../../repositories/AccountRepository';
import { AccountCreateDto } from '../../models/dto/AccountDto';
import { AccountType, AccountStatus } from '../../models/enums/AccountEnums';
import { AccountDataExport } from '../../interfaces/account/IAccountService';

describe('AccountController GDPR Compliance Features', () => {
  let accountRepository: AccountRepository;
  let auditService: AuditService;
  let permissionService: PermissionService;
  let accountService: AccountService;
  let accountController: AccountController;
  let testAccountId: string;

  // Setup test data
  const testAccountData: AccountCreateDto = {
    name: 'Test Account',
    industry: 'Technology',
    type: AccountType.CUSTOMER,
    status: AccountStatus.ACTIVE,
    email: 'contact@testaccount.com',
    phone: '+12345678901',
    website: 'https://www.testaccount.com',
    description: 'Test account for GDPR compliance testing',
    tags: ['test', 'gdpr', 'compliance']
  };

  beforeEach(async () => {
    // Initialize services
    accountRepository = new AccountRepository();
    auditService = new AuditService();
    permissionService = new PermissionService();
    accountService = new AccountService(accountRepository, auditService);
    accountController = new AccountController(accountService, auditService, permissionService);

    // Mock permission service to always return true
    jest.spyOn(permissionService, 'canView').mockResolvedValue(true);
    jest.spyOn(permissionService, 'canCreate').mockResolvedValue(true);
    jest.spyOn(permissionService, 'canUpdate').mockResolvedValue(true);
    jest.spyOn(permissionService, 'canDelete').mockResolvedValue(true);
    jest.spyOn(permissionService, 'filterByPermission').mockImplementation(
      async (userId, entityType, entities) => entities
    );

    // Create a test account
    const account = await accountController.create(testAccountData);
    testAccountId = account.id;
  });

  describe('Data Export Endpoint', () => {
    it('should export all account data including audit trail', async () => {
      // Execute the export
      const exportData = await accountController.exportAccountData(testAccountId);

      // Verify the export contains all required data
      expect(exportData).toBeDefined();
      expect(exportData.account).toBeDefined();
      expect(exportData.account.id).toBe(testAccountId);
      expect(exportData.relationships).toBeDefined();
      expect(exportData.auditTrail).toBeDefined();
      expect(exportData.exportDate).toBeInstanceOf(Date);
      expect(exportData.exportedBy).toBeDefined();

      // Verify account data is complete
      expect(exportData.account.name).toBe(testAccountData.name);
      expect(exportData.account.industry).toBe(testAccountData.industry);
      expect(exportData.account.type).toBe(testAccountData.type);
      expect(exportData.account.email).toBe(testAccountData.email);
    });

    it('should throw an error when exporting data without permission', async () => {
      // Mock permission service to deny access
      jest.spyOn(permissionService, 'canView').mockResolvedValueOnce(false);

      // Attempt to export data
      await expect(accountController.exportAccountData(testAccountId))
        .rejects.toMatchObject({
          status: 403,
          code: 'PERMISSION_DENIED'
        });
    });

    it('should throw an error when exporting data for non-existent account', async () => {
      await expect(accountController.exportAccountData('non-existent-id'))
        .rejects.toMatchObject({
          status: 404,
          code: 'NOT_FOUND'
        });
    });
  });

  describe('Complete Data Removal Endpoint', () => {
    it('should completely remove all account data and return success message', async () => {
      // Execute the complete removal
      const result = await accountController.completelyRemoveAccountData(testAccountId);

      // Verify the result
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain(testAccountId);
      expect(result.message).toContain('completely removed');
      expect(result.message).toContain('GDPR');

      // Verify account no longer exists
      await expect(accountController.getById(testAccountId))
        .rejects.toMatchObject({
          status: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw an error when removing data without permission', async () => {
      // Mock permission service to deny access
      jest.spyOn(permissionService, 'canDelete').mockResolvedValueOnce(false);

      // Attempt to remove data
      await expect(accountController.completelyRemoveAccountData(testAccountId))
        .rejects.toMatchObject({
          status: 403,
          code: 'PERMISSION_DENIED'
        });
    });

    it('should throw an error when removing data for non-existent account', async () => {
      await expect(accountController.completelyRemoveAccountData('non-existent-id'))
        .rejects.toMatchObject({
          status: 404,
          code: 'NOT_FOUND'
        });
    });
  });

  describe('Integration with Regular Account Operations', () => {
    it('should handle regular deletion differently from GDPR removal', async () => {
      // Create a second account for comparison
      const secondAccount = await accountController.create({
        ...testAccountData,
        name: 'Second Test Account'
      });

      // Perform regular deletion on the first account
      await accountController.delete(testAccountId);
      
      // Verify first account is deleted
      await expect(accountController.getById(testAccountId))
        .rejects.toMatchObject({
          status: 404,
          code: 'NOT_FOUND'
        });
      
      // But audit trail should still exist after regular deletion
      const auditExport = await auditService.exportAuditData('account', testAccountId);
      expect(auditExport.entries.length).toBeGreaterThan(0);
      
      // Perform GDPR removal on the second account
      await accountController.completelyRemoveAccountData(secondAccount.id);
      
      // Verify second account is deleted
      await expect(accountController.getById(secondAccount.id))
        .rejects.toMatchObject({
          status: 404,
          code: 'NOT_FOUND'
        });
      
      // Audit trail should be gone after GDPR removal
      const secondAuditExport = await auditService.exportAuditData('account', secondAccount.id);
      expect(secondAuditExport.entries.length).toBe(0);
    });
  });
});