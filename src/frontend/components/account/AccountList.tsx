import React, { useState, useCallback, memo, useMemo } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { 
  AccountFilters, 
  AccountListProps, 
  SortOption, 
  AccountListItem,
  PaginationParams
} from '../../types/account';
import { AccountType, AccountStatus } from '../../../models/enums/AccountEnums';
import { AccountTableRow } from './AccountTableRow';

/**
 * Account List Component
 * 
 * Displays a paginated, filterable, and sortable list of customer accounts
 */
export const AccountList: React.FC<AccountListProps> = ({ 
  initialFilters = {},
  initialSort = { field: 'name', direction: 'asc' },
  initialPagination = { page: 1, pageSize: 10 }
}) => {
  // Use the accounts hook to fetch and manage account data
  const {
    accounts,
    loading,
    error,
    filters,
    sort,
    pagination,
    totalItems,
    totalPages,
    updateFilters,
    updateSort,
    updatePagination,
    nextPage,
    prevPage,
    refresh
  } = useAccounts(initialFilters, initialSort, initialPagination);

  // Local state for filter form
  const [filterForm, setFilterForm] = useState<AccountFilters>(filters);

  // Handle filter form changes - memoized to prevent unnecessary re-renders
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Apply filters - memoized to prevent unnecessary re-renders
  const applyFilters = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(filterForm);
  }, [filterForm, updateFilters]);

  // Reset filters - memoized to prevent unnecessary re-renders
  const resetFilters = useCallback(() => {
    const emptyFilters: AccountFilters = {};
    setFilterForm(emptyFilters);
    updateFilters(emptyFilters);
  }, [updateFilters]);

  // Handle sort change - memoized to prevent unnecessary re-renders
  const handleSortChange = useCallback((field: keyof AccountListItem) => {
    if (sort.field === field) {
      // Toggle direction if same field
      updateSort({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Default to ascending for new field
      updateSort({
        field,
        direction: 'asc'
      });
    }
  }, [sort.field, sort.direction, updateSort]);

  // Handle page size change - memoized to prevent unnecessary re-renders
  const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    updatePagination({ page: 1, pageSize: newPageSize });
  }, [updatePagination]);

  // Render sort indicator
  const renderSortIndicator = (field: keyof AccountListItem) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Calculate displayed range
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, totalItems);

  return (
    <div className="account-list-container">
      <h1>Customer Accounts</h1>
      
      {/* Filter Form */}
      <div className="filter-section">
        <h2>Filters</h2>
        <form onSubmit={applyFilters}>
          <div className="filter-row">
            <div className="filter-field">
              <label htmlFor="name">Account Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={filterForm.name || ''}
                onChange={handleFilterChange}
                placeholder="Search by name"
              />
            </div>
            
            <div className="filter-field">
              <label htmlFor="industry">Industry</label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={filterForm.industry || ''}
                onChange={handleFilterChange}
                placeholder="Filter by industry"
              />
            </div>
            
            <div className="filter-field">
              <label htmlFor="type">Account Type</label>
              <select
                id="type"
                name="type"
                value={filterForm.type || ''}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                {Object.values(AccountType).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={filterForm.status || ''}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                {Object.values(AccountStatus).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-actions">
            <button type="submit" className="btn-primary">Apply Filters</button>
            <button type="button" className="btn-secondary" onClick={resetFilters}>Reset</button>
          </div>
        </form>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>Error: {error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      )}
      
      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading accounts...</div>}
      
      {/* Account Table */}
      {!loading && !error && (
        <>
          <div className="table-container">
            <table className="account-table">
              <thead>
                <tr>
                  <th onClick={() => handleSortChange('name')}>
                    Name {renderSortIndicator('name')}
                  </th>
                  <th onClick={() => handleSortChange('industry')}>
                    Industry {renderSortIndicator('industry')}
                  </th>
                  <th onClick={() => handleSortChange('type')}>
                    Type {renderSortIndicator('type')}
                  </th>
                  <th onClick={() => handleSortChange('status')}>
                    Status {renderSortIndicator('status')}
                  </th>
                  <th onClick={() => handleSortChange('createdAt')}>
                    Created {renderSortIndicator('createdAt')}
                  </th>
                  <th onClick={() => handleSortChange('updatedAt')}>
                    Updated {renderSortIndicator('updatedAt')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="no-results">
                      No accounts found matching your criteria
                    </td>
                  </tr>
                ) : (
                  accounts.map(account => (
                    <AccountTableRow key={account.id} account={account} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {accounts.length > 0 ? startItem : 0} to {accounts.length > 0 ? endItem : 0} of {totalItems} accounts
            </div>
            
            <div className="pagination-actions">
              <button 
                onClick={prevPage} 
                disabled={pagination.page <= 1}
                className="btn-pagination"
              >
                Previous
              </button>
              
              <span className="page-indicator">
                Page {pagination.page} of {totalPages}
              </span>
              
              <button 
                onClick={nextPage} 
                disabled={pagination.page >= totalPages}
                className="btn-pagination"
              >
                Next
              </button>
              
              <select 
                value={pagination.pageSize} 
                onChange={handlePageSizeChange}
                className="page-size-select"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};