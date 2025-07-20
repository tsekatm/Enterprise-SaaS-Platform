import { useState, useCallback } from 'react';
import { AccountUpdateDto } from '../../models/dto/AccountDto';
import { Account } from '../../models/Account';

/**
 * Hook for updating an existing account
 */
export const useUpdateAccount = (accountId: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<boolean>(false);
  const [updatedAccount, setUpdatedAccount] = useState<Account | null>(null);

  /**
   * Update an existing account
   * @param accountData Account update data
   */
  const updateAccount = useCallback(async (accountData: AccountUpdateDto) => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    setSuccess(false);
    setUpdatedAccount(null);
    
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && data.code === 'VALIDATION_ERROR' && data.details) {
          const errors: Record<string, string> = {};
          data.details.forEach((detail: { field: string; error: string }) => {
            errors[detail.field] = detail.error;
          });
          setValidationErrors(errors);
          throw new Error(data.message || 'Validation failed');
        }
        
        // Handle other errors
        throw new Error(data.message || 'Failed to update account');
      }
      
      setUpdatedAccount(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  /**
   * Reset the form state
   */
  const resetForm = useCallback(() => {
    setError(null);
    setValidationErrors({});
    setSuccess(false);
    setUpdatedAccount(null);
  }, []);

  return {
    updateAccount,
    loading,
    error,
    validationErrors,
    success,
    updatedAccount,
    resetForm
  };
};