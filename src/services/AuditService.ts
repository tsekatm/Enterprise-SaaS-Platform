import { v4 as uuidv4 } from 'uuid';
import { IAuditService, AuditEntry, AuditActionType, AuditExport } from '../interfaces/IAuditService';
import { PaginatedResponse, PaginationParams } from '../interfaces/IRepository';

/**
 * Implementation of the Audit service
 * Handles audit logging for compliance and tracking
 */
export class AuditService implements IAuditService {
  // In-memory storage for audit entries
  // In a real application, this would be replaced with a database connection
  private auditEntries: Map<string, AuditEntry> = new Map<string, AuditEntry>();
  
  // Map of user IDs to user names
  private userNames: Map<string, string> = new Map<string, string>();
  
  /**
   * Constructor
   */
  constructor() {
    // Initialize with some default user names
    this.setupDefaultUserNames();
  }
  
  /**
   * Log entity creation
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param data Entity data
   * @param userId ID of the user who created the entity
   * @returns Promise that resolves when the audit entry is created
   */
  async logCreation(entityType: string, entityId: string, data: any, userId: string): Promise<void> {
    await this.createAuditEntry(entityType, entityId, userId, 'create', {
      createdEntity: this.sanitizeData(data)
    });
  }
  
  /**
   * Log entity update
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param changes Changes made to the entity
   * @param userId ID of the user who updated the entity
   * @returns Promise that resolves when the audit entry is created
   */
  async logUpdate(entityType: string, entityId: string, changes: any, userId: string): Promise<void> {
    await this.createAuditEntry(entityType, entityId, userId, 'update', {
      changes: this.sanitizeData(changes)
    });
  }
  
  /**
   * Log entity deletion
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param userId ID of the user who deleted the entity
   * @returns Promise that resolves when the audit entry is created
   */
  async logDeletion(entityType: string, entityId: string, userId: string): Promise<void> {
    await this.createAuditEntry(entityType, entityId, userId, 'delete', {
      deletedEntityId: entityId
    });
  }
  
  /**
   * Log entity access
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param userId ID of the user who accessed the entity
   * @returns Promise that resolves when the audit entry is created
   */
  async logAccess(entityType: string, entityId: string, userId: string): Promise<void> {
    await this.createAuditEntry(entityType, entityId, userId, 'access', {
      accessType: 'read'
    });
  }
  
  /**
   * Get audit trail for an entity
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  async getAuditTrail(entityType: string, entityId: string, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>> {
    const entries = Array.from(this.auditEntries.values()).filter(entry => 
      entry.entityType === entityType && entry.entityId === entityId
    );
    
    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return this.paginateResults(entries, pagination);
  }
  
  /**
   * Get audit entries by user
   * @param userId User ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  async getAuditEntriesByUser(userId: string, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>> {
    const entries = Array.from(this.auditEntries.values()).filter(entry => 
      entry.userId === userId
    );
    
    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return this.paginateResults(entries, pagination);
  }
  
  /**
   * Get audit entries by action type
   * @param actionType Action type (e.g., 'create', 'update', 'delete', 'access')
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  async getAuditEntriesByAction(actionType: AuditActionType, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>> {
    const entries = Array.from(this.auditEntries.values()).filter(entry => 
      entry.action === actionType
    );
    
    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return this.paginateResults(entries, pagination);
  }
  
  /**
   * Get audit entries by date range
   * @param startDate Start date
   * @param endDate End date
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  async getAuditEntriesByDateRange(startDate: Date, endDate: Date, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>> {
    const entries = Array.from(this.auditEntries.values()).filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );
    
    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return this.paginateResults(entries, pagination);
  }
  
  /**
   * Export audit data for GDPR compliance
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @returns Audit data in a format suitable for export
   */
  async exportAuditData(entityType: string, entityId: string): Promise<AuditExport> {
    const entries = Array.from(this.auditEntries.values()).filter(entry => 
      entry.entityType === entityType && entry.entityId === entityId
    );
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return {
      entityType,
      entityId,
      entries,
      exportDate: new Date(),
      exportedBy: 'system' // In a real app, this would be the authenticated user
    };
  }
  
