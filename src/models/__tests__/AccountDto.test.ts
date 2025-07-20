import { describe, it, expect } from 'vitest';
import { 
  AccountCreateDto, 
  AccountUpdateDto, 
  RelationshipUpdateDto,
  validateAccountCreateDto,
  validateAccountUpdateDto,
  validateRelationshipUpdateDto
} from '../dto/AccountDto';
import { AccountStatus, AccountType } from '../enums/AccountEnums';
import { RelationshipType } from '../enums/RelationshipEnums';

describe('Account DTOs', () => {
  describe('AccountCreateDto validation', () => {
    it('should return no errors for a valid create DTO', () => {
      const validDto: AccountCreateDto = {
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      };

      const errors = validateAccountCreateDto(validDto);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidDto = {} as AccountCreateDto;

      const errors = validateAccountCreateDto(invalidDto);
      expect(errors).toContain('Account name is required');
      expect(errors).toContain('Industry is required');
      expect(errors).toContain('Account type is required');
      expect(errors).toContain('Account status is required');
    });

    it('should validate email format if provided', () => {
      const dtoWithInvalidEmail: AccountCreateDto = {
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        email: 'invalid-email'
      };

      const errors = validateAccountCreateDto(dtoWithInvalidEmail);
      expect(errors).toContain('Invalid email format');

      const dtoWithValidEmail = {
        ...dtoWithInvalidEmail,
        email: 'valid@example.com'
      };

      const validErrors = validateAccountCreateDto(dtoWithValidEmail);
      expect(validErrors).toHaveLength(0);
    });

    it('should validate website URL format if provided', () => {
      const dtoWithInvalidWebsite: AccountCreateDto = {
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        website: 'invalid-url'
      };

      const errors = validateAccountCreateDto(dtoWithInvalidWebsite);
      expect(errors).toContain('Invalid website URL format');

      const dtoWithValidWebsite = {
        ...dtoWithInvalidWebsite,
        website: 'https://example.com'
      };

      const validErrors = validateAccountCreateDto(dtoWithValidWebsite);
      expect(validErrors).toHaveLength(0);
    });

    it('should validate billing address if provided', () => {
      const dtoWithInvalidAddress: AccountCreateDto = {
        name: 'Acme Corp',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        billingAddress: {
          street: '',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        }
      };

      const errors = validateAccountCreateDto(dtoWithInvalidAddress);
      expect(errors).toContain('billing Street is required');
    });
  });

  describe('AccountUpdateDto validation', () => {
    it('should return no errors for a valid update DTO', () => {
      const validDto: AccountUpdateDto = {
        name: 'Updated Acme Corp',
        industry: 'Software'
      };

      const errors = validateAccountUpdateDto(validDto);
      expect(errors).toHaveLength(0);
    });

    it('should return error when no fields are provided', () => {
      const emptyDto = {} as AccountUpdateDto;

      const errors = validateAccountUpdateDto(emptyDto);
      expect(errors).toContain('At least one field must be provided for update');
    });

    it('should validate email format if provided', () => {
      const dtoWithInvalidEmail: AccountUpdateDto = {
        email: 'invalid-email'
      };

      const errors = validateAccountUpdateDto(dtoWithInvalidEmail);
      expect(errors).toContain('Invalid email format');

      const dtoWithValidEmail: AccountUpdateDto = {
        email: 'valid@example.com'
      };

      const validErrors = validateAccountUpdateDto(dtoWithValidEmail);
      expect(validErrors).toHaveLength(0);
    });

    it('should validate shipping address if provided', () => {
      const dtoWithInvalidAddress: AccountUpdateDto = {
        shippingAddress: {
          street: '123 Main St',
          city: '',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        }
      };

      const errors = validateAccountUpdateDto(dtoWithInvalidAddress);
      expect(errors).toContain('shipping City is required');
    });
  });

  describe('RelationshipUpdateDto validation', () => {
    it('should return no errors for a valid relationship update DTO with additions', () => {
      const validDto: RelationshipUpdateDto = {
        addRelationships: [
          {
            targetAccountId: 'account1',
            relationshipType: RelationshipType.PARENT_CHILD,
            isParent: true
          }
        ],
        removeRelationships: []
      };

      const errors = validateRelationshipUpdateDto(validDto);
      expect(errors).toHaveLength(0);
    });

    it('should return no errors for a valid relationship update DTO with removals', () => {
      const validDto: RelationshipUpdateDto = {
        addRelationships: [],
        removeRelationships: ['relationship1']
      };

      const errors = validateRelationshipUpdateDto(validDto);
      expect(errors).toHaveLength(0);
    });

    it('should return error when no operations are provided', () => {
      const emptyDto: RelationshipUpdateDto = {
        addRelationships: [],
        removeRelationships: []
      };

      const errors = validateRelationshipUpdateDto(emptyDto);
      expect(errors).toContain('At least one relationship operation (add or remove) must be provided');
    });

    it('should validate add relationships', () => {
      const dtoWithInvalidAdd: RelationshipUpdateDto = {
        addRelationships: [
          {
            targetAccountId: '',
            relationshipType: RelationshipType.PARENT_CHILD,
            isParent: true
          }
        ],
        removeRelationships: []
      };

      const errors = validateRelationshipUpdateDto(dtoWithInvalidAdd);
      expect(errors).toContain('Target account ID is required for relationship at index 0');
    });

    it('should validate remove relationships', () => {
      const dtoWithInvalidRemove: RelationshipUpdateDto = {
        addRelationships: [],
        removeRelationships: ['', 'relationship2']
      };

      const errors = validateRelationshipUpdateDto(dtoWithInvalidRemove);
      expect(errors).toContain('Relationship ID is required for removal at index 0');
    });
  });
});