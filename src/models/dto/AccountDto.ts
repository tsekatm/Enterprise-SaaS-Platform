import { Address } from '../Address';
import { AccountStatus, AccountType } from '../enums/AccountEnums';
import { RelationshipType } from '../enums/RelationshipEnums';

/**
 * DTO for creating a new account
 */
export class AccountCreateDto {
  /**
   * Account name
   * @example "Acme Corporation"
   */
  name!: string;

  /**
   * Industry sector
   * @example "Technology"
   */
  industry!: string;

  /**
   * Account type
   * @example "CUSTOMER"
   */
  type!: AccountType;

  /**
   * Website URL
   * @example "https://www.acme.com"
   */
  website?: string;

  /**
   * Phone number
   * @example "+12345678901"
   */
  phone?: string;

  /**
   * Email address
   * @example "contact@acme.com"
   */
  email?: string;

  /**
   * Billing address
   */
  billingAddress?: Address;

  /**
   * Shipping address
   */
  shippingAddress?: Address;

  /**
   * Account description
   * @example "Global technology provider specializing in cloud solutions"
   */
  description?: string;

  /**
   * Annual revenue in USD
   * @example 1000000
   */
  annualRevenue?: number;

  /**
   * Number of employees
   * @example 500
   */
  employeeCount?: number;

  /**
   * Account status
   * @example "ACTIVE"
   */
  status!: AccountStatus;

  /**
   * Tags for categorization
   * @example ["enterprise", "tech", "cloud"]
   */
  tags?: string[];

  /**
   * Custom fields for extensibility
   * @example { "salesRegion": "EMEA", "priority": "High" }
   */
  customFields?: Record<string, any>;
}

/**
 * DTO for updating an existing account
 */
export class AccountUpdateDto {
  /**
   * Account name
   * @example "Acme Corporation"
   */
  name?: string;

  /**
   * Industry sector
   * @example "Technology"
   */
  industry?: string;

  /**
   * Account type
   * @example "CUSTOMER"
   */
  type?: AccountType;

  /**
   * Website URL
   * @example "https://www.acme.com"
   */
  website?: string;

  /**
   * Phone number
   * @example "+12345678901"
   */
  phone?: string;

  /**
   * Email address
   * @example "contact@acme.com"
   */
  email?: string;

  /**
   * Billing address
   */
  billingAddress?: Address;

  /**
   * Shipping address
   */
  shippingAddress?: Address;

  /**
   * Account description
   * @example "Global technology provider specializing in cloud solutions"
   */
  description?: string;

  /**
   * Annual revenue in USD
   * @example 1000000
   */
  annualRevenue?: number;

  /**
   * Number of employees
   * @example 500
   */
  employeeCount?: number;

  /**
   * Account status
   * @example "ACTIVE"
   */
  status?: AccountStatus;

  /**
   * Tags for categorization
   * @example ["enterprise", "tech", "cloud"]
   */
  tags?: string[];

  /**
   * Custom fields for extensibility
   * @example { "salesRegion": "EMEA", "priority": "High" }
   */
  customFields?: Record<string, any>;
}

/**
 * DTO for relationship management
 */
export class RelationshipUpdateDto {
  /**
   * Relationships to add
   */
  addRelationships!: {
    /**
     * Target account ID
     */
    targetAccountId: string;
    
    /**
     * Relationship type
     */
    relationshipType: RelationshipType;
    
    /**
     * Whether the target account is a parent (true) or child (false)
     */
    isParent: boolean;
  }[];

  /**
   * Relationship IDs to remove
   */
  removeRelationships!: string[];
}

/**
 * Validates an AccountCreateDto
 * @param dto The DTO to validate
 * @returns An array of validation errors, empty if valid
 */
export function validateAccountCreateDto(dto: AccountCreateDto): string[] {
  const errors: string[] = [];

  // Required fields
  if (!dto.name || dto.name.trim() === '') {
    errors.push('Account name is required');
  }

  if (!dto.industry || dto.industry.trim() === '') {
    errors.push('Industry is required');
  }

  if (dto.type === undefined) {
    errors.push('Account type is required');
  }

  if (dto.status === undefined) {
    errors.push('Account status is required');
  }

  // Email validation if provided
  if (dto.email && !isValidEmail(dto.email)) {
    errors.push('Invalid email format');
  }

  // Website validation if provided
  if (dto.website && !isValidUrl(dto.website)) {
    errors.push('Invalid website URL format');
  }

  // Phone validation if provided
  if (dto.phone && !isValidPhone(dto.phone)) {
    errors.push('Invalid phone number format');
  }

  // Address validation if provided
  if (dto.billingAddress) {
    const billingAddressErrors = validateDtoAddress(dto.billingAddress, 'billing');
    errors.push(...billingAddressErrors);
  }

  if (dto.shippingAddress) {
    const shippingAddressErrors = validateDtoAddress(dto.shippingAddress, 'shipping');
    errors.push(...shippingAddressErrors);
  }

  return errors;
}

