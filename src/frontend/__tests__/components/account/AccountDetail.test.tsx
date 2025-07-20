import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountDetail } from '../../../components/account/AccountDetail';
import { useAccount } from '../../../hooks/useAccount';
import { AccountStatus, AccountType } from '../../../../models/enums/AccountEnums';
import { RelationshipType } from '../../../../models/enums/RelationshipEnums';

// Mock the useAccount hook and AccountRelationshipManager component
jest.mock('../../../hooks/useAccount');
jest.mock('../../../components/account/AccountRelationshipManager', () => ({
  AccountRelationshipManager: jest.fn(() => <div data-testid="mock-relationship-manager">Relationship Manager</div>)
}));

describe('AccountDetail Component', () => {
  // Mock account data
  const mockAccount = {
    id: '123',
    name: 'Acme Corporation',
    industry: 'Technology',
    type: AccountType.CUSTOMER,
    website: 'https://acme.example.com',
    phone: '+1-555-123-4567',
    email: 'info@acme.example.com',
    billingAddress: {
      street: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    shippingAddress: {
      street: '456 Shipping Ave',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    description: 'A leading technology company',
    annualRevenue: 5000000,
    employeeCount: 500,
    status: AccountStatus.ACTIVE,
    tags: ['tech', 'enterprise', 'customer'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-06-01T00:00:00Z'),
    createdBy: 'user1',
    updatedBy: 'user2'
  };

  // Mock relationships data
  const mockRelationships = {
    parentRelationships: [
      {
        id: 'rel1',
        parentAccountId: 'parent1',
        childAccountId: '123',
        relationshipType: RelationshipType.PARENT_CHILD,
        createdAt: new Date('2023-01-15T00:00:00Z'),
        updatedAt: new Date('2023-01-15T00:00:00Z'),
        createdBy: 'user1',
        updatedBy: 'user1'
      }
    ],
    childRelationships: [
      {
        id: 'rel2',
        parentAccountId: '123',
        childAccountId: 'child1',
        relationshipType: RelationshipType.SUBSIDIARY,
        createdAt: new Date('2023-02-15T00:00:00Z'),
        updatedAt: new Date('2023-02-15T00:00:00Z'),
        createdBy: 'user1',
        updatedBy: 'user1'
      }
    ]
  };

  // Mock audit trail data
  const mockAuditTrail = [
    {
      id: 'audit1',
      timestamp: new Date('2023-01-01T00:00:00Z'),
      entityType: 'account',
      entityId: '123',
      userId: 'user1',
      userName: 'John Doe',
      action: 'create',
      details: { createdEntity: { name: 'Acme Corporation' } },
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome'
    },
    {
      id: 'audit2',
      timestamp: new Date('2023-06-01T00:00:00Z'),
      entityType: 'account',
      entityId: '123',
      userId: 'user2',
      userName: 'Jane Smith',
      action: 'update',
      details: { changes: { status: 'ACTIVE' } },
      ipAddress: '192.168.1.2',
      userAgent: 'Firefox'
    }
  ];

  // Default mock implementation
  const mockUseAccount = {
    account: mockAccount,
    relationships: mockRelationships,
    auditTrail: mockAuditTrail,
    loading: false,
    error: null,
    auditPagination: { page: 1, pageSize: 10 },
    totalAuditEntries: 2,
    totalAuditPages: 1,
    updateAuditPagination: jest.fn(),
    nextAuditPage: jest.fn(),
    prevAuditPage: jest.fn(),
    refresh: jest.fn()
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (useAccount as jest.Mock).mockReturnValue(mockUseAccount);
  });

  test('renders account details correctly', () => {
    render(<AccountDetail accountId="123" />);
    
    // Check if account name is displayed
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    
    // Check if basic information is displayed
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
    
    // Check if contact information is displayed
    expect(screen.getByText('info@acme.example.com')).toBeInTheDocument();
    expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
    
    // Check if addresses are displayed
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('456 Shipping Ave')).toBeInTheDocument();
    
    // Check if description is displayed
    expect(screen.getByText('A leading technology company')).toBeInTheDocument();
    
    // Check if tags are displayed
    expect(screen.getByText('tech')).toBeInTheDocument();
    expect(screen.getByText('enterprise')).toBeInTheDocument();
    expect(screen.getByText('customer')).toBeInTheDocument();
  });

  test('displays loading state when loading', () => {
    (useAccount as jest.Mock).mockReturnValue({
      ...mockUseAccount,
      account: null,
      loading: true
    });
    
    render(<AccountDetail accountId="123" />);
    
    expect(screen.getByText('Loading account details...')).toBeInTheDocument();
  });

  test('displays error message when there is an error', () => {
    const errorMessage = 'Failed to fetch account';
    (useAccount as jest.Mock).mockReturnValue({
      ...mockUseAccount,
      account: null,
      error: new Error(errorMessage)
    });
    
    render(<AccountDetail accountId="123" />);
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Check if refresh was called
    expect(mockUseAccount.refresh).toHaveBeenCalled();
  });

  test('switches between tabs correctly', () => {
    render(<AccountDetail accountId="123" />);
    
    // Initially, details tab should be active
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    
    // Click on Activity History tab
    fireEvent.click(screen.getByText('Activity History'));
    
    // Activity History content should be visible
    expect(screen.getByText('Activity History')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Click on Relationships tab
    fireEvent.click(screen.getByText('Relationships'));
    
    // Relationship Manager component should be rendered
    expect(screen.getByTestId('mock-relationship-manager')).toBeInTheDocument();
    expect(screen.getByText('Relationship Manager')).toBeInTheDocument();
  });

  test('handles audit pagination correctly', () => {
    (useAccount as jest.Mock).mockReturnValue({
      ...mockUseAccount,
      auditPagination: { page: 1, pageSize: 10 },
      totalAuditPages: 2
    });
    
    render(<AccountDetail accountId="123" />);
    
    // Switch to Activity History tab
    fireEvent.click(screen.getByText('Activity History'));
    
    // Click next page button
    fireEvent.click(screen.getByText('Next'));
    
    // Check if nextAuditPage was called
    expect(mockUseAccount.nextAuditPage).toHaveBeenCalled();
    
    // Change page size
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '25' } });
    
    // Check if updateAuditPagination was called with the correct parameters
    expect(mockUseAccount.updateAuditPagination).toHaveBeenCalledWith({
      page: 1,
      pageSize: 25
    });
  });
});