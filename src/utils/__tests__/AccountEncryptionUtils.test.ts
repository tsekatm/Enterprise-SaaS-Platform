import { describe, it, expect, beforeEach } from 'vitest';
import { AccountEncryptionUtils } from '../AccountEncryptionUtils';
import { EncryptionService } from '../../services/EncryptionService';
import { Account } from '../../models/Account';
import { AccountType, AccountStatus } from '../../models/enums/AccountEnums';

describe('AccountEncryptionUtils', () => {
  // Use a test key for unit tests
  const TEST_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests-only';
  let encryptionService: EncryptionService;
  
  // Sample account for testing
  const testAccount: Account = {
    id: '12345',
    name: 'Test Company',
    industry: 'Technology',
    type: AccountType.CUSTOMER,
    status: AccountStatus.ACTIVE,
    website: 'https://example.com',
    phone: '555-123-4567',
    email: 'contact@example.com',
    billingAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'USA'
    },
    shippingAddress: {
      street: '456 Shipping Ave',
      city: 'Shiptown',
      state: 'NY',
      postalCode: '67890',
      country: 'USA'
    },
    description: 'A test account',
    annualRevenue: 1000000,
    employeeCount: 50,
    tags: ['test', 'example'],
    customFields: {
      sensitiveInfo: 'This is sensitive',
      contactPreference: 'Email'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1',
    updatedBy: 'user1'
  };

  beforeEach(() => {
    encryptionService = new EncryptionService(TEST_ENCRYPTION_KEY);
  });

  describe('encryptAccount', () => {
    it('should encrypt sensitive fields in an account', async () => {
      const encryptedAccount = await AccountEncryptionUtils.encryptAccount(
        testAccount,
        encryptionService
      );
      
      // Verify non-sensitive fields remain unchanged
      expect(encryptedAccount.id).toEqual(testAccount.id);
      expect(encryptedAccount.name).toEqual(testAccount.name);
      expect(encryptedAccount.industry).toEqual(testAccount.industry);
      expect(encryptedAccount.type).toEqual(testAccount.type);
      expect(encryptedAccount.status).toEqual(testAccount.status);
      expect(encryptedAccount.website).toEqual(testAccount.website);
      expect(encryptedAccount.description).toEqual(testAccount.description);
      expect(encryptedAccount.annualRevenue).toEqual(testAccount.annualRevenue);
      expect(encryptedAccount.employeeCount).toEqual(testAccount.employeeCount);
      expect(encryptedAccount.tags).toEqual(testAccount.tags);
      
      // Verify sensitive fields are encrypted
      expect(encryptedAccount.email).not.toEqual(testAccount.email);
      expect(encryptedAccount.phone).not.toEqual(testAccount.phone);
      expect(encryptedAccount.billingAddress?.street).not.toEqual(testAccount.billingAddress?.street);
      expect(encryptedAccount.billingAddress?.postalCode).not.toEqual(testAccount.billingAddress?.postalCode);
      expect(encryptedAccount.shippingAddress?.street).not.toEqual(testAccount.shippingAddress?.street);
      expect(encryptedAccount.shippingAddress?.postalCode).not.toEqual(testAccount.shippingAddress?.postalCode);
      
      // Verify non-sensitive address fields remain unchanged
      expect(encryptedAccount.billingAddress?.city).toEqual(testAccount.billingAddress?.city);
      expect(encryptedAccount.billingAddress?.state).toEqual(testAccount.billingAddress?.state);
      expect(encryptedAccount.billingAddress?.country).toEqual(testAccount.billingAddress?.country);
      expect(encryptedAccount.shippingAddress?.city).toEqual(testAccount.shippingAddress?.city);
      expect(encryptedAccount.shippingAddress?.state).toEqual(testAccount.shippingAddress?.state);
      expect(encryptedAccount.shippingAddress?.country).toEqual(testAccount.shippingAddress?.country);
    });

    it('should handle null or undefined values', async () => {
      const incompleteAccount: Account = {
        id: '12345',
        name: 'Incomplete Account',
        industry: 'Services',
        type: AccountType.PROSPECT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        updatedBy: 'user1'
      };
      
      const encryptedAccount = await AccountEncryptionUtils.encryptAccount(
        incompleteAccount,
        encryptionService
      );
      
      // Verify account is unchanged since it has no sensitive fields
      expect(encryptedAccount).toEqual(incompleteAccount);
    });
  });

  describe('decryptAccount', () => {
    it('should decrypt encrypted account fields correctly', async () => {
      // First encrypt the account
      const encryptedAccount = await AccountEncryptionUtils.encryptAccount(
        testAccount,
        encryptionService
      );
      
      // Then decrypt it
      const decryptedAccount = await AccountEncryptionUtils.decryptAccount(
        encryptedAccount,
        encryptionService
      );
      
      // Verify all fields match the original
      expect(decryptedAccount.id).toEqual(testAccount.id);
      expect(decryptedAccount.name).toEqual(testAccount.name);
      expect(decryptedAccount.industry).toEqual(testAccount.industry);
      expect(decryptedAccount.type).toEqual(testAccount.type);
      expect(decryptedAccount.status).toEqual(testAccount.status);
      expect(decryptedAccount.website).toEqual(testAccount.website);
      expect(decryptedAccount.email).toEqual(testAccount.email);
      expect(decryptedAccount.phone).toEqual(testAccount.phone);
      expect(decryptedAccount.description).toEqual(testAccount.description);
      expect(decryptedAccount.annualRevenue).toEqual(testAccount.annualRevenue);
      expect(decryptedAccount.employeeCount).toEqual(testAccount.employeeCount);
      expect(decryptedAccount.tags).toEqual(testAccount.tags);
      
      // Verify address fields
      expect(decryptedAccount.billingAddress?.street).toEqual(testAccount.billingAddress?.street);
      expect(decryptedAccount.billingAddress?.city).toEqual(testAccount.billingAddress?.city);
      expect(decryptedAccount.billingAddress?.state).toEqual(testAccount.billingAddress?.state);
      expect(decryptedAccount.billingAddress?.postalCode).toEqual(testAccount.billingAddress?.postalCode);
      expect(decryptedAccount.billingAddress?.country).toEqual(testAccount.billingAddress?.country);
      
      expect(decryptedAccount.shippingAddress?.street).toEqual(testAccount.shippingAddress?.street);
      expect(decryptedAccount.shippingAddress?.city).toEqual(testAccount.shippingAddress?.city);
      expect(decryptedAccount.shippingAddress?.state).toEqual(testAccount.shippingAddress?.state);
      expect(decryptedAccount.shippingAddress?.postalCode).toEqual(testAccount.shippingAddress?.postalCode);
      expect(decryptedAccount.shippingAddress?.country).toEqual(testAccount.shippingAddress?.country);
    });

    it('should handle decryption errors gracefully', async () => {
      // Create an account with invalid encrypted data
      const accountWithInvalidData: Account = {
        ...testAccount,
        email: 'invalid:encrypted:data',
        phone: 'also:invalid:data'
      };
      
      // Attempt to decrypt
      const result = await AccountEncryptionUtils.decryptAccount(
        accountWithInvalidData,
        encryptionService
      );
      
      // Should keep the original values when decryption fails
      expect(result.email).toEqual(accountWithInvalidData.email);
      expect(result.phone).toEqual(accountWithInvalidData.phone);
      
      // Other fields should remain unchanged
      expect(result.name).toEqual(testAccount.name);
      expect(result.industry).toEqual(testAccount.industry);
    });
  });

  describe('maskSensitiveAccountData', () => {
    it('should mask sensitive fields in an account', () => {
      const maskedAccount = AccountEncryptionUtils.maskSensitiveAccountData(testAccount);
      
      // Verify non-sensitive fields remain unchanged
      expect(maskedAccount.id).toEqual(testAccount.id);
      expect(maskedAccount.name).toEqual(testAccount.name);
      expect(maskedAccount.industry).toEqual(testAccount.industry);
      expect(maskedAccount.type).toEqual(testAccount.type);
      expect(maskedAccount.status).toEqual(testAccount.status);
      expect(maskedAccount.website).toEqual(testAccount.website);
      expect(maskedAccount.description).toEqual(testAccount.description);
      expect(maskedAccount.annualRevenue).toEqual(testAccount.annualRevenue);
      expect(maskedAccount.employeeCount).toEqual(testAccount.employeeCount);
      expect(maskedAccount.tags).toEqual(testAccount.tags);
      
      // Verify sensitive fields are masked
      expect(maskedAccount.email).not.toEqual(testAccount.email);
      expect(maskedAccount.email).toEqual('c******@example.com');
      
      expect(maskedAccount.phone).not.toEqual(testAccount.phone);
      expect(maskedAccount.phone).toEqual('********4567');
      
      expect(maskedAccount.billingAddress?.street).not.toEqual(testAccount.billingAddress?.street);
      expect(maskedAccount.billingAddress?.street).toEqual('123 *********');
      
      expect(maskedAccount.billingAddress?.postalCode).not.toEqual(testAccount.billingAddress?.postalCode);
      expect(maskedAccount.billingAddress?.postalCode).toEqual('1****');
      
      expect(maskedAccount.shippingAddress?.street).not.toEqual(testAccount.shippingAddress?.street);
      expect(maskedAccount.shippingAddress?.street).toEqual('456 *********');
      
      expect(maskedAccount.shippingAddress?.postalCode).not.toEqual(testAccount.shippingAddress?.postalCode);
      expect(maskedAccount.shippingAddress?.postalCode).toEqual('6****');
      
      // Verify custom fields are masked
      expect(maskedAccount.customFields).toEqual({ _masked: 'Contains sensitive data' });
      
      // Verify non-sensitive address fields remain unchanged
      expect(maskedAccount.billingAddress?.city).toEqual(testAccount.billingAddress?.city);
      expect(maskedAccount.billingAddress?.state).toEqual(testAccount.billingAddress?.state);
      expect(maskedAccount.billingAddress?.country).toEqual(testAccount.billingAddress?.country);
      expect(maskedAccount.shippingAddress?.city).toEqual(testAccount.shippingAddress?.city);
      expect(maskedAccount.shippingAddress?.state).toEqual(testAccount.shippingAddress?.state);
      expect(maskedAccount.shippingAddress?.country).toEqual(testAccount.shippingAddress?.country);
    });

    it('should handle null or undefined values', () => {
      const incompleteAccount: Account = {
        id: '12345',
        name: 'Incomplete Account',
        industry: 'Services',
        type: AccountType.PROSPECT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        updatedBy: 'user1'
      };
      
      const maskedAccount = AccountEncryptionUtils.maskSensitiveAccountData(incompleteAccount);
      
      // Verify account is unchanged since it has no sensitive fields
      expect(maskedAccount).toEqual(incompleteAccount);
    });
  });
});