import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccountController } from '../../../controllers/AccountController';
import { AccountService } from '../../../services/AccountService';
import { AuditService } from '../../../services/AuditService';
import { PermissionService } from '../../../services/PermissionService';
import { EncryptionService } from '../../../services/EncryptionService';
import { AccountRepository } from '../../../repositories/AccountRepository';
import { AccountCreateDto } from '../../../models/dto/AccountDto';
import { AccountType, AccountStatus } from '../../../models/enums/AccountEnums';
import { AccountEncryptionUtils } from '../../../utils/AccountEncryptionUtils';
import { SensitiveDataUtils } from '../../../utils/SensitiveDataUtils';

/**
 * This test suite validates the compliance features of the Account Management system,
 * focusing on data encryption, audit logging, data export, and complete data removal
 * to ensure compliance with GDPR and SOC2 requirements (Requirement 7).
 */
describe('Account Compliance Features Integration Tests', () => {
  // Services and controllers
  let accountRepository: AccountRepository;
  let auditService: AuditService;
  let permissionService: PermissionService;
  let encryptionService: EncryptionService;
  let accountService: AccountService;
  let accountController: AccountController;
  
  // Test data
  const testUserId = 'test-compliance-user';
  const testUserName = 'Test Compliance User';
  let testAccountId: string;
  
  // Test encryption key
  const TEST_ENCRYPTION_KEY = 'test-encryption-key-for-integration-tests';
  
  // Sample account with sensitive data
  const testAccountData: AccountCreateDto = {
    name: 'Compliance Test Account',
    industry: 'Healthcare',
    type: AccountType.CUSTOMER,
    status: AccountStatus.ACTIVE,
    email: 'compliance@testaccount.com',
    phone: '+1-555-123-4567',
    website: 'https://www.compliance-test.com',
    billingAddress: {
      street: '123 Compliance Street',
      city: 'Privacy Town',
      state: 'CA',
      postalCode: '12345',
      country: 'USA'
    },
    shippingAddress: {
      street: '456 GDPR Avenue',
      city: 'Data Protection City',
      state: 'NY',
      postalCode: '67890',
      country: 'USA'
    },
    description: 'Account for testing compliance features',
    annualRevenue: 5000000,
    employeeCount: 100,
    tags: ['compliance', 'gdpr', 'soc2', 'test'],
    customFields: {
      sensitiveNote: 'This contains PII data',
      dataSubjectConsent: 'Obtained on 2023-01-15'
    }
  };

  beforeEach(async () => {
    // Initialize services with test configuration
    encryptionService = new EncryptionService(TEST_ENCRYPTION_KEY);
    accountRepository = new AccountRepository();
    auditService = new AuditService();
    permissionService = new PermissionService();
    
    // Set up audit service with test user
    auditService.setUserName(testUserId, testUserName);
    
    // Initialize account service with dependencies
    accountService = new AccountService(accountRepository, auditService, encryptionService);
    
    // Initialize controller
    accountController = new AccountController(accountService, auditService, permissionService);
    
    // Mock permission service to always return true for tests
    vi.spyOn(permissionService, 'canView').mockResolvedValue(true);
    vi.spyOn(permissionService, 'canCreate').mockResolvedValue(true);
    vi.spyOn(permissionService, 'canUpdate').mockResolvedValue(true);
    vi.spyOn(permissionService, 'canDelete').mockResolvedValue(true);
    vi.spyOn(permissionService, 'filterByPermission').mockImplementation(
      async (userId, entityType, entities) => entities
    );
    
    // Create a test account for each test
    const account = await accountController.create(testAccountData);
    testAccountId = account.id;
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await accountController.completelyRemoveAccountData(testAccountId);
    } catch (error) {
      // Ignore errors if account doesn't exist
    }
  });

  describe('Data Encryption (Requirement 7.1)', () => {
    it('should encrypt sensitive data when storing accounts', async () => {
      // Retrieve the account directly from repository to check raw stored data
      const storedAccount = await accountRepository.findById(testAccountId);
      
      // Verify sensitive fields are encrypted
      expect(storedAccount.email).not.toEqual(testAccountData.email);
      expect(storedAccount.phone).not.toEqual(testAccountData.phone);
      
      // Verify address fields are encrypted
      expect(storedAccount.billingAddress?.street).not.toEqual(testAccountData.billingAddress?.street);
      expect(storedAccount.billingAddress?.postalCode).not.toEqual(testAccountData.billingAddress?.postalCode);
      expect(storedAccount.shippingAddress?.street).not.toEqual(testAccountData.shippingAddress?.street);
      expect(storedAccount.shippingAddress?.postalCode).not.toEqual(testAccountData.shippingAddress?.postalCode);
      
      // Verify encrypted data format (should be iv:authTag:encryptedData)
      const encryptedFields = [
        storedAccount.email,
        storedAccount.phone,
        storedAccount.billingAddress?.street,
        storedAccount.billingAddress?.postalCode,
        storedAccount.shippingAddress?.street,
        storedAccount.shippingAddress?.postalCode
      ].filter(Boolean);
      
      for (const field of encryptedFields) {
        expect(field?.split(':').length).toBe(3);
      }
      
      // Verify non-sensitive fields remain unencrypted
      expect(storedAccount.name).toEqual(testAccountData.name);
      expect(storedAccount.industry).toEqual(testAccountData.industry);
      expect(storedAccount.description).toEqual(testAccountData.description);
    });
    
    it('should decrypt sensitive data when retrieving accounts through the API', async () => {
      // Retrieve the account through the controller (should be decrypted)
      const retrievedAccount = await accountController.getById(testAccountId);
      
      // Verify sensitive fields are decrypted and match original data
      expect(retrievedAccount.email).toEqual(testAccountData.email);
      expect(retrievedAccount.phone).toEqual(testAccountData.phone);
      expect(retrievedAccount.billingAddress?.street).toEqual(testAccountData.billingAddress?.street);
      expect(retrievedAccount.billingAddress?.postalCode).toEqual(testAccountData.billingAddress?.postalCode);
      expect(retrievedAccount.shippingAddress?.street).toEqual(testAccountData.shippingAddress?.street);
      expect(retrievedAccount.shippingAddress?.postalCode).toEqual(testAccountData.shippingAddress?.postalCode);
    });
    
    it('should maintain encryption when updating sensitive fields', async () => {
      // Update account with new sensitive data
      const updateData = {
        email: 'updated@testaccount.com',
        phone: '+1-555-987-6543',
        billingAddress: {
          ...testAccountData.billingAddress,
          street: '789 Updated Street',
          postalCode: '54321'
        }
      };
      
      await accountController.update(testAccountId, updateData);
      
      // Retrieve the updated account directly from repository
      const storedAccount = await accountRepository.findById(testAccountId);
      
      // Verify updated sensitive fields are encrypted
      expect(storedAccount.email).not.toEqual(updateData.email);
      expect(storedAccount.phone).not.toEqual(updateData.phone);
      expect(storedAccount.billingAddress?.street).not.toEqual(updateData.billingAddress?.street);
      expect(storedAccount.billingAddress?.postalCode).not.toEqual(updateData.billingAddress?.postalCode);
      
      // Retrieve through controller and verify decryption works
      const retrievedAccount = await accountController.getById(testAccountId);
      expect(retrievedAccount.email).toEqual(updateData.email);
      expect(retrievedAccount.phone).toEqual(updateData.phone);
      expect(retrievedAccount.billingAddress?.street).toEqual(updateData.billingAddress?.street);
      expect(retrievedAccount.billingAddress?.postalCode).toEqual(updateData.billingAddress?.postalCode);
    });
    
    it('should mask sensitive data in responses when requested', async () => {
      // Get masked account data
      const maskedAccount = AccountEncryptionUtils.maskSensitiveAccountData(
        await accountController.getById(testAccountId)
      );
      
      // Verify sensitive fields are masked
      expect(maskedAccount.email).toEqual('c******@testaccount.com');
      expect(maskedAccount.phone).not.toEqual(testAccountData.phone);
      expect(maskedAccount.phone).toMatch(/^\*+\d{4}$/); // Should end with last 4 digits
      
      expect(maskedAccount.billingAddress?.street).toMatch(/^\d+ \*+$/);
      expect(maskedAccount.billingAddress?.postalCode).toMatch(/^\d\*+$/);
      
      expect(maskedAccount.shippingAddress?.street).toMatch(/^\d+ \*+$/);
      expect(maskedAccount.shippingAddress?.postalCode).toMatch(/^\d\*+$/);
      
      // Verify non-sensitive fields remain unchanged
      expect(maskedAccount.name).toEqual(testAccountData.name);
      expect(maskedAccount.industry).toEqual(testAccountData.industry);
    });
  });

  describe('Audit Logging (Requirement 7.2)', () => {
    it('should maintain detailed access logs for all account operations', async () => {
      // Perform various operations on the account
      await accountController.getById(testAccountId); // Access
      await accountController.update(testAccountId, { name: 'Updated Name' }); // Update
      await accountController.getById(testAccountId); // Access again
      
      // Get the audit trail
      const auditTrail = await auditService.getAuditTrail('account', testAccountId);
      
      // Verify audit entries exist for all operations
      expect(auditTrail.total).toBeGreaterThanOrEqual(4); // Create + 3 operations above
      
      // Verify audit entries contain required information
      const actions = auditTrail.items.map(entry => entry.action);
      expect(actions).toContain('create');
      expect(actions).toContain('access');
      expect(actions).toContain('update');
      
      // Verify audit entries contain user information
      expect(auditTrail.items.some(entry => entry.userId === testUserId)).toBe(true);
      
      // Verify timestamps are recorded
      expect(auditTrail.items.every(entry => entry.timestamp instanceof Date)).toBe(true);
      
      // Verify update details are recorded
      const updateEntry = auditTrail.items.find(entry => entry.action === 'update');
      expect(updateEntry?.details.changes).toHaveProperty('name', 'Updated Name');
    });
    
    it('should sanitize sensitive data in audit logs', async () => {
      // Update with sensitive data
      await accountController.update(testAccountId, { 
        email: 'sensitive@example.com',
        phone: '+1-555-123-9999'
      });
      
      // Get the audit trail
      const auditTrail = await auditService.getAuditTrail('account', testAccountId);
      
      // Find the update entry
      const updateEntry = auditTrail.items.find(entry => 
        entry.action === 'update' && 
        entry.details.changes && 
        (entry.details.changes.email || entry.details.changes.phone)
      );
      
      // Verify sensitive data is sanitized in audit logs
      expect(updateEntry).toBeDefined();
      if (updateEntry?.details.changes.email) {
        expect(updateEntry.details.changes.email).not.toEqual('sensitive@example.com');
        expect(updateEntry.details.changes.email).toMatch(/\[REDACTED\]|\*+@example\.com/);
      }
      
      if (updateEntry?.details.changes.phone) {
        expect(updateEntry.details.changes.phone).not.toEqual('+1-555-123-9999');
        expect(updateEntry.details.changes.phone).toMatch(/\[REDACTED\]|\*+9999/);
      }
    });
    
    it('should record audit logs for permission-related actions', async () => {
      // Mock permission denied
      vi.spyOn(permissionService, 'canUpdate').mockResolvedValueOnce(false);
      
      // Attempt to update without permission
      try {
        await accountController.update(testAccountId, { name: 'Unauthorized Update' });
      } catch (error) {
        // Expected error
      }
      
      // Get the audit trail
      const auditTrail = await auditService.getAuditTrail('account', testAccountId);
      
      // Find permission denied entries
      const permissionEntries = auditTrail.items.filter(entry => 
        entry.details && entry.details.permissionDenied === true
      );
      
      // Verify permission denied was logged
      expect(permissionEntries.length).toBeGreaterThan(0);
      expect(permissionEntries[0].details.attemptedAction).toBe('update');
    });
  });

  describe('Data Export Functionality (Requirement 7.3)', () => {
    it('should export all data related to a specific account', async () => {
      // Create some related data
      const secondAccount = await accountController.create({
        ...testAccountData,
        name: 'Related Account'
      });
      
      // Create a relationship between accounts
      await accountService.updateAccountRelationships(testAccountId, {
        addRelationships: [{
          targetAccountId: secondAccount.id,
          relationshipType: 0, // PARENT_CHILD
          isParent: true // testAccount is parent of secondAccount
        }],
        removeRelationships: []
      }, testUserId);
      
      // Generate some additional audit logs
      await accountController.getById(testAccountId);
      await accountController.update(testAccountId, { description: 'Updated for export test' });
      
      // Execute the export
      const exportData = await accountController.exportAccountData(testAccountId);
      
      // Verify export contains all required data
      expect(exportData).toBeDefined();
      expect(exportData.account).toBeDefined();
      expect(exportData.account.id).toBe(testAccountId);
      expect(exportData.relationships).toBeDefined();
      expect(exportData.auditTrail).toBeDefined();
      expect(exportData.exportDate).toBeInstanceOf(Date);
      
      // Verify account data is complete and decrypted
      expect(exportData.account.name).toBe(testAccountData.name);
      expect(exportData.account.email).toBe(testAccountData.email);
      expect(exportData.account.phone).toBe(testAccountData.phone);
      expect(exportData.account.billingAddress?.street).toBe(testAccountData.billingAddress?.street);
      
      // Verify relationships are included
      expect(exportData.relationships.childRelationships.length).toBe(1);
      expect(exportData.relationships.childRelationships[0].childAccountId).toBe(secondAccount.id);
      
      // Verify audit trail is complete
      expect(exportData.auditTrail.length).toBeGreaterThan(0);
      expect(exportData.auditTrail.some(entry => entry.action === 'create')).toBe(true);
      expect(exportData.auditTrail.some(entry => entry.action === 'update')).toBe(true);
      expect(exportData.auditTrail.some(entry => entry.action === 'access')).toBe(true);
      
      // Clean up the second account
      await accountController.completelyRemoveAccountData(secondAccount.id);
    });
    
    it('should include all custom fields in the export', async () => {
      // Add some custom fields
      await accountController.update(testAccountId, {
        customFields: {
          gdprConsent: 'Granted on 2023-05-15',
          marketingPreferences: 'Email only',
          dataRetentionPolicy: '5 years'
        }
      });
      
      // Execute the export
      const exportData = await accountController.exportAccountData(testAccountId);
      
      // Verify custom fields are included
      expect(exportData.account.customFields).toBeDefined();
      expect(exportData.account.customFields?.gdprConsent).toBe('Granted on 2023-05-15');
      expect(exportData.account.customFields?.marketingPreferences).toBe('Email only');
      expect(exportData.account.customFields?.dataRetentionPolicy).toBe('5 years');
    });
    
    it('should export data in a portable, machine-readable format', async () => {
      // Execute the export
      const exportData = await accountController.exportAccountData(testAccountId);
      
      // Convert to JSON to verify it's machine-readable
      const jsonData = JSON.stringify(exportData);
      expect(jsonData).toBeDefined();
      
      // Parse back to verify integrity
      const parsedData = JSON.parse(jsonData);
      expect(parsedData.account.id).toBe(testAccountId);
      expect(parsedData.account.name).toBe(testAccountData.name);
      
      // Verify dates are properly serialized
      expect(typeof parsedData.exportDate).toBe('string');
      expect(new Date(parsedData.exportDate)).toBeInstanceOf(Date);
    });
  });

  describe('Complete Data Removal (Requirement 7.4)', () => {
    it('should completely remove all account data including audit trail', async () => {
      // Create some audit logs
      await accountController.getById(testAccountId);
      await accountController.update(testAccountId, { name: 'Updated Before Deletion' });
      
      // Verify account exists
      const accountBeforeRemoval = await accountController.getById(testAccountId);
      expect(accountBeforeRemoval.id).toBe(testAccountId);
      
      // Verify audit trail exists
      const auditBeforeRemoval = await auditService.getAuditTrail('account', testAccountId);
      expect(auditBeforeRemoval.total).toBeGreaterThan(0);
      
      // Execute complete removal
      const result = await accountController.completelyRemoveAccountData(testAccountId);
      expect(result.success).toBe(true);
      
      // Verify account no longer exists
      await expect(accountController.getById(testAccountId)).rejects.toThrow();
      
      // Verify audit trail is also removed
      const auditAfterRemoval = await auditService.getAuditTrail('account', testAccountId);
      expect(auditAfterRemoval.total).toBe(0);
      expect(auditAfterRemoval.items.length).toBe(0);
    });
    
    it('should remove all relationships during complete removal', async () => {
      // Create a second account
      const secondAccount = await accountController.create({
        ...testAccountData,
        name: 'Related Account For Removal Test'
      });
      
      // Create a relationship between accounts
      await accountService.updateAccountRelationships(testAccountId, {
        addRelationships: [{
          targetAccountId: secondAccount.id,
          relationshipType: 0, // PARENT_CHILD
          isParent: true // testAccount is parent of secondAccount
        }],
        removeRelationships: []
      }, testUserId);
      
      // Verify relationship exists
      const relationshipsBeforeRemoval = await accountRepository.getRelationships(secondAccount.id);
      expect(relationshipsBeforeRemoval.parentRelationships.length).toBe(1);
      expect(relationshipsBeforeRemoval.parentRelationships[0].parentAccountId).toBe(testAccountId);
      
      // Execute complete removal of first account
      await accountController.completelyRemoveAccountData(testAccountId);
      
      // Verify second account still exists but has no relationships
      const secondAccountAfterRemoval = await accountController.getById(secondAccount.id);
      expect(secondAccountAfterRemoval.id).toBe(secondAccount.id);
      
      const relationshipsAfterRemoval = await accountRepository.getRelationships(secondAccount.id);
      expect(relationshipsAfterRemoval.parentRelationships.length).toBe(0);
      
      // Clean up the second account
      await accountController.completelyRemoveAccountData(secondAccount.id);
    });
    
    it('should handle regular deletion differently from GDPR removal', async () => {
      // Create a second account for comparison
      const secondAccount = await accountController.create({
        ...testAccountData,
        name: 'Regular Deletion Test Account'
      });
      
      // Generate audit logs for both accounts
      await accountController.getById(testAccountId);
      await accountController.getById(secondAccount.id);
      
      // Perform regular deletion on the second account
      await accountController.delete(secondAccount.id);
      
      // Verify second account is deleted
      await expect(accountController.getById(secondAccount.id)).rejects.toThrow();
      
      // But audit trail should still exist after regular deletion
      const secondAccountAudit = await auditService.getAuditTrail('account', secondAccount.id);
      expect(secondAccountAudit.total).toBeGreaterThan(0);
      
      // Perform GDPR removal on the first account
      await accountController.completelyRemoveAccountData(testAccountId);
      
      // Verify first account is deleted
      await expect(accountController.getById(testAccountId)).rejects.toThrow();
      
      // Audit trail should be gone after GDPR removal
      const firstAccountAudit = await auditService.getAuditTrail('account', testAccountId);
      expect(firstAccountAudit.total).toBe(0);
    });
  });

  describe('Secure Data Transmission (Requirement 7.5)', () => {
    // Note: This test is more limited as we can't easily test TLS in unit tests
    // In a real environment, this would be tested with end-to-end tests
    
    it('should ensure sensitive data is properly secured during transmission', async () => {
      // This is a simplified test that verifies the system is set up to handle secure transmission
      
      // Check that sensitive fields are identified correctly
      expect(SensitiveDataUtils.isSensitiveField('email')).toBe(true);
      expect(SensitiveDataUtils.isSensitiveField('phone')).toBe(true);
      expect(SensitiveDataUtils.isSensitiveField('street')).toBe(true);
      expect(SensitiveDataUtils.isSensitiveField('postalCode')).toBe(true);
      
      // Verify encryption service is properly initialized
      expect(encryptionService).toBeDefined();
      
      // Test a round-trip encryption/decryption to verify data integrity
      const sensitiveData = 'highly sensitive information';
      const encrypted = await encryptionService.encrypt(sensitiveData);
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(sensitiveData);
    });
    
    it('should mask sensitive data in responses when appropriate', async () => {
      // Get the account
      const account = await accountController.getById(testAccountId);
      
      // Mask sensitive data
      const maskedAccount = AccountEncryptionUtils.maskSensitiveAccountData(account);
      
      // Verify sensitive fields are masked
      expect(maskedAccount.email).not.toEqual(account.email);
      expect(maskedAccount.phone).not.toEqual(account.phone);
      
      // Verify format of masked data
      expect(maskedAccount.email).toMatch(/^[a-z].*@.*\.com$/);
      expect(maskedAccount.phone).toMatch(/^\*+\d{4}$/);
    });
  });

  describe('End-to-End Compliance Workflow', () => {
    it('should support a complete GDPR compliance workflow', async () => {
      // 1. Create an account with sensitive data
      const account = await accountController.create({
        ...testAccountData,
        name: 'GDPR Workflow Test Account'
      });
      const accountId = account.id;
      
      // 2. Verify data is encrypted at rest
      const storedAccount = await accountRepository.findById(accountId);
      expect(storedAccount.email).not.toEqual(testAccountData.email);
      
      // 3. Access the account multiple times to generate audit logs
      await accountController.getById(accountId);
      await accountController.update(accountId, { description: 'Updated for GDPR test' });
      await accountController.getById(accountId);
      
      // 4. Export all data (data subject access request)
      const exportData = await accountController.exportAccountData(accountId);
      expect(exportData.account.id).toBe(accountId);
      expect(exportData.account.email).toBe(testAccountData.email); // Should be decrypted
      expect(exportData.auditTrail.length).toBeGreaterThan(0);
      
      // 5. Verify audit log of the export itself
      const auditAfterExport = await auditService.getAuditTrail('account', accountId);
      const exportLogEntry = auditAfterExport.items.find(entry => 
        entry.action === 'access' && entry.details.reason === 'data_export'
      );
      expect(exportLogEntry).toBeDefined();
      
      // 6. Request complete removal (right to be forgotten)
      const removalResult = await accountController.completelyRemoveAccountData(accountId);
      expect(removalResult.success).toBe(true);
      
      // 7. Verify complete removal
      await expect(accountController.getById(accountId)).rejects.toThrow();
      const auditAfterRemoval = await auditService.getAuditTrail('account', accountId);
      expect(auditAfterRemoval.total).toBe(0);
    });
  });
});