import { Account } from '../models/Account';
import { IEncryptionService } from '../interfaces/IEncryptionService';
import { SensitiveDataUtils } from './SensitiveDataUtils';

/**
 * Utility class for encrypting and decrypting Account data
 */
export class AccountEncryptionUtils {
  /**
   * Encrypts sensitive fields in an Account object
   * @param account - The account object to encrypt
   * @param encryptionService - The encryption service to use
   * @returns A new Account object with encrypted sensitive fields
   */
  static async encryptAccount(
    account: Account,
    encryptionService: IEncryptionService
  ): Promise<Account> {
    if (!account) return account;

    const result = { ...account };
    
    // Encrypt direct sensitive fields
    if (account.email) {
      result.email = await encryptionService.encrypt(account.email);
    }
    
    if (account.phone) {
      result.phone = await encryptionService.encrypt(account.phone);
    }
    
    // Encrypt address fields
    if (account.billingAddress) {
      const addressCopy = { ...account.billingAddress };
      
      if (addressCopy.street) {
        addressCopy.street = await encryptionService.encrypt(addressCopy.street);
      }
      
      if (addressCopy.postalCode) {
        addressCopy.postalCode = await encryptionService.encrypt(addressCopy.postalCode);
      }
      
      result.billingAddress = addressCopy;
    }
    
    if (account.shippingAddress) {
      const addressCopy = { ...account.shippingAddress };
      
      if (addressCopy.street) {
        addressCopy.street = await encryptionService.encrypt(addressCopy.street);
      }
      
      if (addressCopy.postalCode) {
        addressCopy.postalCode = await encryptionService.encrypt(addressCopy.postalCode);
      }
      
      result.shippingAddress = addressCopy;
    }
    
    // Encrypt custom fields if they contain sensitive data
    if (account.customFields) {
      // For custom fields, we encrypt the entire object as we don't know which fields might be sensitive
      const encryptedJson = await encryptionService.encrypt(JSON.stringify(account.customFields));
      result.customFields = { _encrypted: encryptedJson };
    }
    
    return result;
  }

  /**
   * Decrypts sensitive fields in an Account object
   * @param account - The account object with encrypted fields
   * @param encryptionService - The encryption service to use
   * @returns A new Account object with decrypted sensitive fields
   */
  static async decryptAccount(
    account: Account,
    encryptionService: IEncryptionService
  ): Promise<Account> {
    if (!account) return account;

    const result = { ...account };
    
    // Decrypt direct sensitive fields
    if (account.email) {
      try {
        result.email = await encryptionService.decrypt(account.email);
      } catch (error) {
        console.error('Failed to decrypt email:', error);
        // Keep the encrypted value if decryption fails
      }
    }
    
    if (account.phone) {
      try {
        result.phone = await encryptionService.decrypt(account.phone);
      } catch (error) {
        console.error('Failed to decrypt phone:', error);
        // Keep the encrypted value if decryption fails
      }
    }
    
    // Decrypt address fields
    if (account.billingAddress) {
      const addressCopy = { ...account.billingAddress };
      
      if (addressCopy.street) {
        try {
          addressCopy.street = await encryptionService.decrypt(addressCopy.street);
        } catch (error) {
          console.error('Failed to decrypt billing address street:', error);
          // Keep the encrypted value if decryption fails
        }
      }
      
      if (addressCopy.postalCode) {
        try {
          addressCopy.postalCode = await encryptionService.decrypt(addressCopy.postalCode);
        } catch (error) {
          console.error('Failed to decrypt billing address postal code:', error);
          // Keep the encrypted value if decryption fails
        }
      }
      
      result.billingAddress = addressCopy;
    }
    
    if (account.shippingAddress) {
      const addressCopy = { ...account.shippingAddress };
      
      if (addressCopy.street) {
        try {
          addressCopy.street = await encryptionService.decrypt(addressCopy.street);
        } catch (error) {
          console.error('Failed to decrypt shipping address street:', error);
          // Keep the encrypted value if decryption fails
        }
      }
      
      if (addressCopy.postalCode) {
        try {
          addressCopy.postalCode = await encryptionService.decrypt(addressCopy.postalCode);
        } catch (error) {
          console.error('Failed to decrypt shipping address postal code:', error);
          // Keep the encrypted value if decryption fails
        }
      }
      
      result.shippingAddress = addressCopy;
    }
    
    // Decrypt custom fields
    if (account.customFields && account.customFields._encrypted) {
      try {
        const decryptedJson = await encryptionService.decrypt(account.customFields._encrypted);
        result.customFields = JSON.parse(decryptedJson);
      } catch (error) {
        console.error('Failed to decrypt custom fields:', error);
        // Keep the encrypted value if decryption fails
      }
    }
    
    return result;
  }

  /**
   * Masks sensitive fields in an Account object for display or logging
   * @param account - The account object to mask
   * @returns A new Account object with masked sensitive fields
   */
  static maskSensitiveAccountData(account: Account): Account {
    if (!account) return account;

    const result = { ...account };
    
    // Mask direct sensitive fields
    if (account.email) {
      result.email = SensitiveDataUtils.maskSensitiveData(account.email, 'email');
    }
    
    if (account.phone) {
      result.phone = SensitiveDataUtils.maskSensitiveData(account.phone, 'phone');
    }
    
    // Mask address fields
    if (account.billingAddress) {
      const addressCopy = { ...account.billingAddress };
      
      if (addressCopy.street) {
        addressCopy.street = SensitiveDataUtils.maskSensitiveData(addressCopy.street, 'street');
      }
      
      if (addressCopy.postalCode) {
        addressCopy.postalCode = SensitiveDataUtils.maskSensitiveData(addressCopy.postalCode, 'postalCode');
      }
      
      result.billingAddress = addressCopy;
    }
    
    if (account.shippingAddress) {
      const addressCopy = { ...account.shippingAddress };
      
      if (addressCopy.street) {
        addressCopy.street = SensitiveDataUtils.maskSensitiveData(addressCopy.street, 'street');
      }
      
      if (addressCopy.postalCode) {
        addressCopy.postalCode = SensitiveDataUtils.maskSensitiveData(addressCopy.postalCode, 'postalCode');
      }
      
      result.shippingAddress = addressCopy;
    }
    
    // For custom fields, we just indicate that they contain sensitive data
    if (account.customFields) {
      result.customFields = { _masked: 'Contains sensitive data' };
    }
    
    return result;
  }
}