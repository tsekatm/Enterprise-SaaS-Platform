/**
 * Interface for cache service operations
 * Provides methods for storing, retrieving, and managing cached data
 */
export interface ICacheService {
  /**
   * Store a value in the cache with an optional TTL
   * @param key The cache key
   * @param value The value to store
   * @param ttlSeconds Time to live in seconds (optional)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  
  /**
   * Retrieve a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Check if a key exists in the cache
   * @param key The cache key
   * @returns True if the key exists, false otherwise
   */
  exists(key: string): Promise<boolean>;
  
  /**
   * Delete a value from the cache
   * @param key The cache key
   * @returns True if the key was deleted, false if it didn't exist
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Delete multiple values from the cache using a pattern
   * @param pattern The pattern to match keys against
   * @returns Number of keys deleted
   */
  deleteByPattern(pattern: string): Promise<number>;
  
  /**
   * Store a hash in the cache
   * @param key The cache key
   * @param hash The hash to store
   * @param ttlSeconds Time to live in seconds (optional)
   */
  setHash(key: string, hash: Record<string, any>, ttlSeconds?: number): Promise<void>;
  
  /**
   * Get a hash from the cache
   * @param key The cache key
   * @returns The cached hash or null if not found
   */
  getHash<T extends Record<string, any>>(key: string): Promise<T | null>;
  
  /**
   * Get a specific field from a hash
   * @param key The cache key
   * @param field The field to retrieve
   * @returns The field value or null if not found
   */
  getHashField<T>(key: string, field: string): Promise<T | null>;
  
  /**
   * Set a specific field in a hash
   * @param key The cache key
   * @param field The field to set
   * @param value The value to set
   */
  setHashField<T>(key: string, field: string, value: T): Promise<void>;
  
  /**
   * Clear the entire cache
   */
  clear(): Promise<void>;
}