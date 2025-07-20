import React, { memo } from 'react';
import { AccountListItem } from '../../types/account';

interface AccountTableRowProps {
  account: AccountListItem;
}

/**
 * Memoized Account Table Row Component
 * 
 * This component renders a single row in the account table.
 * It's memoized to prevent unnecessary re-renders when other rows change.
 */
export const AccountTableRow: React.FC<AccountTableRowProps> = memo(({ account }) => {
  // Memoize the date formatting to avoid recalculating on every render
  const formattedCreatedDate = React.useMemo(() => 
    new Date(account.createdAt).toLocaleDateString(), 
    [account.createdAt]
  );
  
  const formattedUpdatedDate = React.useMemo(() => 
    new Date(account.updatedAt).toLocaleDateString(), 
    [account.updatedAt]
  );
  
  // Handle navigation to view/edit pages
  const handleViewClick = React.useCallback(() => {
    window.location.href = `/accounts/${account.id}`;
  }, [account.id]);
  
  const handleEditClick = React.useCallback(() => {
    window.location.href = `/accounts/${account.id}/edit`;
  }, [account.id]);
  
  return (
    <tr>
      <td>{account.name}</td>
      <td>{account.industry}</td>
      <td>{account.type}</td>
      <td>
        <span className={`status-badge status-${account.status.toLowerCase()}`}>
          {account.status}
        </span>
      </td>
      <td>{formattedCreatedDate}</td>
      <td>{formattedUpdatedDate}</td>
      <td className="actions-cell">
        <button 
          className="btn-view" 
          onClick={handleViewClick}
        >
          View
        </button>
        <button 
          className="btn-edit"
          onClick={handleEditClick}
        >
          Edit
        </button>
      </td>
    </tr>
  );
});

// Display name for debugging
AccountTableRow.displayName = 'AccountTableRow';