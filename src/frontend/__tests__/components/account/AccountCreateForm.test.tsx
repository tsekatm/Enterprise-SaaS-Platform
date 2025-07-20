import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountCreateForm } from '../../../components/account/AccountCreateForm';
import { useCreateAccount } from '../../../hooks/useCreateAccount';
import { AccountType, AccountStatus } from '../../../../models/enums/AccountEnums';

// Mock the useCreateAccount hook
jest.mock('../../../hooks/useCreateAccount');

describe('AccountCreateForm', () => {
  // Setup mock implementation
  const mockCreateAccount = jest.fn();
  const mockResetForm = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    mockCreateAccount.mockReset();
    mockResetForm.mockReset();
    
    // Default mock implementation
    (useCreateAccount as jest.Mock).mockReturnValue({
      createAccount: mockCreateAccount,
      loading: false,
      error: null,
      validationErrors: {},
      success: false,
      createdAccountId: null,
      resetForm: mockResetForm
    });
  });

  test('renders the form with all required fields', () => {
    render(<AccountCreateForm />);
    
    // Check for form title
    expect(screen.getByText('Create New Account')).toBeInTheDocument();
    
    // Check for required fields
    expect(screen.getByLabelText(/Account Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Type \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status \*/i)).toBeInTheDocument();
    
    // Check for optional fields
    expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Annual Revenue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Employees/i)).toBeInTheDocument();
    
    // Check for address sections
    expect(screen.getByText('Billing Address')).toBeInTheDocument();
    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    
    // Check for tags section
    expect(screen.getByText('Tags')).toBeInTheDocument();
    
    // Check for form buttons
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  test('submits the form with valid data', async () => {
    render(<AccountCreateForm />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Account Name \*/i), { target: { value: 'Test Account' } });
    fireEvent.change(screen.getByLabelText(/Industry \*/i), { target: { value: 'Technology' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    
    // Check that createAccount was called with the correct data
    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Account',
        industry: 'Technology',
        type: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE
      }));
    });
  });

  test('displays validation errors', () => {
    // Mock validation errors
    (useCreateAccount as jest.Mock).mockReturnValue({
      createAccount: mockCreateAccount,
      loading: false,
      error: new Error('Validation failed'),
      validationErrors: {
        'name': 'Account name is required',
        'industry': 'Industry is required'
      },
      success: false,
      createdAccountId: null,
      resetForm: mockResetForm
    });
    
    render(<AccountCreateForm />);
    
    // Check that error messages are displayed
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    expect(screen.getByText('Account name is required')).toBeInTheDocument();
    expect(screen.getByText('Industry is required')).toBeInTheDocument();
  });

  test('shows success message and redirects on successful creation', () => {
    // Mock successful creation
    (useCreateAccount as jest.Mock).mockReturnValue({
      createAccount: mockCreateAccount,
      loading: false,
      error: null,
      validationErrors: {},
      success: true,
      createdAccountId: '123',
      resetForm: mockResetForm
    });
    
    // Mock window.location.href
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '' };
    
    render(<AccountCreateForm />);
    
    // Check that success message is displayed
    expect(screen.getByText('Account created successfully!')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to account details...')).toBeInTheDocument();
    
    // Check that redirection would happen
    expect(window.location.href).toBe('/accounts/123');
    
    // Restore window.location
    window.location = originalLocation;
  });

  test('handles address fields correctly', () => {
    render(<AccountCreateForm />);
    
    // Initially, address fields should not be visible
    expect(screen.queryByLabelText(/Street \*/i)).not.toBeInTheDocument();
    
    // Enable billing address
    fireEvent.click(screen.getByLabelText(/Add Billing Address/i));
    
    // Now billing address fields should be visible
    expect(screen.getByLabelText(/^Street \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^City \*/i)).toBeInTheDocument();
    
    // Fill in billing address
    fireEvent.change(screen.getByLabelText(/^Street \*/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/^City \*/i), { target: { value: 'Anytown' } });
    fireEvent.change(screen.getAllByLabelText(/State\/Province \*/i)[0], { target: { value: 'CA' } });
    fireEvent.change(screen.getAllByLabelText(/Postal Code \*/i)[0], { target: { value: '12345' } });
    fireEvent.change(screen.getAllByLabelText(/Country \*/i)[0], { target: { value: 'USA' } });
    
    // Enable shipping address
    fireEvent.click(screen.getByLabelText(/Add Shipping Address/i));
    
    // Check "Same as Billing" checkbox
    fireEvent.click(screen.getByLabelText(/Same as Billing Address/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    
    // Check that createAccount was called with the correct address data
    waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith(expect.objectContaining({
        billingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA'
        },
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA'
        }
      }));
    });
  });

  test('handles tags correctly', () => {
    render(<AccountCreateForm />);
    
    // Add a tag
    fireEvent.change(screen.getByLabelText(/Add Tags/i), { target: { value: 'important' } });
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));
    
    // Tag should be displayed
    expect(screen.getByText('important')).toBeInTheDocument();
    
    // Add another tag using Enter key
    fireEvent.change(screen.getByLabelText(/Add Tags/i), { target: { value: 'urgent' } });
    fireEvent.keyPress(screen.getByLabelText(/Add Tags/i), { key: 'Enter', code: 13, charCode: 13 });
    
    // Both tags should be displayed
    expect(screen.getByText('important')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
    
    // Remove a tag
    fireEvent.click(screen.getAllByRole('button', { name: /×/i })[0]);
    
    // Only one tag should remain
    expect(screen.queryByText('important')).not.toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    
    // Check that createAccount was called with the correct tags
    waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['urgent']
      }));
    });
  });

  test('resets the form when reset button is clicked', () => {
    render(<AccountCreateForm />);
    
    // Fill in some fields
    fireEvent.change(screen.getByLabelText(/Account Name \*/i), { target: { value: 'Test Account' } });
    fireEvent.change(screen.getByLabelText(/Industry \*/i), { target: { value: 'Technology' } });
    
    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    
    // Check that form fields are reset
    expect(screen.getByLabelText(/Account Name \*/i)).toHaveValue('');
    expect(screen.getByLabelText(/Industry \*/i)).toHaveValue('');
    
    // Check that resetForm was called
    expect(mockResetForm).toHaveBeenCalled();
  });

  test('disables submit button when loading', () => {
    // Mock loading state
    (useCreateAccount as jest.Mock).mockReturnValue({
      createAccount: mockCreateAccount,
      loading: true,
      error: null,
      validationErrors: {},
      success: false,
      createdAccountId: null,
      resetForm: mockResetForm
    });
    
    render(<AccountCreateForm />);
    
    // Check that submit button is disabled and shows loading text
    const submitButton = screen.getByRole('button', { name: /Creating\.\.\./i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Creating...');
    
    // Check that reset button is also disabled
    expect(screen.getByRole('button', { name: /Reset/i })).toBeDisabled();
  });
});