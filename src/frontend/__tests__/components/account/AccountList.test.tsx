import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountList } from '../../../components/account/AccountList';
import { useAccounts } from '../../../hooks/useAccounts';
import { AccountType, AccountStatus } from '../../../../models/enums/AccountEnums';

// Mock the useAccounts hook
jest.mock('../../../hooks/useAccounts');

describe('AccountList Component', () => {
  // Mock data
  const mockAccounts = [
    {
      id: '1',
      name: 'Acme Corporation',
      industry: 'Technology',
      type: AccountType.CUSTOMER,
      status: AccountStatus.ACTIVE,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-06-15')
    },
    {
      id: '2',
      name: 'Globex Industries',
      industry: 'Manufacturing',
      type: AccountType.PROSPECT,
      status: AccountStatus.PENDING,
      createdAt: new Date('2023-02-15'),
      updatedAt: new Date('2023-05-20')
    },
    {
      id: '3',
      name: 'Oceanic Airlines',
      industry: 'Transportation',
      type: AccountType.CUSTOMER,
      status: AccountStatus.ACTIVE,
      createdAt: new Date('2023-03-10'),
      updatedAt: new Date('2023-07-01')
    }
  ];

  // Default mock implementation
  const mockUseAccounts = {
    accounts: mockAccounts,
    loading: false,
    error: null,
    filters: {},
    sort: { field: 'name', direction: 'asc' },
    pagination: { page: 1, pageSize: 10 },
    totalItems: 3,
    totalPages: 1,
    updateFilters: jest.fn(),
    updateSort: jest.fn(),
    updatePagination: jest.fn(),
    nextPage: jest.fn(),
    prevPage: jest.fn(),
    refresh: jest.fn()
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (useAccounts as jest.Mock).mockReturnValue(mockUseAccounts);
  });

  test('renders account list with correct data', () => {
    render(<AccountList />);
    
    // Check if the component renders the title
    expect(screen.getByText('Customer Accounts')).toBeInTheDocument();
    
    // Check if all accounts are rendered
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Globex Industries')).toBeInTheDocument();
    expect(screen.getByText('Oceanic Airlines')).toBeInTheDocument();
    
    // Check if the table headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('displays loading state when loading', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      ...mockUseAccounts,
      loading: true
    });
    
    render(<AccountList />);
    
    expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
    expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument();
  });

  test('displays error message when there is an error', () => {
    const errorMessage = 'Failed to fetch accounts';
    (useAccounts as jest.Mock).mockReturnValue({
      ...mockUseAccounts,
      error: new Error(errorMessage),
      accounts: []
    });
    
    render(<AccountList />);
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('displays no results message when no accounts match filters', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      ...mockUseAccounts,
      accounts: []
    });
    
    render(<AccountList />);
    
    expect(screen.getByText('No accounts found matching your criteria')).toBeInTheDocument();
  });

  test('calls updateFilters when filters are applied', async () => {
    render(<AccountList />);
    
    // Fill in filter form
    fireEvent.change(screen.getByLabelText('Account Name'), {
      target: { value: 'Acme' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByText('Apply Filters'));
    
    // Check if updateFilters was called with the correct parameters
    expect(mockUseAccounts.updateFilters).toHaveBeenCalledWith({
      name: 'Acme'
    });
  });

  test('calls updateSort when a column header is clicked', () => {
    render(<AccountList />);
    
    // Click on the Industry column header
    fireEvent.click(screen.getByText('Industry'));
    
    // Check if updateSort was called with the correct parameters
    expect(mockUseAccounts.updateSort).toHaveBeenCalledWith({
      field: 'industry',
      direction: 'asc'
    });
  });

  test('calls nextPage when next button is clicked', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      ...mockUseAccounts,
      pagination: { page: 1, pageSize: 10 },
      totalPages: 2
    });
    
    render(<AccountList />);
    
    // Click on the Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Check if nextPage was called
    expect(mockUseAccounts.nextPage).toHaveBeenCalled();
  });

  test('calls prevPage when previous button is clicked', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      ...mockUseAccounts,
      pagination: { page: 2, pageSize: 10 },
      totalPages: 2
    });
    
    render(<AccountList />);
    
    // Click on the Previous button
    fireEvent.click(screen.getByText('Previous'));
    
    // Check if prevPage was called
    expect(mockUseAccounts.prevPage).toHaveBeenCalled();
  });

  test('calls updatePagination when page size is changed', () => {
    render(<AccountList />);
    
    // Change the page size
    fireEvent.change(screen.getByRole('combobox', { name: '' }), {
      target: { value: '25' }
    });
    
    // Check if updatePagination was called with the correct parameters
    expect(mockUseAccounts.updatePagination).toHaveBeenCalledWith({
      page: 1,
      pageSize: 25
    });
  });

  test('resets filters when reset button is clicked', () => {
    render(<AccountList />);
    
    // Fill in filter form
    fireEvent.change(screen.getByLabelText('Account Name'), {
      target: { value: 'Acme' }
    });
    
    // Click the reset button
    fireEvent.click(screen.getByText('Reset'));
    
    // Check if updateFilters was called with empty filters
    expect(mockUseAccounts.updateFilters).toHaveBeenCalledWith({});
  });
});