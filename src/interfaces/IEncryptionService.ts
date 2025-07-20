/**
 * Interface for encryption and decryption operations
 * Provides methods to encrypt and decrypt sensitive data
 * in compliance with GDPR and SOC2 requirements
 */
export interface IEncryptionService {
  /**
   * Encrypts sensitive data
   * @param data - The data to encrypt
   * @returns The encrypted data as a string
   */
  encrypt(data: string): Promise<string>;

  /**
   * Decrypts encrypted data
   * @param encryptedData - The encrypted data to decrypt
   * @returns The decrypted data as a string
   */
  decrypt(encryptedData: string): Promise<string>;

  /**
   * Encrypts an object with sensitive fields
   * @param obj - The object containing sensitive data
   * @param sensitiveFields - Array of field names to encrypt
   * @returns A new object with encrypted sensitive fields
   */
  encryptObject<T extends Record<string, any>>(
    obj: T, 
    sensitiveFields: string[]
  ): Promise<T>;

  /**
   * Decrypts an object with encrypted fields
   * @param obj - The object containing encrypted data
   * @param encryptedFields - Array of field names to decrypt
   * @returns A new object with decrypted fields
   */
  decryptObject<T extends Record<string, any>>(
    obj: T, 
    encryptedFields: string[]
  ): Promise<T>;
}