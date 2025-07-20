import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockCacheService } from '../MockCacheService';
import { ICacheService } from '../../interfaces/ICacheService';

describe('CacheService', () => {
  let cacheService: ICacheService;

  beforeEach(() => {
    // Use MockCacheService for testing to avoid Redis dependency
    cacheService = new MockCacheService();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a string value', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value);
      const result = await cacheService.get<string>(key);

      expect(result).toBe(value);
    });

    it('should store and retrieve an object value', async () => {
      const key = 'test-object';
      const value = { name: 'Test', id: 123 };

      await cacheService.set(key, value);
      const result = await cacheService.get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get<string>('non-existent');
      expect(result).toBeNull();
    });

    it('should respect TTL and expire items', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';
      
      // Set with 1 second TTL
      await cacheService.set(key, value, 1);
      
      // Should exist immediately
      let result = await cacheService.get<string>(key);
      expect(result).toBe(value);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired now
      result = await cacheService.get<string>(key);
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      const key = 'exists-key';
      await cacheService.set(key, 'value');
      
      const result = await cacheService.exists(key);
      expect(result).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const result = await cacheService.exists('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an existing key', async () => {
      const key = 'delete-key';
      await cacheService.set(key, 'value');
      
      const deleteResult = await cacheService.delete(key);
      expect(deleteResult).toBe(true);
      
      const getResult = await cacheService.get(key);
      expect(getResult).toBeNull();
    });

    it('should return false when deleting non-existent key', async () => {
      const result = await cacheService.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('deleteByPattern', () => {
    it('should delete keys matching a pattern', async () => {
      await cacheService.set('user:1', { id: 1 });
      await cacheService.set('user:2', { id: 2 });
      await cacheService.set('product:1', { id: 1 });
      
      const deleteCount = await cacheService.deleteByPattern('user:*');
      expect(deleteCount).toBe(2);
      
      const user1 = await cacheService.get('user:1');
      const user2 = await cacheService.get('user:2');
      const product1 = await cacheService.get('product:1');
      
      expect(user1).toBeNull();
      expect(user2).toBeNull();
      expect(product1).not.toBeNull();
    });
  });

  describe('hash operations', () => {
    it('should store and retrieve a hash', async () => {
      const key = 'user-hash';
      const hash = { name: 'John', age: 30, active: true };
      
      await cacheService.setHash(key, hash);
      const result = await cacheService.getHash<typeof hash>(key);
      
      expect(result).toEqual(hash);
    });

    it('should get a specific field from a hash', async () => {
      const key = 'user-hash';
      const hash = { name: 'John', age: 30, active: true };
      
      await cacheService.setHash(key, hash);
      const name = await cacheService.getHashField<string>(key, 'name');
      const age = await cacheService.getHashField<number>(key, 'age');
      
      expect(name).toBe('John');
      expect(age).toBe(30);
    });

    it('should set a specific field in a hash', async () => {
      const key = 'user-hash';
      const hash = { name: 'John', age: 30 };
      
      await cacheService.setHash(key, hash);
      await cacheService.setHashField(key, 'active', true);
      
      const result = await cacheService.getHash<typeof hash & { active: boolean }>(key);
      expect(result).toEqual({ name: 'John', age: 30, active: true });
    });
  });

  describe('clear', () => {
    it('should clear all cached data', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.setHash('hash1', { field: 'value' });
      
      await cacheService.clear();
      
      const key1 = await cacheService.get('key1');
      const key2 = await cacheService.get('key2');
      const hash1 = await cacheService.getHash('hash1');
      
      expect(key1).toBeNull();
      expect(key2).toBeNull();
      expect(hash1).toBeNull();
    });
  });
});