import React from 'react';
import { render, screen } from '@testing-library/react';
import { AccountList } from '../../../components/account/AccountList';
import { LazyAccountList } from '../../../components/account/LazyAccountList';
import { AccountType, AccountStatus } from '../../../../models/enums/AccountEnums';

// Mock the useAccounts hook
jest.mock('../../../hooks/useAccounts', () => ({
  useAccounts: jest.fn(() => ({
    accounts: generateMockAccounts(100),
    loading: false,
    error: null,
    filters: {},
    sort: { field: 'name', direction: 'asc' },
    pagination: { page: 1, pageSize: 10 },
    totalItems: 100,
    totalPages: 10,
    updateFilters: jest.fn(),
    updateSort: jest.fn(),
    updatePagination: jest.fn(),
    nextPage: jest.fn(),
    prevPage: jest.fn(),
    refresh: jest.fn()
  }))
}));

// Helper function to generate mock accounts
function generateMockAccounts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `account-${i}`,
    name: `Test Account ${i}`,
    industry: i % 5 === 0 ? 'Technology' : 
              i % 5 === 1 ? 'Healthcare' : 
              i % 5 === 2 ? 'Finance' : 
              i % 5 === 3 ? 'Retail' : 'Manufacturing',
    type: i % 5 === 0 ? AccountType.CUSTOMER : 
          i % 5 === 1 ? AccountType.PROSPECT : 
          i % 5 === 2 ? AccountType.PARTNER : 
          i % 5 === 3 ? AccountType.COMPETITOR : AccountType.OTHER,
    status: i % 4 === 0 ? AccountStatus.ACTIVE : 
            i % 4 === 1 ? AccountStatus.INACTIVE : 
            i % 4 === 2 ? AccountStatus.PENDING : AccountStatus.CLOSED,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 43200000).toISOString()
  }));
}

// Helper function to measure render time
function measureRenderTime(Component: React.ComponentType<any>, props = {}) {
  const start = performance.now();
  render(<Component {...props} />);
  const end = performance.now();
  return end - start;
}

describe('Account List Performance Tests', () => {
  test('Regular AccountList should render within performance budget', () => {
    // Measure render time
    const renderTime = measureRenderTime(AccountList);
    
    console.log(`AccountList render time: ${renderTime.toFixed(2)}ms`);
    
    // Verify component rendered correctly
    expect(screen.getByText('Customer Accounts')).toBeInTheDocument();
    
    // Performance budget: 100ms
    expect(renderTime).toBeLessThan(100);
  });
  
  test('LazyAccountList should render placeholder quickly', () => {
    // Measure initial render time of lazy component
    const renderTime = measureRenderTime(LazyAccountList);
    
    console.log(`LazyAccountList initial render time: ${renderTime.toFixed(2)}ms`);
    
    // Verify placeholder is shown
    expect(screen.getByText('Loading account list...')).toBeInTheDocument();
    
    // Initial render should be very fast (under 20ms)
    expect(renderTime).toBeLessThan(20);
  });
  
  test('AccountTableRow should render efficiently', () => {
    // Import dynamically to avoid jest.mock affecting this test
    const { AccountTableRow } = require('../../../components/account/AccountTableRow');
    
    const mockAccount = generateMockAccounts(1)[0];
    
    // Measure render time for a single row
    const start = performance.now();
    render(<table><tbody><AccountTableRow account={mockAccount} /></tbody></table>);
    const end = performance.now();
    const renderTime = end - start;
    
    console.log(`AccountTableRow render time: ${renderTime.toFixed(2)}ms`);
    
    // Verify row rendered correctly
    expect(screen.getByText(mockAccount.name)).toBeInTheDocument();
    
    // Performance budget: 10ms per row
    expect(renderTime).toBeLessThan(10);
  });
});