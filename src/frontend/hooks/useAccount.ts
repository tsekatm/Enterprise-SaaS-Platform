import { useState, useEffect, useCallback } from 'react';
import { Account } from '../../models/Account';
import { AccountRelationships } from '../../models/AccountRelationship';
import { AuditEntry } from '../../interfaces/IAuditService';
import { PaginatedResponse, PaginationParams } from '../../interfaces/IRepository';

/**
 * Hook for fetching and managing a single account's data
 */
export const useAccount = (accountId: string) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [relationships, setRelationships] = useState<AccountRelationships | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [auditPagination, setAuditPagination] = useState<PaginationParams>({ page: 1, pageSize: 10 });
  const [totalAuditEntries, setTotalAuditEntries] = useState<number>(0);
  const [totalAuditPages, setTotalAuditPages] = useState<number>(0);

  /**
   * Fetch account details from the API
   */
  const fetchAccount = useCallback(async () => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch account details
      const response = await fetch(`/api/accounts/${accountId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account: ${response.statusText}`);
      }
      
      const accountData: Account = await response.json();
      setAccount(accountData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  /**
   * Fetch account relationships from the API
   */
  const fetchRelationships = useCallback(async () => {
    if (!accountId) return;
    
    try {
      const response = await fetch(`/api/accounts/${accountId}/relationships`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch relationships: ${response.statusText}`);
      }
      
      const relationshipsData: AccountRelationships = await response.json();
      setRelationships(relationshipsData);
    } catch (err) {
      console.error('Error fetching relationships:', err);
      // Don't set the main error state, as this is a secondary data fetch
    }
  }, [accountId]);

  /**
   * Fetch account audit trail from the API
   */
  const fetchAuditTrail = useCallback(async () => {
    if (!accountId) return;
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', auditPagination.page.toString());
      queryParams.append('pageSize', auditPagination.pageSize.toString());
      
      const response = await fetch(`/api/audit/account/${accountId}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit trail: ${response.statusText}`);
      }
      
      const auditData: PaginatedResponse<AuditEntry> = await response.json();
      setAuditTrail(auditData.items);
      setTotalAuditEntries(auditData.total);
      setTotalAuditPages(auditData.totalPages);
    } catch (err) {
      console.error('Error fetching audit trail:', err);
      // Don't set the main error state, as this is a secondary data fetch
    }
  }, [accountId, auditPagination]);

  // Fetch account when accountId changes
  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  // Fetch relationships when account is loaded
  useEffect(() => {
    if (account) {
      fetchRelationships();
    }
  }, [account, fetchRelationships]);

  // Fetch audit trail when account is loaded
  useEffect(() => {
    if (account) {
      fetchAuditTrail();
    }
  }, [account, fetchAuditTrail]);

  /**
   * Update audit pagination
   */
  const updateAuditPagination = useCallback((newPagination: PaginationParams) => {
    setAuditPagination(newPagination);
  }, []);

  /**
   * Go to next audit page
   */
  const nextAuditPage = useCallback(() => {
    if (auditPagination.page < totalAuditPages) {
      setAuditPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [auditPagination.page, totalAuditPages]);

  /**
   * Go to previous audit page
   */
  const prevAuditPage = useCallback(() => {
    if (auditPagination.page > 1) {
      setAuditPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  }, [auditPagination.page]);

  /**
   * Refresh account data
   */
  const refresh = useCallback(() => {
    fetchAccount();
  }, [fetchAccount]);

  return {
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
  };
};