import React, { useState, useEffect } from 'react';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';

interface AccountDeleteDialogProps {
  accountId: string;
  accountName: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

/**
 * Account Delete Dialog Component
 * 
 * Displays a confirmation dialog for account deletion with dependency warnings
 */
export const AccountDeleteDialog: React.FC<AccountDeleteDialogProps> = ({
  accountId,
  accountName,
  isOpen,
  onClose,
  onDeleted
}) => {
  const {
    loading,
    error,
    dependencies,
    hasDependencies,
    checkDependencies,
    deleteAccount
  } = useDeleteAccount();

  const [forceDelete, setForceDelete] = useState<boolean>(false);
  const [dependenciesChecked, setDependenciesChecked] = useState<boolean>(false);

  // Check for dependencies when the dialog opens
  useEffect(() => {
    if (isOpen && accountId && !dependenciesChecked) {
      checkDependencies(accountId).then(() => {
        setDependenciesChecked(true);
      });
    }
    
    // Reset state when dialog closes
    if (!isOpen) {
      setForceDelete(false);
      setDependenciesChecked(false);
    }
  }, [isOpen, accountId, checkDependencies, dependenciesChecked]);

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    const result = await deleteAccount(accountId, forceDelete);
    if (result.success) {
      onDeleted();
      onClose();
    }
  };

  // If dialog is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container delete-dialog">
        <div className="modal-header">
          <h2>Delete Account</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading && !dependenciesChecked ? (
            <div className="loading-spinner">Checking dependencies...</div>
          ) : (
            <>
              <p className="delete-warning">
                Are you sure you want to delete the account <strong>{accountName}</strong>?
              </p>
              <p>This action cannot be undone.</p>
              
              {hasDependencies && (
                <div className="dependencies-warning">
                  <h3>Warning: This account has dependencies</h3>
                  <p>Deleting this account may affect the following:</p>
                  <ul className="dependencies-list">
                    {dependencies.map((dep, index) => (
                      <li key={index}>{dep}</li>
                    ))}
                  </ul>
                  
                  <div className="force-delete-option">
                    <label>
                      <input
                        type="checkbox"
                        checked={forceDelete}
                        onChange={(e) => setForceDelete(e.target.checked)}
                      />
                      I understand the risks and want to delete this account anyway
                    </label>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <p>Error: {error.message}</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn-danger" 
            onClick={handleConfirmDelete}
            disabled={loading || (hasDependencies && !forceDelete)}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};