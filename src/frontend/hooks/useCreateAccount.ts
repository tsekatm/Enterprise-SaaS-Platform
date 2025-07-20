import { useState } from 'react';
import { AccountCreateDto } from '../../models/dto/AccountDto';

/**
 * Hook for creating a new account
 */
export const useCreateAccount = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<boolean>(false);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  /**
   * Create a new account
   * @param accountData Account creation data
   * @returns Created account ID if successful
   */
  const createAccount = async (accountData: AccountCreateDto): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    setSuccess(false);
    setCreatedAccountId(null);
    
    try {
      // Make API request
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      
      // Handle validation errors
      if (response.status === 400) {
        const errorData = await response.json();
        
        // Format validation errors
        if (errorData.code === 'VALIDATION_ERROR' && errorData.details) {
          const errors: Record<string, string> = {};
          
          errorData.details.forEach((detail: { field: string; error: string }) => {
            errors[detail.field] = detail.error;
          });
          
          setValidationErrors(errors);
          setError(new Error(errorData.message));
          return null;
        }
        
        setError(new Error(errorData.message || 'Validation failed'));
        return null;
      }
      
      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json();
        setError(new Error(errorData.message || 'Failed to create account'));
        return null;
      }
      
      // Handle success
      const data = await response.json();
      setSuccess(true);
      setCreatedAccountId(data.id);
      return data.id;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset the form state
   */
  const resetForm = () => {
    setError(null);
    setValidationErrors({});
    setSuccess(false);
    setCreatedAccountId(null);
  };

  return {
    createAccount,
    loading,
    error,
    validationErrors,
    success,
    createdAccountId,
    resetForm
  };
};