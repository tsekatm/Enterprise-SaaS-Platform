import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  AccountFilters, 
  PaginatedResponse, 
  PaginationParams, 
  SortOption, 
  AccountListItem 
} from '../types/account';

/**
 * Hook for fetching and managing account data
 * Optimized for performance with debouncing, caching, and memoization
 */
export const useAccounts = (
  initialFilters: AccountFilters = {},
  initialSort: SortOption = { field: 'name', direction: 'asc' },
  initialPagination: PaginationParams = { page: 1, pageSize: 10 }
) => {
  // State for account data and metadata
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<AccountFilters>(initialFilters);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [pagination, setPagination] = useState<PaginationParams>(initialPagination);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Cache for storing previous results to avoid unnecessary API calls
  const cache = useRef<Map<string, {
    data: PaginatedResponse<AccountListItem>,
    timestamp: number
  }>>(new Map());
  
  // Debounce timer for search operations
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Cache expiration time (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000;

  /**
   * Generate a cache key based on current filters, sort, and pagination
   */
  const getCacheKey = useCallback(() => {
    return JSON.stringify({ filters, sort, pagination });
  }, [filters, sort, pagination]);

  /**
   * Check if a cached result is valid
   */
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_EXPIRATION;
  }, [CACHE_EXPIRATION]);

  /**
   * Fetch accounts from the API with caching and debouncing
   */
  const fetchAccounts = useCallback(async () => {
    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set loading state
    setLoading(true);
    setError(null);
    
    // Generate cache key
    const cacheKey = getCacheKey();
    
    // Check if we have a valid cached result
    const cachedResult = cache.current.get(cacheKey);
    if (cachedResult && isCacheValid(cachedResult.timestamp)) {
      // Use cached data
      setAccounts(cachedResult.data.items);
      setTotalItems(cachedResult.data.totalItems);
      setTotalPages(cachedResult.data.totalPages);
      setLoading(false);
      return;
    }
    
    // Debounce API calls (300ms delay)
    debounceTimer.current = setTimeout(async () => {
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Add pagination params
        queryParams.append('page', pagination.page.toString());
        queryParams.append('pageSize', pagination.pageSize.toString());
        
        // Add sort params
        queryParams.append('sortField', sort.field.toString());
        queryParams.append('sortDirection', sort.direction);
        
        // Add filter params
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
        
        // Make API request
        const response = await fetch(`/api/accounts?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }
        
        const data: PaginatedResponse<AccountListItem> = await response.json();
        
        // Update state
        setAccounts(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
        
        // Cache the result
        cache.current.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [filters, sort, pagination, getCacheKey, isCacheValid]);

  // Fetch accounts when dependencies change
  useEffect(() => {
    fetchAccounts();
    
    // Cleanup function to clear debounce timer
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [fetchAccounts]);

  /**
   * Update filters and reset to first page
   */
  const updateFilters = useCallback((newFilters: AccountFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Update sort and reset to first page
   */
  const updateSort = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Update pagination
   */
  const updatePagination = useCallback((newPagination: PaginationParams) => {
    setPagination(newPagination);
  }, []);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.page < totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.page, totalPages]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  }, [pagination.page]);

  /**
   * Refresh accounts data
   */
  const refresh = useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
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
  };
};