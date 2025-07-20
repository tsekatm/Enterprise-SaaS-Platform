import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAccountRelationships } from '../../hooks/useAccountRelationships';
import { AccountRelationship, AccountRelationships, wouldCreateCircularReference } from '../../../models/AccountRelationship';
import { RelationshipType } from '../../../models/enums/RelationshipEnums';
import { useAccount } from '../../hooks/useAccount';
import './AccountRelationshipManager.css';

interface AccountRelationshipManagerProps {
  accountId: string;
  onClose?: () => void;
}

interface AccountOption {
  id: string;
  name: string;
}

interface AccountNameCache {
  [key: string]: string;
}

/**
 * Account Relationship Manager Component
 * 
 * Provides an interface for viewing, adding, and removing account relationships
 */
export const AccountRelationshipManager: React.FC<AccountRelationshipManagerProps> = ({ 
  accountId,
  onClose
}) => {
  // Use the relationships hook
  const {
    relationships,
    loading,
    error,
    addRelationship,
    removeRelationship,
    fetchRelationships
  } = useAccountRelationships(accountId);

  // Use the account hook to get current account details
  const { account } = useAccount(accountId);

  // State for the relationship form
  const [availableAccounts, setAvailableAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<RelationshipType>(RelationshipType.PARENT_CHILD);
  const [isParent, setIsParent] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accountsLoading, setAccountsLoading] = useState<boolean>(false);
  const [accountNames, setAccountNames] = useState<AccountNameCache>({});
  const [circularWarning, setCircularWarning] = useState<string | null>(null);

  // Fetch available accounts for relationship creation
  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      setAccountsLoading(true);
      try {
        // Add search term to query if provided
        const queryParams = searchTerm 
          ? `?name=${encodeURIComponent(searchTerm)}`
          : '';
        
        const response = await fetch(`/api/accounts${queryParams}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filter out the current account and any accounts already in a relationship
        const filteredAccounts = data.items.filter((account: any) => {
          // Skip the current account
          if (account.id === accountId) return false;
          
          // Skip accounts already in a relationship if relationships are loaded
          if (relationships) {
            const isParentAccount = relationships.parentRelationships.some(
              rel => rel.parentAccountId === account.id
            );
            
            const isChildAccount = relationships.childRelationships.some(
              rel => rel.childAccountId === account.id
            );
            
            return !isParentAccount && !isChildAccount;
          }
          
          return true;
        });
        
        // Update available accounts for selection
        setAvailableAccounts(filteredAccounts.map((account: any) => ({
          id: account.id,
          name: account.name
        })));
        
        // Update account names cache with all accounts from the response
        const newAccountNames: AccountNameCache = { ...accountNames };
        data.items.forEach((account: any) => {
          newAccountNames[account.id] = account.name;
        });
        setAccountNames(newAccountNames);
      } catch (err) {
        console.error('Error fetching available accounts:', err);
      } finally {
        setAccountsLoading(false);
      }
    };
    
    fetchAvailableAccounts();
  }, [accountId, relationships, searchTerm, accountNames]);

  // Check for potential circular relationships
  useEffect(() => {
    if (!selectedAccountId || !relationships) {
      setCircularWarning(null);
      return;
    }

    // Determine parent and child IDs based on the selected direction
    const parentId = isParent ? selectedAccountId : accountId;
    const childId = isParent ? accountId : selectedAccountId;

    // Check if this would create a circular reference
    if (wouldCreateCircularReference(relationships, parentId, childId)) {
      setCircularWarning('Warning: This relationship would create a circular reference in the account hierarchy.');
    } else {
      setCircularWarning(null);
    }
  }, [selectedAccountId, isParent, relationships, accountId]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId) {
      setFormError('Please select an account');
      return;
    }
    
    // Check for circular relationships before submitting
    if (circularWarning) {
      if (!window.confirm('This relationship may create a circular reference. Are you sure you want to continue?')) {
        return;
      }
    }
    
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      await addRelationship(selectedAccountId, selectedRelationshipType, isParent);
      
      // Reset form
      setSelectedAccountId('');
      setSelectedRelationshipType(RelationshipType.PARENT_CHILD);
      setIsParent(true);
      setCircularWarning(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle relationship removal
  const handleRemoveRelationship = async (relationshipId: string) => {
    if (window.confirm('Are you sure you want to remove this relationship?')) {
      try {
        await removeRelationship(relationshipId);
      } catch (err) {
        console.error('Error removing relationship:', err);
      }
    }
  };

  // Format relationship type for display
  const formatRelationshipType = (type: string): string => {
    return type.replace('_', ' ');
  };

  // Refresh data
  const handleRefresh = () => {
    fetchRelationships();
  };

  return (
    <div className="account-relationship-manager">
      <div className="relationship-manager-header">
        <h1>Manage Account Relationships</h1>
        <div className="header-actions">
          <button 
            className="btn-refresh" 
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
      
      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading relationships...</div>}
      
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>Error: {error.message}</p>
          <button onClick={handleRefresh} className="btn-primary">Retry</button>
        </div>
      )}
      
      {/* Relationship Management Interface */}
      {!loading && !error && relationships && (
        <div className="relationship-management-container">
          {/* Add Relationship Form */}
          <div className="add-relationship-section">
            <h2>Add New Relationship</h2>
            <form onSubmit={handleSubmit} className="relationship-form">
              {formError && (
                <div className="form-error">{formError}</div>
              )}
              
              {circularWarning && (
                <div className="form-warning">{circularWarning}</div>
              )}
              
              <div className="form-group">
                <label htmlFor="relationshipDirection">Relationship Direction:</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="relationshipDirection"
                      checked={isParent}
                      onChange={() => setIsParent(true)}
                    />
                    This account is a child of the selected account
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="relationshipDirection"
                      checked={!isParent}
                      onChange={() => setIsParent(false)}
                    />
                    This account is a parent of the selected account
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="relationshipType">Relationship Type:</label>
                <select
                  id="relationshipType"
                  value={selectedRelationshipType}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRelationshipType(e.target.value as RelationshipType)}
                  className="form-select"
                >
                  {Object.values(RelationshipType).map((type) => (
                    <option key={type} value={type}>
                      {formatRelationshipType(type)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="accountSearch">Search Accounts:</label>
                <input
                  type="text"
                  id="accountSearch"
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  placeholder="Search by account name"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="accountSelect">Select Account:</label>
                <select
                  id="accountSelect"
                  value={selectedAccountId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAccountId(e.target.value)}
                  className="form-select"
                  disabled={accountsLoading || availableAccounts.length === 0}
                >
                  <option value="">-- Select an account --</option>
                  {availableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {accountsLoading && <span className="loading-indicator">Loading accounts...</span>}
                {!accountsLoading && availableAccounts.length === 0 && (
                  <p className="no-accounts-message">
                    No available accounts found. Try a different search term or create new accounts.
                  </p>
                )}
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !selectedAccountId}
                >
                  {isSubmitting ? 'Adding...' : 'Add Relationship'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Current Relationships */}
          <div className="current-relationships-section">
            <h2>Current Relationships</h2>
            
            {/* Parent Relationships */}
            <div className="relationship-group">
              <h3>Parent Accounts</h3>
              {relationships.parentRelationships.length === 0 ? (
                <p className="no-relationships">No parent accounts</p>
              ) : (
                <div className="relationship-cards">
                  {relationships.parentRelationships.map((relationship: AccountRelationship) => (
                    <div key={relationship.id} className="relationship-card">
                      <div className="relationship-info">
                        <div className="relationship-account">
                          <span className="relationship-label">Account:</span>
                          <a 
                            href={`/accounts/${relationship.parentAccountId}`}
                            className="account-link"
                          >
                            {accountNames[relationship.parentAccountId] || relationship.parentAccountId}
                          </a>
                        </div>
                        <div className="relationship-type">
                          <span className="relationship-label">Type:</span>
                          <span className="relationship-value">
                            {formatRelationshipType(relationship.relationshipType)}
                          </span>
                        </div>
                      </div>
                      <div className="relationship-actions">
                        <button
                          className="btn-view"
                          onClick={() => window.location.href = `/accounts/${relationship.parentAccountId}`}
                        >
                          View
                        </button>
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveRelationship(relationship.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Child Relationships */}
            <div className="relationship-group">
              <h3>Child Accounts</h3>
              {relationships.childRelationships.length === 0 ? (
                <p className="no-relationships">No child accounts</p>
              ) : (
                <div className="relationship-cards">
                  {relationships.childRelationships.map((relationship: AccountRelationship) => (
                    <div key={relationship.id} className="relationship-card">
                      <div className="relationship-info">
                        <div className="relationship-account">
                          <span className="relationship-label">Account:</span>
                          <a 
                            href={`/accounts/${relationship.childAccountId}`}
                            className="account-link"
                          >
                            {accountNames[relationship.childAccountId] || relationship.childAccountId}
                          </a>
                        </div>
                        <div className="relationship-type">
                          <span className="relationship-label">Type:</span>
                          <span className="relationship-value">
                            {formatRelationshipType(relationship.relationshipType)}
                          </span>
                        </div>
                      </div>
                      <div className="relationship-actions">
                        <button
                          className="btn-view"
                          onClick={() => window.location.href = `/accounts/${relationship.childAccountId}`}
                        >
                          View
                        </button>
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveRelationship(relationship.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Relationship Visualization */}
          <div className="relationship-visualization-section">
            <h2>Relationship Visualization</h2>
            
            {/* Visualization Controls */}
            <div className="relationship-controls">
              <button 
                className="view-toggle-btn active"
                onClick={() => {/* Toggle view type if needed */}}
              >
                Hierarchy View
              </button>
            </div>
            
            <div className="relationship-diagram">
              {relationships.parentRelationships.length === 0 && relationships.childRelationships.length === 0 ? (
                <p className="no-relationships">No relationships to visualize</p>
              ) : (
                <div className="hierarchy-tree">
                  {/* Parent Accounts */}
                  {relationships.parentRelationships.length > 0 && (
                    <div className="parent-accounts">
                      {relationships.parentRelationships.map((relationship: AccountRelationship) => (
                        <div 
                          key={relationship.id} 
                          className="parent-node"
                          onClick={() => window.location.href = `/accounts/${relationship.parentAccountId}`}
                        >
                          <div className="node-content">
                            <span className="node-label">
                              {accountNames[relationship.parentAccountId] || relationship.parentAccountId}
                            </span>
                            <span className="relationship-type-badge">
                              {formatRelationshipType(relationship.relationshipType)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Connection lines for parent relationships */}
                  {relationships.parentRelationships.length > 0 && (
                    <div className="parent-connections">
                      <div className="connection-line"></div>
                    </div>
                  )}
                  
                  {/* Current Account */}
                  <div className="current-account-node">
                    <div className="node-content">
                      <span className="node-label">{account ? account.name : 'Current Account'}</span>
                    </div>
                  </div>
                  
                  {/* Connection lines for child relationships */}
                  {relationships.childRelationships.length > 0 && (
                    <div className="child-connections">
                      <div className="connection-line"></div>
                    </div>
                  )}
                  
                  {/* Child Accounts */}
                  {relationships.childRelationships.length > 0 && (
                    <div className="child-accounts">
                      {relationships.childRelationships.map((relationship: AccountRelationship) => (
                        <div 
                          key={relationship.id} 
                          className="child-node"
                          onClick={() => window.location.href = `/accounts/${relationship.childAccountId}`}
                        >
                          <div className="node-content">
                            <span className="node-label">
                              {accountNames[relationship.childAccountId] || relationship.childAccountId}
                            </span>
                            <span className="relationship-type-badge">
                              {formatRelationshipType(relationship.relationshipType)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Relationship Legend */}
            {(relationships.parentRelationships.length > 0 || relationships.childRelationships.length > 0) && (
              <div className="relationship-legend">
                <div className="legend-item">
                  <div className="legend-color parent"></div>
                  <span>Parent Account</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color current"></div>
                  <span>Current Account</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color child"></div>
                  <span>Child Account</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};