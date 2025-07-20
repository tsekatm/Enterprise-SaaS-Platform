import { EncryptionService } from '../EncryptionService';
import { SensitiveDataUtils } from '../../utils/SensitiveDataUtils';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EncryptionService', () => {
  // Use a test key for unit tests
  const TEST_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests-only';
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService(TEST_ENCRYPTION_KEY);
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', async () => {
      const originalText = 'sensitive data that needs encryption';
      
      // Encrypt the text
      const encryptedText = await encryptionService.encrypt(originalText);
      
      // Verify encrypted text is different from original
      expect(encryptedText).not.toEqual(originalText);
      
      // Verify encrypted text contains the expected format (iv:authTag:encryptedData)
      expect(encryptedText.split(':').length).toBe(3);
      
      // Decrypt the text
      const decryptedText = await encryptionService.decrypt(encryptedText);
      
      // Verify decrypted text matches original
      expect(decryptedText).toEqual(originalText);
    });

    it('should handle empty strings', async () => {
      const emptyText = '';
      
      // Encrypt empty string
      const encryptedText = await encryptionService.encrypt(emptyText);
      
      // Should return empty string as is
      expect(encryptedText).toEqual(emptyText);
      
      // Decrypt empty string
      const decryptedText = await encryptionService.decrypt(emptyText);
      
      // Should return empty string as is
      expect(decryptedText).toEqual(emptyText);
    });

    it('should throw an error when decrypting invalid data', async () => {
      const invalidEncryptedData = 'invalid:encrypted:data';
      
      // Attempt to decrypt invalid data should throw an error
      await expect(encryptionService.decrypt(invalidEncryptedData)).rejects.toThrow();
    });
  });

  describe('encryptObject and decryptObject', () => {
    it('should encrypt and decrypt object fields correctly', async () => {
      const testObject = {
        id: '12345',
        name: 'Test Account',
        email: 'test@example.com',
        phone: '555-123-4567',
        description: 'This is a test account'
      };
      
      const sensitiveFields = ['email', 'phone'];
      
      // Encrypt sensitive fields
      const encryptedObject = await encryptionService.encryptObject(testObject, sensitiveFields);
      
      // Verify non-sensitive fields remain unchanged
      expect(encryptedObject.id).toEqual(testObject.id);
      expect(encryptedObject.name).toEqual(testObject.name);
      expect(encryptedObject.description).toEqual(testObject.description);
      
      // Verify sensitive fields are encrypted
      expect(encryptedObject.email).not.toEqual(testObject.email);
      expect(encryptedObject.phone).not.toEqual(testObject.phone);
      
      // Decrypt the object
      const decryptedObject = await encryptionService.decryptObject(encryptedObject, sensitiveFields);
      
      // Verify all fields match the original
      expect(decryptedObject).toEqual(testObject);
    });

    it('should handle nested objects correctly', async () => {
      const testObject = {
        id: '12345',
        name: 'Test Account',
        billingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA'
        }
      };
      
      // For nested objects, we need to encrypt the entire nested object
      const sensitiveFields = ['billingAddress'];
      
      // Stringify the nested object for encryption
      const objectWithStringifiedAddress = {
        ...testObject,
        billingAddress: JSON.stringify(testObject.billingAddress)
      };
      
      // Encrypt sensitive fields
      const encryptedObject = await encryptionService.encryptObject(
        objectWithStringifiedAddress, 
        sensitiveFields
      );
      
      // Verify non-sensitive fields remain unchanged
      expect(encryptedObject.id).toEqual(testObject.id);
      expect(encryptedObject.name).toEqual(testObject.name);
      
      // Verify sensitive fields are encrypted
      expect(encryptedObject.billingAddress).not.toEqual(JSON.stringify(testObject.billingAddress));
      
      // Decrypt the object
      const decryptedObject = await encryptionService.decryptObject(
        encryptedObject, 
        sensitiveFields
      );
      
      // Parse the stringified address back to an object
      const finalObject = {
        ...decryptedObject,
        billingAddress: JSON.parse(decryptedObject.billingAddress as string)
      };
      
      // Verify all fields match the original
      expect(finalObject).toEqual(testObject);
    });

    it('should handle null and undefined values', async () => {
      const testObject = {
        id: '12345',
        name: 'Test Account',
        email: null,
        phone: undefined
      };
      
      const sensitiveFields = ['email', 'phone'];
      
      // Encrypt sensitive fields
      const encryptedObject = await encryptionService.encryptObject(testObject, sensitiveFields);
      
      // Verify null and undefined values remain unchanged
      expect(encryptedObject.email).toBeNull();
      expect(encryptedObject.phone).toBeUndefined();
      
      // Decrypt the object
      const decryptedObject = await encryptionService.decryptObject(encryptedObject, sensitiveFields);
      
      // Verify all fields match the original
      expect(decryptedObject).toEqual(testObject);
    });
  });

  describe('error handling', () => {
    it('should throw an error when initialized without an encryption key', () => {
      // Save original environment
      const originalEnv = process.env.ENCRYPTION_KEY;
      
      // Remove environment variable
      delete process.env.ENCRYPTION_KEY;
      
      // Attempt to create service without key should throw
      expect(() => new EncryptionService()).toThrow();
      
      // Restore environment
      process.env.ENCRYPTION_KEY = originalEnv;
    });
  });
});

describe('SensitiveDataUtils', () => {
  describe('isSensitiveField', () => {
    it('should correctly identify sensitive fields', () => {
      expect(SensitiveDataUtils.isSensitiveField('email')).toBe(true);
      expect(SensitiveDataUtils.isSensitiveField('phone')).toBe(true);
      expect(SensitiveDataUtils.isSensitiveField('street')).toBe(true);
      expect(SensitiveDataUtils.isSensitiveField('postalCode')).toBe(true);
      
      expect(SensitiveDataUtils.isSensitiveField('name')).toBe(false);
      expect(SensitiveDataUtils.isSensitiveField('id')).toBe(false);
      expect(SensitiveDataUtils.isSensitiveField('description')).toBe(false);
    });
  });

  describe('maskSensitiveData', () => {
    it('should correctly mask email addresses', () => {
      const email = 'john.doe@example.com';
      const masked = SensitiveDataUtils.maskSensitiveData(email, 'email');
      
      expect(masked).toBe('j******@example.com');
    });

    it('should correctly mask phone numbers', () => {
      const phone = '555-123-4567';
      const masked = SensitiveDataUtils.maskSensitiveData(phone, 'phone');
      
      expect(masked).toBe('********4567');
    });

    it('should correctly mask street addresses', () => {
      const street = '123 Main Street';
      const masked = SensitiveDataUtils.maskSensitiveData(street, 'street');
      
      expect(masked).toBe('123 *********');
    });

    it('should correctly mask postal codes', () => {
      const postalCode = '12345';
      const masked = SensitiveDataUtils.maskSensitiveData(postalCode, 'postalCode');
      
      expect(masked).toBe('1****');
    });

    it('should handle empty values', () => {
      expect(SensitiveDataUtils.maskSensitiveData('', 'email')).toBe('');
      expect(SensitiveDataUtils.maskSensitiveData(null as any, 'phone')).toBeNull();
      expect(SensitiveDataUtils.maskSensitiveData(undefined as any, 'street')).toBeUndefined();
    });
  });
});