import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountEditForm } from '../../../components/account/AccountEditForm';
import { useAccount } from '../../../hooks/useAccount';
import { useUpdateAccount } from '../../../hooks/useUpdateAccount';
import { AccountType, AccountStatus } from '../../../../models/enums/AccountEnums';

// Mock the hooks
jest.mock('../../../hooks/useAccount');
jest.mock('../../../hooks/useUpdateAccount');

describe('AccountEditForm', () => {
  // Mock account data
  const mockAccount = {
    id: '123',
    name: 'Test Company',
    industry: 'Technology',
    type: AccountType.CUSTOMER,
    status: AccountStatus.ACTIVE,
    website: 'https://example.com',
    phone: '+1234567890',
    email: 'contact@example.com',
    description: 'Test description',
    annualRevenue: 1000000,
    employeeCount: 100,
    tags: ['tech', 'customer'],
    billingAddress: {
      street: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country'
    },
    shippingAddress: {
      street: '456 Other St',
      city: 'Ship City',
      state: 'Ship State',
      postalCode: '67890',
      country: 'Ship Country'
    },
    createdBy: 'user1',
    createdAt: new Date('2023-01-01'),
    updatedBy: 'user2',
    updatedAt: new Date('2023-01-02')
  };

  // Setup default mocks
  beforeEach(() => {
    // Mock useAccount hook
    (useAccount as jest.Mock).mockReturnValue({
      account: mockAccount,
      loading: false,
      error: null,
      refresh: jest.fn()
    });

    // Mock useUpdateAccount hook
    (useUpdateAccount as jest.Mock).mockReturnValue({
      updateAccount: jest.fn(),
      loading: false,
      error: null,
      validationErrors: {},
      success: false,
      updatedAccount: null,
      resetForm: jest.fn()
    });
  });

  it('renders the form with account data', () => {
    render(<AccountEditForm accountId="123" />);
    
    // Check if form title is rendered
    expect(screen.getByText(/Edit Account: Test Company/i)).toBeInTheDocument();
    
    // Check if form fields are populated with account data
    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('Test Company');
    expect(screen.getByLabelText(/Industry/i)).toHaveValue('Technology');
    expect(screen.getByLabelText(/Website/i)).toHaveValue('https://example.com');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('contact@example.com');
    expect(screen.getByLabelText(/Phone/i)).toHaveValue('+1234567890');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test description');
    expect(screen.getByLabelText(/Annual Revenue/i)).toHaveValue(1000000);
    expect(screen.getByLabelText(/Number of Employees/i)).toHaveValue(100);
    
    // Check if tags are displayed
    expect(screen.getByText('tech')).toBeInTheDocument();
    expect(screen.getByText('customer')).toBeInTheDocument();
    
    // Check if addresses are displayed
    expect(screen.getByLabelText(/Add Billing Address/i)).toBeChecked();
    expect(screen.getByLabelText(/Add Shipping Address/i)).toBeChecked();
  });

  it('shows loading state when account is loading', () => {
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
      loading: true,
      error: null,
      refresh: jest.fn()
    });
    
    render(<AccountEditForm accountId="123" />);
    
    expect(screen.getByText(/Loading account data/i)).toBeInTheDocument();
  });

  it('shows error state when account loading fails', () => {
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
      loading: false,
      error: new Error('Failed to load account'),
      refresh: jest.fn()
    });
    
    render(<AccountEditForm accountId="123" />);
    
    expect(screen.getByText(/Error loading account: Failed to load account/i)).toBeInTheDocument();
  });

  it('handles form field changes', () => {
    render(<AccountEditForm accountId="123" />);
    
    // Change name field
    fireEvent.change(screen.getByLabelText(/Account Name/i), { target: { value: 'Updated Company Name' } });
    
    // Check if the field value was updated
    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('Updated Company Name');
  });

  it('handles form submission', async () => {
    const mockUpdateAccount = jest.fn();
    (useUpdateAccount as jest.Mock).mockReturnValue({
      updateAccount: mockUpdateAccount,
      loading: false,
      error: null,
      validationErrors: {},
      success: false,
      updatedAccount: null,
      resetForm: jest.fn()
    });
    
    render(<AccountEditForm accountId="123" />);
    
    // Change a field
    fireEvent.change(screen.getByLabelText(/Account Name/i), { target: { value: 'Updated Company Name' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check if updateAccount was called
    expect(mockUpdateAccount).toHaveBeenCalled();
  });

  it('shows validation errors', () => {
    (useUpdateAccount as jest.Mock).mockReturnValue({
      updateAccount: jest.fn(),
      loading: false,
      error: null,
      validationErrors: {
        'name': 'Account name is required',
        'email': 'Invalid email format'
      },
      success: false,
      updatedAccount: null,
      resetForm: jest.fn()
    });
    
    render(<AccountEditForm accountId="123" />);
    
    // Check if validation errors are displayed
    expect(screen.getByText('Account name is required')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('shows success message when update is successful', () => {
    (useUpdateAccount as jest.Mock).mockReturnValue({
      updateAccount: jest.fn(),
      loading: false,
      error: null,
      validationErrors: {},
      success: true,
      updatedAccount: mockAccount,
      resetForm: jest.fn()
    });
    
    render(<AccountEditForm accountId="123" />);
    
    // Check if success message is displayed
    expect(screen.getByText(/Account updated successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to account details/i)).toBeInTheDocument();
  });

  it('handles concurrency error', async () => {
    const mockUpdateAccount = jest.fn().mockImplementation(() => {
      throw new Error('Conflict: This account has been modified by another user');
    });
    
    (useUpdateAccount as jest.Mock).mockReturnValue({
      updateAccount: mockUpdateAccount,
      loading: false,
      error: new Error('Conflict: This account has been modified by another user'),
      validationErrors: {},
      success: false,
      updatedAccount: null,
      resetForm: jest.fn()
    });
    
    render(<AccountEditForm accountId="123" />);
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check if concurrency error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/This account has been modified by another user since you started editing/i)).toBeInTheDocument();
    });
  });

  it('handles address changes', () => {
    render(<AccountEditForm accountId="123" />);
    
    // Change billing address field
    fireEvent.change(screen.getByLabelText(/^Street/i), { target: { value: '789 New St' } });
    
    // Check if the field value was updated
    expect(screen.getByLabelText(/^Street/i)).toHaveValue('789 New St');
  });

  it('handles shipping same as billing checkbox', () => {
    render(<AccountEditForm accountId="123" />);
    
    // Check "Same as Billing Address" checkbox
    fireEvent.click(screen.getByLabelText(/Same as Billing Address/i));
    
    // Shipping address fields should not be visible
    expect(screen.queryByLabelText(/^Ship City/i)).not.toBeInTheDocument();
  });

  it('handles tag addition and removal', () => {
    render(<AccountEditForm accountId="123" />);
    
    // Add a new tag
    fireEvent.change(screen.getByPlaceholderText(/Enter tag and press Enter/i), { target: { value: 'newtag' } });
    fireEvent.click(screen.getByText('Add'));
    
    // Check if the new tag is displayed
    expect(screen.getByText('newtag')).toBeInTheDocument();
    
    // Remove a tag
    fireEvent.click(screen.getAllByText('×')[0]);
    
    // Check if the tag was removed
    expect(screen.queryByText('tech')).not.toBeInTheDocument();
  });

  it('handles form reset', () => {
    const mockResetForm = jest.fn();
    (useUpdateAccount as jest.Mock).mockReturnValue({
      updateAccount: jest.fn(),
      loading: false,
      error: null,
      validationErrors: {},
      success: false,
      updatedAccount: null,
      resetForm: mockResetForm
    });
    
    render(<AccountEditForm accountId="123" />);
    
    // Change a field
    fireEvent.change(screen.getByLabelText(/Account Name/i), { target: { value: 'Updated Company Name' } });
    
    // Reset the form
    fireEvent.click(screen.getByText('Reset'));
    
    // Check if resetForm was called
    expect(mockResetForm).toHaveBeenCalled();
    
    // Check if the field was reset to original value
    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('Test Company');
  });
});