/**
 * Validates an AccountUpdateDto
 * @param dto The DTO to validate
 * @returns An array of validation errors, empty if valid
 */
export function validateAccountUpdateDto(dto: AccountUpdateDto): string[] {
  const errors: string[] = [];

  // At least one field must be provided
  if (Object.keys(dto).length === 0) {
    errors.push('At least one field must be provided for update');
    return errors;
  }

  // Email validation if provided
  if (dto.email && !isValidEmail(dto.email)) {
    errors.push('Invalid email format');
  }

  // Website validation if provided
  if (dto.website && !isValidUrl(dto.website)) {
    errors.push('Invalid website URL format');
  }

  // Phone validation if provided
  if (dto.phone && !isValidPhone(dto.phone)) {
    errors.push('Invalid phone number format');
  }

  // Address validation if provided
  if (dto.billingAddress) {
    const billingAddressErrors = validateDtoAddress(dto.billingAddress, 'billing');
    errors.push(...billingAddressErrors);
  }

  if (dto.shippingAddress) {
    const shippingAddressErrors = validateDtoAddress(dto.shippingAddress, 'shipping');
    errors.push(...shippingAddressErrors);
  }

  return errors;
}

/**
 * Validates a RelationshipUpdateDto
 * @param dto The DTO to validate
 * @returns An array of validation errors, empty if valid
 */
export function validateRelationshipUpdateDto(dto: RelationshipUpdateDto): string[] {
  const errors: string[] = [];

  // Check if at least one operation is provided
  if ((!dto.addRelationships || dto.addRelationships.length === 0) && 
      (!dto.removeRelationships || dto.removeRelationships.length === 0)) {
    errors.push('At least one relationship operation (add or remove) must be provided');
    return errors;
  }

  // Validate add relationships
  if (dto.addRelationships) {
    dto.addRelationships.forEach((rel, index) => {
      if (!rel.targetAccountId || rel.targetAccountId.trim() === '') {
        errors.push(`Target account ID is required for relationship at index ${index}`);
      }
      
      if (rel.relationshipType === undefined) {
        errors.push(`Relationship type is required for relationship at index ${index}`);
      }
    });
  }

  // Validate remove relationships
  if (dto.removeRelationships) {
    dto.removeRelationships.forEach((relId, index) => {
      if (!relId || relId.trim() === '') {
        errors.push(`Relationship ID is required for removal at index ${index}`);
      }
    });
  }

  return errors;
}

/**
 * Validates an Address object in a DTO
 * @param address The address to validate
 * @param prefix Optional prefix for error messages
 * @returns An array of validation errors, empty if valid
 */
function validateDtoAddress(address: Address, prefix: string = ''): string[] {
  const errors: string[] = [];
  const errorPrefix = prefix ? `${prefix} ` : '';

  // All fields are required if address is provided
  if (!address.street || address.street.trim() === '') {
    errors.push(`${errorPrefix}Street is required`);
  }

  if (!address.city || address.city.trim() === '') {
    errors.push(`${errorPrefix}City is required`);
  }

  if (!address.state || address.state.trim() === '') {
    errors.push(`${errorPrefix}State is required`);
  }

  if (!address.postalCode || address.postalCode.trim() === '') {
    errors.push(`${errorPrefix}Postal code is required`);
  }

  if (!address.country || address.country.trim() === '') {
    errors.push(`${errorPrefix}Country is required`);
  }

  return errors;
}

/**
 * Validates an email address
 * @param email The email to validate
 * @returns True if valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL
 * @param url The URL to validate
 * @returns True if valid, false otherwise
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a phone number
 * @param phone The phone number to validate
 * @returns True if valid, false otherwise
 */
function isValidPhone(phone: string): boolean {
  // Simple validation for demonstration purposes
  // In a real application, you might want to use a more sophisticated validation
  // or a library like libphonenumber-js
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
}