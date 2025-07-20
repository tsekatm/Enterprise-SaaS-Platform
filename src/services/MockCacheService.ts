import { ICacheService } from '../interfaces/ICacheService';

/**
 * In-memory implementation of the cache service for testing
 */
export class MockCacheService implements ICacheService {
  private cache: Map<string, { value: any; expiry: number | null }>;
  private hashCache: Map<string, Map<string, any>>;
  
  constructor() {
    this.cache = new Map();
    this.hashCache = new Map();
  }
  
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiry });
  }
  
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if the entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if the entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  async setHash(key: string, hash: Record<string, any>, ttlSeconds?: number): Promise<void> {
    const hashMap = new Map<string, any>();
    
    for (const field in hash) {
      hashMap.set(field, hash[field]);
    }
    
    this.hashCache.set(key, hashMap);
    
    // Set expiry if provided
    if (ttlSeconds) {
      const expiry = Date.now() + ttlSeconds * 1000;
      this.cache.set(`${key}:expiry`, { value: expiry, expiry: null });
    }
  }
  
  async getHash<T extends Record<string, any>>(key: string): Promise<T | null> {
    // Check if hash has expired
    const expiryEntry = this.cache.get(`${key}:expiry`);
    if (expiryEntry && expiryEntry.value < Date.now()) {
      this.hashCache.delete(key);
      this.cache.delete(`${key}:expiry`);
      return null;
    }
    
    const hashMap = this.hashCache.get(key);
    
    if (!hashMap) {
      return null;
    }
    
    const result: Record<string, any> = {};
    
    for (const [field, value] of hashMap.entries()) {
      result[field] = value;
    }
    
    return result as T;
  }
  
  async getHashField<T>(key: string, field: string): Promise<T | null> {
    // Check if hash has expired
    const expiryEntry = this.cache.get(`${key}:expiry`);
    if (expiryEntry && expiryEntry.value < Date.now()) {
      this.hashCache.delete(key);
      this.cache.delete(`${key}:expiry`);
      return null;
    }
    
    const hashMap = this.hashCache.get(key);
    
    if (!hashMap) {
      return null;
    }
    
    return hashMap.get(field) as T || null;
  }
  
  async setHashField<T>(key: string, field: string, value: T): Promise<void> {
    let hashMap = this.hashCache.get(key);
    
    if (!hashMap) {
      hashMap = new Map<string, any>();
      this.hashCache.set(key, hashMap);
    }
    
    hashMap.set(field, value);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
    this.hashCache.clear();
  }
}