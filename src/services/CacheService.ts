import { ICacheService } from '../interfaces/ICacheService';
import Redis from 'ioredis';

/**
 * Redis implementation of the cache service
 * Provides caching functionality using Redis
 */
export class CacheService implements ICacheService {
  private client: Redis;
  
  /**
   * Create a new CacheService instance
   * @param options Redis connection options
   */
  constructor(options?: Redis.RedisOptions) {
    this.client = new Redis(options);
  }
  
  /**
   * Store a value in the cache with an optional TTL
   * @param key The cache key
   * @param value The value to store
   * @param ttlSeconds Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }
  
  /**
   * Retrieve a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    
    if (!value) {
      return null;
    }
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing cached value for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Check if a key exists in the cache
   * @param key The cache key
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
  
  /**
   * Delete a value from the cache
   * @param key The cache key
   * @returns True if the key was deleted, false if it didn't exist
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    return result === 1;
  }
  
  /**
   * Delete multiple values from the cache using a pattern
   * @param pattern The pattern to match keys against
   * @returns Number of keys deleted
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }
    
    return await this.client.del(...keys);
  }
  
  /**
   * Store a hash in the cache
   * @param key The cache key
   * @param hash The hash to store
   * @param ttlSeconds Time to live in seconds (optional)
   */
  async setHash(key: string, hash: Record<string, any>, ttlSeconds?: number): Promise<void> {
    const serializedHash: Record<string, string> = {};
    
    // Serialize each field value
    for (const field in hash) {
      serializedHash[field] = JSON.stringify(hash[field]);
    }
    
    // Use pipeline for better performance
    const pipeline = this.client.pipeline();
    pipeline.hmset(key, serializedHash);
    
    if (ttlSeconds) {
      pipeline.expire(key, ttlSeconds);
    }
    
    await pipeline.exec();
  }
  
  /**
   * Get a hash from the cache
   * @param key The cache key
   * @returns The cached hash or null if not found
   */
  async getHash<T extends Record<string, any>>(key: string): Promise<T | null> {
    const hash = await this.client.hgetall(key);
    
    if (!hash || Object.keys(hash).length === 0) {
      return null;
    }
    
    const result: Record<string, any> = {};
    
    // Deserialize each field value
    for (const field in hash) {
      try {
        result[field] = JSON.parse(hash[field]);
      } catch (error) {
        console.error(`Error parsing cached hash field ${field} for key ${key}:`, error);
        result[field] = hash[field];
      }
    }
    
    return result as T;
  }
  
  /**
   * Get a specific field from a hash
   * @param key The cache key
   * @param field The field to retrieve
   * @returns The field value or null if not found
   */
  async getHashField<T>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    
    if (!value) {
      return null;
    }
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing cached hash field ${field} for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Set a specific field in a hash
   * @param key The cache key
   * @param field The field to set
   * @param value The value to set
   */
  async setHashField<T>(key: string, field: string, value: T): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.client.hset(key, field, serializedValue);
  }
  
  /**
   * Clear the entire cache
   */
  async clear(): Promise<void> {
    await this.client.flushall();
  }
  
  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}