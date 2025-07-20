import { IEncryptionService } from '../interfaces/IEncryptionService';
import * as crypto from 'crypto';

/**
 * Implementation of the encryption service using Node.js crypto module
 * Provides AES-256-GCM encryption for sensitive data
 */
export class EncryptionService implements IEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly encryptionKey: Buffer;

  /**
   * Creates a new instance of EncryptionService
   * @param encryptionKey - The encryption key to use (must be 32 bytes for AES-256)
   *                       If not provided, will use the ENCRYPTION_KEY environment variable
   */
  constructor(encryptionKey?: string) {
    // In production, the key should be stored securely (e.g., AWS KMS, Azure Key Vault)
    // For this implementation, we'll use an environment variable or provided key
    const key = encryptionKey || process.env.ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error('Encryption key is required. Set ENCRYPTION_KEY environment variable or provide it to the constructor.');
    }
    
    // Derive a key of the correct length using PBKDF2
    this.encryptionKey = crypto.pbkdf2Sync(
      key,
      'salt', // In production, use a proper salt strategy
      10000,  // Number of iterations
      this.keyLength,
      'sha256'
    );
  }

  /**
   * Encrypts sensitive data
   * @param data - The data to encrypt
   * @returns The encrypted data as a string in format: iv:authTag:encryptedData (base64 encoded)
   */
  async encrypt(data: string): Promise<string> {
    if (!data) {
      return data;
    }

    // Generate a random initialization vector
    const iv = crypto.randomBytes(this.ivLength);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return the IV, auth tag, and encrypted data as a single string
    // Format: iv:authTag:encryptedData (all base64 encoded)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypts encrypted data
   * @param encryptedData - The encrypted data to decrypt in format: iv:authTag:encryptedData
   * @returns The decrypted data as a string
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!encryptedData) {
      return encryptedData;
    }

    // Split the encrypted data into its components
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encryptedText = parts[2];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypts an object with sensitive fields
   * @param obj - The object containing sensitive data
   * @param sensitiveFields - Array of field names to encrypt
   * @returns A new object with encrypted sensitive fields
   */
  async encryptObject<T extends Record<string, any>>(
    obj: T, 
    sensitiveFields: string[]
  ): Promise<T> {
    if (!obj) {
      return obj;
    }

    const result = { ...obj };
    
    for (const field of sensitiveFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        result[field] = await this.encrypt(obj[field]);
      }
    }
    
    return result;
  }

  /**
   * Decrypts an object with encrypted fields
   * @param obj - The object containing encrypted data
   * @param encryptedFields - Array of field names to decrypt
   * @returns A new object with decrypted fields
   */
  async decryptObject<T extends Record<string, any>>(
    obj: T, 
    encryptedFields: string[]
  ): Promise<T> {
    if (!obj) {
      return obj;
    }

    const result = { ...obj };
    
    for (const field of encryptedFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        try {
          result[field] = await this.decrypt(obj[field]);
        } catch (error) {
          // If decryption fails, keep the original value
          console.error(`Failed to decrypt field ${field}:`, error);
        }
      }
    }
    
    return result;
  }
}