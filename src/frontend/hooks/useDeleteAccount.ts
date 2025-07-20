import { useState, useCallback } from 'react';

/**
 * Hook for handling account deletion
 */
export const useDeleteAccount = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [hasDependencies, setHasDependencies] = useState<boolean>(false);

  /**
   * Check if account has dependencies that would prevent deletion
   * @param accountId Account ID to check
   */
  const checkDependencies = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);
    setDependencies([]);
    setHasDependencies(false);
    
    try {
      const response = await fetch(`/api/accounts/${accountId}/dependencies`);
      
      if (!response.ok) {
        throw new Error(`Failed to check dependencies: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDependencies(data.dependencies || []);
      setHasDependencies(data.dependencies && data.dependencies.length > 0);
      return data.dependencies && data.dependencies.length > 0;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an account
   * @param accountId Account ID to delete
   * @param force Whether to force deletion even with dependencies
   */
  const deleteAccount = useCallback(async (accountId: string, force: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // If force is false, check dependencies first
      if (!force) {
        const hasDeps = await checkDependencies(accountId);
        if (hasDeps) {
          setLoading(false);
          return { success: false, message: 'Account has dependencies' };
        }
      }
      
      // Proceed with deletion
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ force })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete account: ${response.statusText}`);
      }
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return { success: false, message: err instanceof Error ? err.message : 'An unknown error occurred' };
    } finally {
      setLoading(false);
    }
  }, [checkDependencies]);

  return {
    loading,
    error,
    dependencies,
    hasDependencies,
    checkDependencies,
    deleteAccount
  };
};