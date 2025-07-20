import { AccountService } from '../AccountService';
import { AccountRepository } from '../../repositories/AccountRepository';
import { AuditService } from '../AuditService';
import { AccountCreateDto } from '../../models/dto/AccountDto';
import { AccountType, AccountStatus } from '../../models/enums/AccountEnums';

describe('GDPR Compliance Features', () => {
  let accountRepository: AccountRepository;
  let auditService: AuditService;
  let accountService: AccountService;
  let testAccountId: string;
  const testUserId = 'test-user-id';

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
    accountService = new AccountService(accountRepository, auditService);

    // Create a test account
    const account = await accountService.createAccount(testAccountData, testUserId);
    testAccountId = account.id;

    // Generate some audit logs
    await auditService.logCreation('account', testAccountId, account, testUserId);
    await auditService.logAccess('account', testAccountId, testUserId);
    await auditService.logUpdate('account', testAccountId, { name: 'Updated Name' }, testUserId);
  });

  describe('Data Export Functionality', () => {
    it('should export all account data including audit trail', async () => {
      // Execute the export
      const exportData = await accountService.exportAccountData(testAccountId, testUserId);

      // Verify the export contains all required data
      expect(exportData).toBeDefined();
      expect(exportData.account).toBeDefined();
      expect(exportData.account.id).toBe(testAccountId);
      expect(exportData.relationships).toBeDefined();
      expect(exportData.auditTrail).toBeDefined();
      expect(exportData.auditTrail.length).toBeGreaterThanOrEqual(3); // We created at least 3 audit entries
      expect(exportData.exportDate).toBeInstanceOf(Date);
      expect(exportData.exportedBy).toBe(testUserId);

      // Verify account data is complete
      expect(exportData.account.name).toBe(testAccountData.name);
      expect(exportData.account.industry).toBe(testAccountData.industry);
      expect(exportData.account.type).toBe(testAccountData.type);
      expect(exportData.account.email).toBe(testAccountData.email);

      // Verify audit trail contains expected entries
      const auditActions = exportData.auditTrail.map(entry => entry.action);
      expect(auditActions).toContain('create');
      expect(auditActions).toContain('access');
      expect(auditActions).toContain('update');
    });

    it('should throw an error when exporting data for non-existent account', async () => {
      await expect(accountService.exportAccountData('non-existent-id', testUserId))
        .rejects.toThrow(/Account with ID non-existent-id not found/);
    });

    it('should log the export operation in the audit trail', async () => {
      // Execute the export
      await accountService.exportAccountData(testAccountId, testUserId);

      // Get the audit trail
      const auditExport = await auditService.exportAuditData('account', testAccountId);
      
      // Find access entries after the initial setup
      const accessEntries = auditExport.entries.filter(entry => 
        entry.action === 'access' && 
        entry.timestamp > new Date(Date.now() - 1000) // Entries in the last second
      );

      // Verify there's at least one access entry from the export operation
      expect(accessEntries.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Complete Data Removal Capability', () => {
    it('should completely remove all account data including audit trail', async () => {
      // Execute the complete removal
      await accountService.completelyRemoveAccountData(testAccountId, testUserId);

      // Verify account no longer exists
      await expect(accountRepository.findById(testAccountId))
        .rejects.toThrow(/Account with ID .* not found/);

      // Verify audit trail is also removed
      const auditEntries = await auditService.getAuditTrail('account', testAccountId);
      expect(auditEntries.total).toBe(0);
      expect(auditEntries.items.length).toBe(0);
    });

    it('should throw an error when removing data for non-existent account', async () => {
      await expect(accountService.completelyRemoveAccountData('non-existent-id', testUserId))
        .rejects.toThrow(/Account with ID non-existent-id not found/);
    });

    it('should remove all relationships during complete removal', async () => {
      // Create a second account
      const secondAccount = await accountService.createAccount({
        ...testAccountData,
        name: 'Second Test Account'
      }, testUserId);

      // Create a relationship between the accounts
      await accountService.updateAccountRelationships(testAccountId, {
        addRelationships: [{
          targetAccountId: secondAccount.id,
          relationshipType: 0, // PARENT_CHILD
          isParent: false // testAccount is child of secondAccount
        }],
        removeRelationships: []
      }, testUserId);

      // Verify relationship exists
      const relationships = await accountRepository.getRelationships(testAccountId);
      expect(relationships.parentRelationships.length).toBe(1);

      // Execute the complete removal
      await accountService.completelyRemoveAccountData(testAccountId, testUserId);

      // Verify second account still exists but has no relationships
      const secondAccountRelationships = await accountRepository.getRelationships(secondAccount.id);
      expect(secondAccountRelationships.childRelationships.length).toBe(0);
    });
  });

  describe('Integration with Existing Features', () => {
    it('should handle regular deletion differently from GDPR removal', async () => {
      // Create audit entries
      await auditService.logAccess('account', testAccountId, testUserId);
      
      // Perform regular deletion
      await accountService.deleteAccount(testAccountId, testUserId);
      
      // Verify account is deleted
      await expect(accountRepository.findById(testAccountId))
        .rejects.toThrow(/Account with ID .* not found/);
      
      // But audit trail should still exist after regular deletion
      const auditExport = await auditService.exportAuditData('account', testAccountId);
      expect(auditExport.entries.length).toBeGreaterThan(0);
      
      // Create a new account for GDPR removal test
      const newAccount = await accountService.createAccount(testAccountData, testUserId);
      await auditService.logAccess('account', newAccount.id, testUserId);
      
      // Perform GDPR removal
      await accountService.completelyRemoveAccountData(newAccount.id, testUserId);
      
      // Verify account is deleted
      await expect(accountRepository.findById(newAccount.id))
        .rejects.toThrow(/Account with ID .* not found/);
      
      // Audit trail should be gone after GDPR removal
      const newAuditExport = await auditService.exportAuditData('account', newAccount.id);
      expect(newAuditExport.entries.length).toBe(0);
    });
  });
});