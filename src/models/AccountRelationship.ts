import { IEntity } from '../interfaces/IEntity';
import { RelationshipType } from './enums/RelationshipEnums';

/**
 * Interface representing a relationship between two accounts
 */
export interface AccountRelationship extends IEntity {
  parentAccountId: string;
  childAccountId: string;
  relationshipType: RelationshipType;
}

/**
 * Interface representing all relationships for an account
 */
export interface AccountRelationships {
  parentRelationships: AccountRelationship[];
  childRelationships: AccountRelationship[];
}

/**
 * Validates an AccountRelationship object
 * @param relationship The relationship to validate
 * @returns An array of validation errors, empty if valid
 */
export function validateAccountRelationship(relationship: AccountRelationship): string[] {
  const errors: string[] = [];

  if (!relationship.parentAccountId || relationship.parentAccountId.trim() === '') {
    errors.push('Parent account ID is required');
  }

  if (!relationship.childAccountId || relationship.childAccountId.trim() === '') {
    errors.push('Child account ID is required');
  }

  if (relationship.relationshipType === undefined) {
    errors.push('Relationship type is required');
  }

  if (relationship.parentAccountId === relationship.childAccountId) {
    errors.push('Parent and child account IDs cannot be the same');
  }

  return errors;
}

/**
 * Checks if adding a relationship would create a circular reference
 * @param relationships All existing relationships
 * @param parentId The parent account ID
 * @param childId The child account ID
 * @returns True if a circular reference would be created, false otherwise
 */
export function wouldCreateCircularReference(
  relationships: AccountRelationships,
  parentId: string,
  childId: string
): boolean {
  // If the proposed child is already a parent (directly or indirectly) of the proposed parent,
  // then adding this relationship would create a circular reference
  
  // Check if the child is already a direct parent of the parent
  const directParentRelationship = relationships.parentRelationships.find(
    rel => rel.parentAccountId === childId && rel.childAccountId === parentId
  );
  
  if (directParentRelationship) {
    return true;
  }
  
  // Check for indirect circular references
  // This is a simplified implementation that only checks one level of indirection
  // A more complete implementation would use a graph traversal algorithm
  
  // Get all parents of the proposed parent
  const parentsOfParent = relationships.parentRelationships.map(rel => rel.parentAccountId);
  
  // Check if the child is already a parent of any of the parent's parents
  for (const grandParentId of parentsOfParent) {
    const isChildParentOfGrandParent = relationships.parentRelationships.some(
      rel => rel.parentAccountId === childId && rel.childAccountId === grandParentId
    );
    
    if (isChildParentOfGrandParent) {
      return true;
    }
  }
  
  return false;
}