  /**
   * Delete audit data for an entity (for GDPR compliance)
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @returns Promise that resolves when the audit data is deleted
   */
  async deleteAuditData(entityType: string, entityId: string): Promise<void> {
    // Find all audit entries for this entity
    const entriesToDelete: string[] = [];
    
    this.auditEntries.forEach((entry, id) => {
      if (entry.entityType === entityType && entry.entityId === entityId) {
        entriesToDelete.push(id);
      }
    });
    
    // Delete the entries
    entriesToDelete.forEach(id => {
      this.auditEntries.delete(id);
    });
  }
  
  /**
   * Set user name
   * @param userId User ID
   * @param userName User name
   */
  setUserName(userId: string, userName: string): void {
    this.userNames.set(userId, userName);
  }
  
  /**
   * Create an audit entry
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param userId User ID
   * @param action Action type
   * @param details Action details
   * @returns Created audit entry
   */
  private async createAuditEntry(
    entityType: string,
    entityId: string,
    userId: string,
    action: AuditActionType,
    details: any
  ): Promise<AuditEntry> {
    const id = uuidv4();
    const timestamp = new Date();
    const userName = this.userNames.get(userId);
    
    const entry: AuditEntry = {
      id,
      timestamp,
      entityType,
      entityId,
      userId,
      userName,
      action,
      details,
      ipAddress: '127.0.0.1', // In a real app, this would come from the request
      userAgent: 'AuditService/1.0' // In a real app, this would come from the request
    };
    
    this.auditEntries.set(id, entry);
    
    return entry;
  }
  
  /**
   * Sanitize data for storage in audit logs
   * Removes sensitive information and limits data size
   * @param data Data to sanitize
   * @returns Sanitized data
   */
  private sanitizeData(data: any): any {
    if (!data) {
      return data;
    }
    
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Sanitize sensitive fields
    this.sanitizeSensitiveFields(sanitized);
    
    // Limit data size
    return this.limitDataSize(sanitized);
  }
  
  /**
   * Sanitize sensitive fields in data
   * @param data Data to sanitize
   */
  private sanitizeSensitiveFields(data: any): void {
    if (typeof data !== 'object' || data === null) {
      return;
    }
    
    // List of sensitive field names
    const sensitiveFields = [
      'password', 'secret', 'token', 'apiKey', 'creditCard',
      'ssn', 'socialSecurityNumber', 'dob', 'dateOfBirth'
    ];
    
    // Recursively sanitize objects
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Check if this is a sensitive field
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          data[key] = '[REDACTED]';
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          // Recursively sanitize nested objects
          this.sanitizeSensitiveFields(data[key]);
        }
      }
    }
  }
  
  /**
   * Limit data size to prevent excessive storage
   * @param data Data to limit
   * @returns Limited data
   */
  private limitDataSize(data: any): any {
    const maxSize = 10000; // Maximum size in characters
    
    const jsonString = JSON.stringify(data);
    if (jsonString.length <= maxSize) {
      return data;
    }
    
    // If data is too large, truncate it
    return {
      _truncated: true,
      _originalSize: jsonString.length,
      summary: jsonString.substring(0, maxSize) + '...'
    };
  }
  
  /**
   * Apply pagination to a list of audit entries
   * @param entries List of entries to paginate
   * @param pagination Pagination parameters
   * @returns Paginated response
   */
  private paginateResults(entries: AuditEntry[], pagination?: PaginationParams): PaginatedResponse<AuditEntry> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedItems = entries.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      total: entries.length,
      page,
      pageSize,
      totalPages: Math.ceil(entries.length / pageSize)
    };
  }
  
  /**
   * Set up default user names
   */
  private setupDefaultUserNames(): void {
    this.userNames.set('admin-user', 'Admin User');
    this.userNames.set('manager-user', 'Manager User');
    this.userNames.set('sales-user', 'Sales User');
    this.userNames.set('regular-user', 'Regular User');
  }
}