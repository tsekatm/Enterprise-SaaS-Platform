import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountDeleteDialog } from '../../../components/account/AccountDeleteDialog';
import { useDeleteAccount } from '../../../hooks/useDeleteAccount';

// Mock the useDeleteAccount hook
jest.mock('../../../hooks/useDeleteAccount');

describe('AccountDeleteDialog', () => {
  const mockAccountId = '123';
  const mockAccountName = 'Test Account';
  const mockOnClose = jest.fn();
  const mockOnDeleted = jest.fn();
  
  // Default mock implementation
  const mockUseDeleteAccount = {
    loading: false,
    error: null,
    dependencies: [],
    hasDependencies: false,
    checkDependencies: jest.fn().mockResolvedValue(false),
    deleteAccount: jest.fn().mockResolvedValue({ success: true })
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useDeleteAccount as jest.Mock).mockReturnValue(mockUseDeleteAccount);
  });
  
  it('should not render when isOpen is false', () => {
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={false}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });
  
  it('should render confirmation message when isOpen is true', () => {
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    expect(screen.getByText(/Are you sure you want to delete the account/)).toBeInTheDocument();
    expect(screen.getByText(mockAccountName)).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });
  
  it('should check dependencies when opened', async () => {
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    await waitFor(() => {
      expect(mockUseDeleteAccount.checkDependencies).toHaveBeenCalledWith(mockAccountId);
    });
  });
  
  it('should show loading state while checking dependencies', () => {
    (useDeleteAccount as jest.Mock).mockReturnValue({
      ...mockUseDeleteAccount,
      loading: true
    });
    
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    expect(screen.getByText('Checking dependencies...')).toBeInTheDocument();
  });
  
  it('should show dependencies warning when dependencies exist', async () => {
    (useDeleteAccount as jest.Mock).mockReturnValue({
      ...mockUseDeleteAccount,
      dependencies: ['Related Contact', 'Child Account'],
      hasDependencies: true
    });
    
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    expect(screen.getByText('Warning: This account has dependencies')).toBeInTheDocument();
    expect(screen.getByText('Related Contact')).toBeInTheDocument();
    expect(screen.getByText('Child Account')).toBeInTheDocument();
    
    // Delete button should be disabled when dependencies exist and force delete is not checked
    const deleteButton = screen.getByText('Delete Account');
    expect(deleteButton).toBeDisabled();
    
    // Check the force delete checkbox
    const checkbox = screen.getByLabelText(/I understand the risks/);
    fireEvent.click(checkbox);
    
    // Delete button should be enabled after checking the force delete checkbox
    expect(deleteButton).not.toBeDisabled();
  });
  
  it('should call deleteAccount when delete button is clicked', async () => {
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    // Click the delete button
    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockUseDeleteAccount.deleteAccount).toHaveBeenCalledWith(mockAccountId, false);
      expect(mockOnDeleted).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
  
  it('should call deleteAccount with force=true when force delete is checked', async () => {
    (useDeleteAccount as jest.Mock).mockReturnValue({
      ...mockUseDeleteAccount,
      dependencies: ['Related Contact'],
      hasDependencies: true
    });
    
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    // Check the force delete checkbox
    const checkbox = screen.getByLabelText(/I understand the risks/);
    fireEvent.click(checkbox);
    
    // Click the delete button
    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockUseDeleteAccount.deleteAccount).toHaveBeenCalledWith(mockAccountId, true);
    });
  });
  
  it('should display error message when deletion fails', async () => {
    const errorMessage = 'Failed to delete account';
    (useDeleteAccount as jest.Mock).mockReturnValue({
      ...mockUseDeleteAccount,
      error: new Error(errorMessage)
    });
    
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
  });
  
  it('should close the dialog when cancel button is clicked', () => {
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    // Click the cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnDeleted).not.toHaveBeenCalled();
  });
  
  it('should disable buttons when loading', () => {
    (useDeleteAccount as jest.Mock).mockReturnValue({
      ...mockUseDeleteAccount,
      loading: true
    });
    
    render(
      <AccountDeleteDialog
        accountId={mockAccountId}
        accountName={mockAccountName}
        isOpen={true}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
    
    // The delete button text changes when loading
    const deleteButton = screen.getByText('Deleting...');
    expect(deleteButton).toBeDisabled();
  });
});