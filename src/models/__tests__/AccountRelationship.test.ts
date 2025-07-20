import { describe, it, expect } from 'vitest';
import { 
  AccountRelationship, 
  AccountRelationships, 
  validateAccountRelationship,
  wouldCreateCircularReference
} from '../AccountRelationship';
import { RelationshipType } from '../enums/RelationshipEnums';

describe('AccountRelationship Model', () => {
  describe('validateAccountRelationship', () => {
    it('should return no errors for a valid relationship', () => {
      const validRelationship: AccountRelationship = {
        id: '1',
        parentAccountId: 'parent1',
        childAccountId: 'child1',
        relationshipType: RelationshipType.PARENT_CHILD,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccountRelationship(validRelationship);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidRelationship = {
        id: '1',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      } as AccountRelationship;

      const errors = validateAccountRelationship(invalidRelationship);
      expect(errors).toContain('Parent account ID is required');
      expect(errors).toContain('Child account ID is required');
      expect(errors).toContain('Relationship type is required');
    });

    it('should return error when parent and child IDs are the same', () => {
      const invalidRelationship: AccountRelationship = {
        id: '1',
        parentAccountId: 'account1',
        childAccountId: 'account1',
        relationshipType: RelationshipType.PARENT_CHILD,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      const errors = validateAccountRelationship(invalidRelationship);
      expect(errors).toContain('Parent and child account IDs cannot be the same');
    });
  });

  describe('wouldCreateCircularReference', () => {
    it('should detect direct circular references', () => {
      const relationships: AccountRelationships = {
        parentRelationships: [
          {
            id: '1',
            parentAccountId: 'account2',
            childAccountId: 'account1',
            relationshipType: RelationshipType.PARENT_CHILD,
            createdBy: 'user1',
            createdAt: new Date(),
            updatedBy: 'user1',
            updatedAt: new Date()
          }
        ],
        childRelationships: []
      };

      const wouldCreateCircle = wouldCreateCircularReference(
        relationships,
        'account1',
        'account2'
      );

      expect(wouldCreateCircle).toBe(true);
    });

    it('should detect indirect circular references', () => {
      const relationships: AccountRelationships = {
        parentRelationships: [
          {
            id: '1',
            parentAccountId: 'account2',
            childAccountId: 'account1',
            relationshipType: RelationshipType.PARENT_CHILD,
            createdBy: 'user1',
            createdAt: new Date(),
            updatedBy: 'user1',
            updatedAt: new Date()
          },
          {
            id: '2',
            parentAccountId: 'account3',
            childAccountId: 'account2',
            relationshipType: RelationshipType.PARENT_CHILD,
            createdBy: 'user1',
            createdAt: new Date(),
            updatedBy: 'user1',
            updatedAt: new Date()
          }
        ],
        childRelationships: []
      };

      const wouldCreateCircle = wouldCreateCircularReference(
        relationships,
        'account1',
        'account3'
      );

      expect(wouldCreateCircle).toBe(true);
    });

    it('should return false when no circular reference would be created', () => {
      const relationships: AccountRelationships = {
        parentRelationships: [
          {
            id: '1',
            parentAccountId: 'account2',
            childAccountId: 'account1',
            relationshipType: RelationshipType.PARENT_CHILD,
            createdBy: 'user1',
            createdAt: new Date(),
            updatedBy: 'user1',
            updatedAt: new Date()
          }
        ],
        childRelationships: []
      };

      const wouldCreateCircle = wouldCreateCircularReference(
        relationships,
        'account2',
        'account3'
      );

      expect(wouldCreateCircle).toBe(false);
    });
  });
});