import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountRelationshipManager } from '../../../components/account/AccountRelationshipManager';
import { useAccountRelationships } from '../../../hooks/useAccountRelationships';
import { useAccount } from '../../../hooks/useAccount';
import { RelationshipType } from '../../../../models/enums/RelationshipEnums';
import { wouldCreateCircularReference } from '../../../../models/AccountRelationship';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../../../hooks/useAccountRelationships');
jest.mock('../../../hooks/useAccount');
jest.mock('../../../../models/AccountRelationship', () => ({
  ...jest.requireActual('../../../../models/AccountRelationship'),
  wouldCreateCircularReference: jest.fn()
}));

describe('AccountRelationshipManager', () => {
  const mockAccountId = '123';
  const mockRelationships = {
    parentRelationships: [
      {
        id: 'rel1',
        parentAccountId: 'parent1',
        childAccountId: mockAccountId,
        relationshipType: RelationshipType.PARENT_CHILD,
        createdAt: new Date(),
        createdBy: 'user1',
        updatedAt: new Date(),
        updatedBy: 'user1'
      }
    ],
    childRelationships: [
      {
        id: 'rel2',
        parentAccountId: mockAccountId,
        childAccountId: 'child1',
        relationshipType: RelationshipType.SUBSIDIARY,
        createdAt: new Date(),
        createdBy: 'user1',
        updatedAt: new Date(),
        updatedBy: 'user1'
      }
    ]
  };
  
  const mockAddRelationship = jest.fn();
  const mockRemoveRelationship = jest.fn();
  const mockFetchRelationships = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fetch for available accounts
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          items: [
            { id: 'acc1', name: 'Account 1' },
            { id: 'acc2', name: 'Account 2' },
            { id: 'parent1', name: 'Parent Account' },
            { id: 'child1', name: 'Child Account' },
            { id: mockAccountId, name: 'Current Account' }
          ]
        })
      })
    );
    
    // Setup default mock implementation
    (useAccountRelationships as jest.Mock).mockReturnValue({
      relationships: mockRelationships,
      loading: false,
      error: null,
      addRelationship: mockAddRelationship,
      removeRelationship: mockRemoveRelationship,
      fetchRelationships: mockFetchRelationships
    });
    
    // Mock useAccount hook
    (useAccount as jest.Mock).mockReturnValue({
      account: { id: mockAccountId, name: 'Current Account' },
      loading: false,
      error: null
    });
    
    // Mock wouldCreateCircularReference function
    (wouldCreateCircularReference as jest.Mock).mockReturnValue(false);
  });
  
  it('renders the component with relationships', async () => {
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Check for main sections
    expect(screen.getByText('Manage Account Relationships')).toBeInTheDocument();
    expect(screen.getByText('Add New Relationship')).toBeInTheDocument();
    expect(screen.getByText('Current Relationships')).toBeInTheDocument();
    expect(screen.getByText('Relationship Visualization')).toBeInTheDocument();
    
    // Check for parent relationships
    expect(screen.getByText('Parent Accounts')).toBeInTheDocument();
    expect(screen.getByText('parent1')).toBeInTheDocument();
    
    // Check for child relationships
    expect(screen.getByText('Child Accounts')).toBeInTheDocument();
    expect(screen.getByText('child1')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    (useAccountRelationships as jest.Mock).mockReturnValue({
      relationships: null,
      loading: true,
      error: null,
      addRelationship: mockAddRelationship,
      removeRelationship: mockRemoveRelationship,
      fetchRelationships: mockFetchRelationships
    });
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    expect(screen.getByText('Loading relationships...')).toBeInTheDocument();
  });
  
  it('shows error state', () => {
    const mockError = new Error('Failed to load relationships');
    
    (useAccountRelationships as jest.Mock).mockReturnValue({
      relationships: null,
      loading: false,
      error: mockError,
      addRelationship: mockAddRelationship,
      removeRelationship: mockRemoveRelationship,
      fetchRelationships: mockFetchRelationships
    });
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    expect(screen.getByText('Error: Failed to load relationships')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
  
  it('allows adding a new relationship', async () => {
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Select relationship direction
    const childRadio = screen.getByLabelText('This account is a child of the selected account');
    fireEvent.click(childRadio);
    
    // Select relationship type
    const typeSelect = screen.getByLabelText('Relationship Type:');
    fireEvent.change(typeSelect, { target: { value: RelationshipType.SUBSIDIARY } });
    
    // Select account
    const accountSelect = screen.getByLabelText('Select Account:');
    fireEvent.change(accountSelect, { target: { value: 'acc1' } });
    
    // Submit form
    const addButton = screen.getByText('Add Relationship');
    fireEvent.click(addButton);
    
    // Check if addRelationship was called with correct params
    await waitFor(() => {
      expect(mockAddRelationship).toHaveBeenCalledWith(
        'acc1',
        RelationshipType.SUBSIDIARY,
        true
      );
    });
  });
  
  it('allows removing a relationship', async () => {
    // Mock confirm to return true
    window.confirm = jest.fn().mockImplementation(() => true);
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Find and click remove button for parent relationship
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    // Check if removeRelationship was called with correct params
    await waitFor(() => {
      expect(mockRemoveRelationship).toHaveBeenCalledWith('rel1');
    });
  });
  
  it('refreshes relationships when refresh button is clicked', () => {
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(mockFetchRelationships).toHaveBeenCalled();
  });
  
  it('shows no relationships message when there are none', () => {
    (useAccountRelationships as jest.Mock).mockReturnValue({
      relationships: {
        parentRelationships: [],
        childRelationships: []
      },
      loading: false,
      error: null,
      addRelationship: mockAddRelationship,
      removeRelationship: mockRemoveRelationship,
      fetchRelationships: mockFetchRelationships
    });
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    expect(screen.getAllByText('No parent accounts')[0]).toBeInTheDocument();
    expect(screen.getAllByText('No child accounts')[0]).toBeInTheDocument();
    expect(screen.getByText('No relationships to visualize')).toBeInTheDocument();
  });
  
  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(<AccountRelationshipManager accountId={mockAccountId} onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  it('shows circular relationship warning when detected', async () => {
    // Mock circular reference detection to return true
    (wouldCreateCircularReference as jest.Mock).mockReturnValue(true);
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Select an account
    const accountSelect = screen.getByLabelText('Select Account:');
    fireEvent.change(accountSelect, { target: { value: 'acc1' } });
    
    // Check if warning is displayed
    await waitFor(() => {
      expect(screen.getByText(/circular reference/i)).toBeInTheDocument();
    });
  });
  
  it('shows confirmation dialog when adding a relationship with circular reference warning', async () => {
    // Mock circular reference detection to return true
    (wouldCreateCircularReference as jest.Mock).mockReturnValue(true);
    
    // Mock confirm to return true
    window.confirm = jest.fn().mockImplementation(() => true);
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Select an account
    const accountSelect = screen.getByLabelText('Select Account:');
    fireEvent.change(accountSelect, { target: { value: 'acc1' } });
    
    // Submit form
    const addButton = screen.getByText('Add Relationship');
    fireEvent.click(addButton);
    
    // Check if confirm was called
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringMatching(/circular reference/)
    );
    
    // Check if addRelationship was called
    await waitFor(() => {
      expect(mockAddRelationship).toHaveBeenCalled();
    });
  });
  
  it('displays account names instead of IDs in the relationship visualization', async () => {
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Wait for account names to be loaded
    await waitFor(() => {
      // Check if Current Account name is displayed
      expect(screen.getByText('Current Account')).toBeInTheDocument();
    });
  });
  
  it('displays relationship legend when relationships exist', () => {
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Check for legend items
    expect(screen.getByText('Parent Account')).toBeInTheDocument();
    expect(screen.getByText('Current Account')).toBeInTheDocument();
    expect(screen.getByText('Child Account')).toBeInTheDocument();
  });
  
  it('does not display relationship legend when no relationships exist', () => {
    (useAccountRelationships as jest.Mock).mockReturnValue({
      relationships: {
        parentRelationships: [],
        childRelationships: []
      },
      loading: false,
      error: null,
      addRelationship: mockAddRelationship,
      removeRelationship: mockRemoveRelationship,
      fetchRelationships: mockFetchRelationships
    });
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Legend should not be present
    expect(screen.queryByText('Parent Account')).not.toBeInTheDocument();
  });
  
  it('displays hierarchy view toggle button', () => {
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Check for view toggle button
    expect(screen.getByText('Hierarchy View')).toBeInTheDocument();
  });
  
  it('allows navigation to parent account by clicking on node', () => {
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '' };
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Find and click on parent node
    const parentNodes = screen.getAllByText('parent1');
    fireEvent.click(parentNodes[0]);
    
    // Check if location was updated
    expect(window.location.href).toBe('/accounts/parent1');
    
    // Restore original location
    window.location = originalLocation;
  });
  
  it('allows navigation to child account by clicking on node', () => {
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '' };
    
    render(<AccountRelationshipManager accountId={mockAccountId} />);
    
    // Find and click on child node
    const childNodes = screen.getAllByText('child1');
    fireEvent.click(childNodes[0]);
    
    // Check if location was updated
    expect(window.location.href).toBe('/accounts/child1');
    
    // Restore original location
    window.location = originalLocation;
  });
});