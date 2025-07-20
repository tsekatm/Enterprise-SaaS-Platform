import { IEntity } from '../interfaces/IEntity';
import { Address } from './Address';
import { AccountStatus, AccountType } from './enums/AccountEnums';

/**
 * Interface representing a customer account
 */
export interface Account extends IEntity {
  name: string;
  industry: string;
  type: AccountType;
  website?: string;
  phone?: string;
  email?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  description?: string;
  annualRevenue?: number;
  employeeCount?: number;
  status: AccountStatus;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Validates an Account object
 * @param account The account to validate
 * @returns An array of validation errors, empty if valid
 */
export function validateAccount(account: Account): string[] {
  const errors: string[] = [];

  // Required fields
  if (!account.name || account.name.trim() === '') {
    errors.push('Account name is required');
  }

  if (!account.industry || account.industry.trim() === '') {
    errors.push('Industry is required');
  }

  if (account.type === undefined) {
    errors.push('Account type is required');
  }

  if (account.status === undefined) {
    errors.push('Account status is required');
  }

  // Email validation if provided
  if (account.email && !isValidEmail(account.email)) {
    errors.push('Invalid email format');
  }

  // Website validation if provided
  if (account.website && !isValidUrl(account.website)) {
    errors.push('Invalid website URL format');
  }

  // Phone validation if provided
  if (account.phone && !isValidPhone(account.phone)) {
    errors.push('Invalid phone number format');
  }

  // Address validation if provided
  if (account.billingAddress) {
    const billingAddressErrors = validateAddress(account.billingAddress, 'billing');
    errors.push(...billingAddressErrors);
  }

  if (account.shippingAddress) {
    const shippingAddressErrors = validateAddress(account.shippingAddress, 'shipping');
    errors.push(...shippingAddressErrors);
  }

  return errors;
}

/**
 * Validates an Address object
 * @param address The address to validate
 * @param prefix Optional prefix for error messages
 * @returns An array of validation errors, empty if valid
 */
export function validateAddress(address: Address, prefix: string = ''): string[] {
  const errors: string[] = [];
  const errorPrefix = prefix ? `${prefix} ` : '';

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