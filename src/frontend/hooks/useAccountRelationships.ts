import { useState, useCallback, useEffect } from 'react';
import { AccountRelationships, AccountRelationship } from '../../models/AccountRelationship';
import { RelationshipType } from '../../models/enums/RelationshipEnums';

interface RelationshipUpdateDto {
  addRelationships: {
    targetAccountId: string;
    relationshipType: RelationshipType;
    isParent: boolean;
  }[];
  removeRelationships: string[]; // relationship IDs to remove
}

interface UseAccountRelationshipsResult {
  relationships: AccountRelationships | null;
  loading: boolean;
  error: Error | null;
  addRelationship: (targetAccountId: string, relationshipType: RelationshipType, isParent: boolean) => Promise<void>;
  removeRelationship: (relationshipId: string) => Promise<void>;
  fetchRelationships: () => Promise<void>;
}

/**
 * Hook for managing account relationships
 */
export const useAccountRelationships = (accountId: string): UseAccountRelationshipsResult => {
  const [relationships, setRelationships] = useState<AccountRelationships | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch account relationships from the API
   */
  const fetchRelationships = useCallback(async () => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/accounts/${accountId}/relationships`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch relationships: ${response.statusText}`);
      }
      
      const relationshipsData: AccountRelationships = await response.json();
      setRelationships(relationshipsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  /**
   * Add a new relationship
   */
  const addRelationship = useCallback(async (
    targetAccountId: string,
    relationshipType: RelationshipType,
    isParent: boolean
  ) => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updateDto: RelationshipUpdateDto = {
        addRelationships: [
          {
            targetAccountId,
            relationshipType,
            isParent
          }
        ],
        removeRelationships: []
      };
      
      const response = await fetch(`/api/accounts/${accountId}/relationships`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateDto)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add relationship: ${response.statusText}`);
      }
      
      // Refresh relationships after update
      await fetchRelationships();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [accountId, fetchRelationships]);

  /**
   * Remove an existing relationship
   */
  const removeRelationship = useCallback(async (relationshipId: string) => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updateDto: RelationshipUpdateDto = {
        addRelationships: [],
        removeRelationships: [relationshipId]
      };
      
      const response = await fetch(`/api/accounts/${accountId}/relationships`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateDto)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to remove relationship: ${response.statusText}`);
      }
      
      // Refresh relationships after update
      await fetchRelationships();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [accountId, fetchRelationships]);

  // Initial fetch
  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  return {
    relationships,
    loading,
    error,
    addRelationship,
    removeRelationship,
    fetchRelationships
  };
};