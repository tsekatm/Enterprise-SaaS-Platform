/**
 * Utility class for managing sensitive data fields
 * Provides constants and helper methods for identifying and handling sensitive data
 */
export class SensitiveDataUtils {
  /**
   * List of fields that are considered sensitive and should be encrypted
   * This list should be maintained according to GDPR and SOC2 requirements
   */
  static readonly SENSITIVE_ACCOUNT_FIELDS = [
    'email',           // Personal email addresses
    'phone',           // Phone numbers
    'customFields',    // May contain sensitive information
    'billingAddress',  // Physical addresses are PII
    'shippingAddress', // Physical addresses are PII
  ];

  /**
   * List of fields that are considered sensitive in Address objects
   */
  static readonly SENSITIVE_ADDRESS_FIELDS = [
    'street',
    'postalCode'
  ];

  /**
   * Determines if a field is sensitive and should be encrypted
   * @param fieldName - The name of the field to check
   * @returns True if the field is sensitive, false otherwise
   */
  static isSensitiveField(fieldName: string): boolean {
    return this.SENSITIVE_ACCOUNT_FIELDS.includes(fieldName) ||
           this.SENSITIVE_ADDRESS_FIELDS.includes(fieldName);
  }

  /**
   * Masks sensitive data for display or logging purposes
   * @param value - The value to mask
   * @param fieldName - The name of the field (used to determine masking strategy)
   * @returns The masked value
   */
  static maskSensitiveData(value: string, fieldName: string): string {
    if (!value) return value;

    switch (fieldName) {
      case 'email':
        // Mask email: show first character, then asterisks, then domain
        const [localPart, domain] = value.split('@');
        if (!domain) return value; // Not a valid email
        return `${localPart.charAt(0)}${'*'.repeat(6)}@${domain}`;
      
      case 'phone':
        // Mask phone: show only last 4 digits
        return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
      
      case 'street':
        // Mask street: show house number but mask street name
        const parts = value.split(' ');
        if (parts.length <= 1) return '*'.repeat(value.length);
        return `${parts[0]} ${'*'.repeat(9)}`;
      
      case 'postalCode':
        // Mask postal code: show first character only
        return `${value.charAt(0)}${'*'.repeat(value.length - 1)}`;
      
      default:
        // Default masking: replace with asterisks
        return '*'.repeat(value.length);
    }
  }
}