import { createGzip } from 'zlib';
import { promisify } from 'util';
import { Request, Response, NextFunction } from 'express';

// Promisify zlib functions
const gzipAsync = promisify(createGzip);

/**
 * Response optimization utilities for improving API performance
 */
export class ResponseOptimizer {
  /**
   * Middleware for enabling response compression
   * @returns Express middleware function
   */
  static compressionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check if client accepts gzip encoding
      const acceptEncoding = req.headers['accept-encoding'];
      if (!acceptEncoding || !acceptEncoding.includes('gzip')) {
        return next();
      }
      
      // Set appropriate headers
      res.setHeader('Content-Encoding', 'gzip');
      
      // Store the original response methods
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Override the send method to compress the response
      res.send = function(body: any): Response {
        if (body) {
          const gzip = createGzip();
          const compressed = gzip.end(body);
          return originalSend.call(this, compressed);
        }
        return originalSend.call(this, body);
      } as any;
      
      // Override the json method to compress the response
      res.json = function(body: any): Response {
        if (body) {
          res.setHeader('Content-Type', 'application/json');
          const json = JSON.stringify(body);
          const gzip = createGzip();
          const compressed = gzip.end(json);
          return originalSend.call(this, compressed);
        }
        return originalJson.call(this, body);
      } as any;
      
      next();
    };
  }
  
  /**
   * Optimize object serialization by removing null/undefined values
   * @param obj Object to optimize
   * @returns Optimized object
   */
  static optimizeForSerialization<T>(obj: T): Partial<T> {
    if (!obj || typeof obj !== 'object' || obj instanceof Date) {
      return obj as any;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => ResponseOptimizer.optimizeForSerialization(item)) as any;
    }
    
    const result: Partial<T> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip null or undefined values
      if (value === null || value === undefined) {
        continue;
      }
      
      // Recursively optimize nested objects
      if (typeof value === 'object' && !(value instanceof Date)) {
        result[key as keyof T] = ResponseOptimizer.optimizeForSerialization(value) as any;
      } else {
        result[key as keyof T] = value as any;
      }
    }
    
    return result;
  }
  
  /**
   * Middleware for optimizing JSON responses
   * @returns Express middleware function
   */
  static jsonOptimizerMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Store the original json method
      const originalJson = res.json;
      
      // Override the json method to optimize the response
      res.json = function(body: any): Response {
        if (body) {
          const optimized = ResponseOptimizer.optimizeForSerialization(body);
          return originalJson.call(this, optimized);
        }
        return originalJson.call(this, body);
      } as any;
      
      next();
    };
  }
  
  /**
   * Middleware for setting cache headers
   * @param maxAge Maximum age in seconds
   * @returns Express middleware function
   */
  static cacheControlMiddleware(maxAge: number = 60) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only apply caching to GET requests
      if (req.method === 'GET') {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
      } else {
        // For non-GET requests, set no-cache
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
      }
      
      next();
    };
  }
  
  /**
   * Optimize a paginated response by removing unnecessary fields
   * @param response Paginated response object
   * @returns Optimized paginated response
   */
  static optimizePaginatedResponse<T>(response: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    metadata?: any;
  }): {
    items: Partial<T>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    metadata?: any;
  } {
    return {
      items: response.items.map(item => ResponseOptimizer.optimizeForSerialization(item)),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      metadata: response.metadata ? ResponseOptimizer.optimizeForSerialization(response.metadata) : undefined
    };
  }
}