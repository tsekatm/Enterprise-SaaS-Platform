import { describe, it, expect } from 'vitest';
import { Account, validateAccount, validateAddress } from '../Account';
import { AccountStatus, AccountType } from '../enums/AccountEnums';
import { Address } from '../Address';

// Display diagnostic message
console.log('=== DIAGNOSTIC MESSAGE ===');
console.log('If you are having trouble accessing the CRUD interface, please try:');
console.log('1. Visit http://localhost:3000/test.html to test the server');
console.log('2. Check if the server is running correctly');
console.log('3. Try restarting the server with: npm start');
console.log('4. Check browser console for JavaScript errors');
console.log('=========================');

describe('Account Model', () => {
  describe('validateAccount', () => {
    it('should return no errors for a valid account', () => {
      const validAccount: Account = {
        id: '1',
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccount(validAccount);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidAccount = {
        id: '1',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      } as Account;

      const errors = validateAccount(invalidAccount);
      expect(errors).toContain('Account name is required');
      expect(errors).toContain('Industry is required');
      expect(errors).toContain('Account type is required');
      expect(errors).toContain('Account status is required');
    });

    it('should validate email format if provided', () => {
      const accountWithInvalidEmail: Account = {
        id: '1',
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        email: 'invalid-email',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccount(accountWithInvalidEmail);
      expect(errors).toContain('Invalid email format');

      const accountWithValidEmail = {
        ...accountWithInvalidEmail,
        email: 'valid@example.com'
      };

      const validErrors = validateAccount(accountWithValidEmail);
      expect(validErrors).toHaveLength(0);
    });

    it('should validate website URL format if provided', () => {
      const accountWithInvalidWebsite: Account = {
        id: '1',
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        website: 'invalid-url',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccount(accountWithInvalidWebsite);
      expect(errors).toContain('Invalid website URL format');

      const accountWithValidWebsite = {
        ...accountWithInvalidWebsite,
        website: 'https://example.com'
      };

      const validErrors = validateAccount(accountWithValidWebsite);
      expect(validErrors).toHaveLength(0);
    });

    it('should validate phone number format if provided', () => {
      const accountWithInvalidPhone: Account = {
        id: '1',
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        phone: 'abc',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccount(accountWithInvalidPhone);
      expect(errors).toContain('Invalid phone number format');

      const accountWithValidPhone = {
        ...accountWithInvalidPhone,
        phone: '+12345678901'
      };

      const validErrors = validateAccount(accountWithValidPhone);
      expect(validErrors).toHaveLength(0);
    });

    it('should validate billing address if provided', () => {
      const invalidAddress: Address = {
        street: '',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      };

      const accountWithInvalidAddress: Account = {
        id: '1',
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        billingAddress: invalidAddress,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccount(accountWithInvalidAddress);
      expect(errors).toContain('billing Street is required');
    });

    it('should validate shipping address if provided', () => {
      const invalidAddress: Address = {
        street: '123 Main St',
        city: '',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      };

      const accountWithInvalidAddress: Account = {
        id: '1',
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        shippingAddress: invalidAddress,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccount(accountWithInvalidAddress);
      expect(errors).toContain('shipping City is required');
    });
  });

  describe('validateAddress', () => {
    it('should return no errors for a valid address', () => {
      const validAddress: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      };

      const errors = validateAddress(validAddress);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidAddress = {} as Address;

      const errors = validateAddress(invalidAddress);
      expect(errors).toContain('Street is required');
      expect(errors).toContain('City is required');
      expect(errors).toContain('State is required');
      expect(errors).toContain('Postal code is required');
      expect(errors).toContain('Country is required');
    });

    it('should prefix error messages when prefix is provided', () => {
      const invalidAddress = {} as Address;

      const errors = validateAddress(invalidAddress, 'billing');
      expect(errors).toContain('billing Street is required');
      expect(errors).toContain('billing City is required');
      expect(errors).toContain('billing State is required');
      expect(errors).toContain('billing Postal code is required');
      expect(errors).toContain('billing Country is required');
    });
  });
});