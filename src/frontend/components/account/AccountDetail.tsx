import React, { useState } from 'react';
import { useAccount } from '../../hooks/useAccount';
import { AccountRelationship } from '../../../models/AccountRelationship';
import { AuditEntry } from '../../../interfaces/IAuditService';
import { PaginationParams } from '../../../interfaces/IRepository';
import { AccountDeleteDialog } from './AccountDeleteDialog';
import { AccountRelationshipManager } from './AccountRelationshipManager';

interface AccountDetailProps {
  accountId: string;
}

/**
 * Account Detail Component
 * 
 * Displays detailed information about a customer account,
 * including account information, activity history, and related contacts
 */
export const AccountDetail: React.FC<AccountDetailProps> = ({ accountId }) => {
  // Use the account hook to fetch and manage account data
  const {
    account,
    relationships,
    auditTrail,
    loading,
    error,
    auditPagination,
    totalAuditEntries,
    totalAuditPages,
    updateAuditPagination,
    nextAuditPage,
    prevAuditPage,
    refresh
  } = useAccount(accountId);

  // State for active tab and delete dialog
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'relationships'>('details');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Handle audit page size change
  const handleAuditPageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    updateAuditPagination({ page: 1, pageSize: newPageSize });
  };

  // Format date for display
  const formatDate = (date: Date | string): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  // Format audit action for display
  const formatAuditAction = (action: string): string => {
    switch (action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      case 'access': return 'Accessed';
      default: return action;
    }
  };

  // Get relationship type display name
  const getRelationshipTypeDisplay = (relationship: AccountRelationship): string => {
    return relationship.relationshipType.replace('_', ' ');
  };

  // Calculate displayed range for audit entries
  const startAuditItem = (auditPagination.page - 1) * auditPagination.pageSize + 1;
  const endAuditItem = Math.min(auditPagination.page * auditPagination.pageSize, totalAuditEntries);

  return (
    <div className="account-detail-container">
      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading account details...</div>}
      
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>Error: {error.message}</p>
          <button onClick={refresh} className="btn-primary">Retry</button>
        </div>
      )}
      
      {/* Account Details */}
      {!loading && !error && account && (
        <>
          <div className="account-header">
            <h1>{account.name}</h1>
            <div className="account-status">
              <span className={`status-badge status-${account.status.toLowerCase()}`}>
                {account.status}
              </span>
            </div>
            <div className="account-actions">
              <button 
                className="btn-edit"
                onClick={() => window.location.href = `/accounts/${account.id}/edit`}
              >
                Edit
              </button>
              <button 
                className="btn-delete"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </button>
            </div>
          </div>
          
          {/* Delete Account Dialog */}
          <AccountDeleteDialog
            accountId={account.id}
            accountName={account.name}
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onDeleted={() => window.location.href = '/accounts'}
          />
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity History
            </button>
            <button 
              className={`tab-button ${activeTab === 'relationships' ? 'active' : ''}`}
              onClick={() => setActiveTab('relationships')}
            >
              Relationships
            </button>
          </div>
          
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="account-details-tab">
              <div className="detail-section">
                <h2>Basic Information</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Industry:</span>
                    <span className="detail-value">{account.industry}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{account.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Website:</span>
                    <span className="detail-value">
                      {account.website ? (
                        <a href={account.website} target="_blank" rel="noopener noreferrer">
                          {account.website}
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">
                      {account.email ? (
                        <a href={`mailto:${account.email}`}>{account.email}</a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">
                      {account.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h2>Business Information</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Annual Revenue:</span>
                    <span className="detail-value">
                      {account.annualRevenue 
                        ? new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD',
                            maximumFractionDigits: 0
                          }).format(account.annualRevenue) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Employee Count:</span>
                    <span className="detail-value">
                      {account.employeeCount 
                        ? new Intl.NumberFormat('en-US').format(account.employeeCount) 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h2>Addresses</h2>
                <div className="addresses-container">
                  <div className="address-card">
                    <h3>Billing Address</h3>
                    {account.billingAddress ? (
                      <div className="address-content">
                        <p>{account.billingAddress.street}</p>
                        <p>{account.billingAddress.city}, {account.billingAddress.state} {account.billingAddress.postalCode}</p>
                        <p>{account.billingAddress.country}</p>
                      </div>
                    ) : (
                      <p className="no-address">No billing address provided</p>
                    )}
                  </div>
                  
                  <div className="address-card">
                    <h3>Shipping Address</h3>
                    {account.shippingAddress ? (
                      <div className="address-content">
                        <p>{account.shippingAddress.street}</p>
                        <p>{account.shippingAddress.city}, {account.shippingAddress.state} {account.shippingAddress.postalCode}</p>
                        <p>{account.shippingAddress.country}</p>
                      </div>
                    ) : (
                      <p className="no-address">No shipping address provided</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h2>Description</h2>
                <div className="description-content">
                  {account.description ? (
                    <p>{account.description}</p>
                  ) : (
                    <p className="no-description">No description provided</p>
                  )}
                </div>
              </div>
              
              {account.tags && account.tags.length > 0 && (
                <div className="detail-section">
                  <h2>Tags</h2>
                  <div className="tags-container">
                    {account.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="detail-section">
                <h2>System Information</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(account.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">{formatDate(account.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Activity History Tab */}
          {activeTab === 'activity' && (
            <div className="activity-history-tab">
              <h2>Activity History</h2>
              
              {auditTrail.length === 0 ? (
                <p className="no-activity">No activity history available</p>
              ) : (
                <>
                  <div className="audit-trail-container">
                    <table className="audit-trail-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Action</th>
                          <th>User</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditTrail.map(entry => (
                          <tr key={entry.id}>
                            <td>{formatDate(entry.timestamp)}</td>
                            <td>
                              <span className={`audit-action audit-${entry.action}`}>
                                {formatAuditAction(entry.action)}
                              </span>
                            </td>
                            <td>{entry.userName || entry.userId}</td>
                            <td>
                              {entry.action === 'update' && entry.details?.changes && (
                                <details>
                                  <summary>View Changes</summary>
                                  <pre className="audit-details">
                                    {JSON.stringify(entry.details.changes, null, 2)}
                                  </pre>
                                </details>
                              )}
                              {entry.action === 'create' && (
                                <span>Account created</span>
                              )}
                              {entry.action === 'delete' && (
                                <span>Account deleted</span>
                              )}
                              {entry.action === 'access' && (
                                <span>Account viewed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="pagination-controls">
                    <div className="pagination-info">
                      Showing {auditTrail.length > 0 ? startAuditItem : 0} to {auditTrail.length > 0 ? endAuditItem : 0} of {totalAuditEntries} activities
                    </div>
                    
                    <div className="pagination-actions">
                      <button 
                        onClick={prevAuditPage} 
                        disabled={auditPagination.page <= 1}
                        className="btn-pagination"
                      >
                        Previous
                      </button>
                      
                      <span className="page-indicator">
                        Page {auditPagination.page} of {totalAuditPages}
                      </span>
                      
                      <button 
                        onClick={nextAuditPage} 
                        disabled={auditPagination.page >= totalAuditPages}
                        className="btn-pagination"
                      >
                        Next
                      </button>
                      
                      <select 
                        value={auditPagination.pageSize} 
                        onChange={handleAuditPageSizeChange}
                        className="page-size-select"
                      >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Relationships Tab */}
          {activeTab === 'relationships' && (
            <div className="relationships-tab">
              <AccountRelationshipManager accountId={accountId} />
            </div>
          )}
        </>
      )}
    </div>
  );
};