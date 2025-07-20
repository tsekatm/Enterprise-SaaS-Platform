import { PaginatedResponse, PaginationParams } from './IRepository';

/**
 * Audit service interface for compliance and tracking
 */
export interface IAuditService {
  /**
   * Log entity creation
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param data Entity data
   * @param userId ID of the user who created the entity
   * @returns Promise that resolves when the audit entry is created
   */
  logCreation(entityType: string, entityId: string, data: any, userId: string): Promise<void>;
  
  /**
   * Log entity update
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param changes Changes made to the entity
   * @param userId ID of the user who updated the entity
   * @returns Promise that resolves when the audit entry is created
   */
  logUpdate(entityType: string, entityId: string, changes: any, userId: string): Promise<void>;
  
  /**
   * Log entity deletion
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param userId ID of the user who deleted the entity
   * @returns Promise that resolves when the audit entry is created
   */
  logDeletion(entityType: string, entityId: string, userId: string): Promise<void>;
  
  /**
   * Log entity access
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param userId ID of the user who accessed the entity
   * @returns Promise that resolves when the audit entry is created
   */
  logAccess(entityType: string, entityId: string, userId: string): Promise<void>;
  
  /**
   * Get audit trail for an entity
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  getAuditTrail(entityType: string, entityId: string, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>>;
  
  /**
   * Get audit entries by user
   * @param userId User ID
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  getAuditEntriesByUser(userId: string, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>>;
  
  /**
   * Get audit entries by action type
   * @param actionType Action type (e.g., 'create', 'update', 'delete', 'access')
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  getAuditEntriesByAction(actionType: AuditActionType, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>>;
  
  /**
   * Get audit entries by date range
   * @param startDate Start date
   * @param endDate End date
   * @param pagination Optional pagination parameters
   * @returns Paginated list of audit entries
   */
  getAuditEntriesByDateRange(startDate: Date, endDate: Date, pagination?: PaginationParams): Promise<PaginatedResponse<AuditEntry>>;
  
  /**
   * Export audit data for GDPR compliance
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @returns Audit data in a format suitable for export
   */
  exportAuditData(entityType: string, entityId: string): Promise<AuditExport>;
  
  /**
   * Delete audit data for an entity (for GDPR compliance)
   * @param entityType Entity type (e.g., 'account', 'contact')
   * @param entityId Entity ID
   * @returns Promise that resolves when the audit data is deleted
   */
  deleteAuditData(entityType: string, entityId: string): Promise<void>;
}

/**
 * Audit action types
 */
export type AuditActionType = 'create' | 'update' | 'delete' | 'access';

/**
 * Audit entry
 */
export interface AuditEntry {
  id: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  userId: string;
  userName?: string;
  action: AuditActionType;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit export format for GDPR compliance
 */
export interface AuditExport {
  entityType: string;
  entityId: string;
  entries: AuditEntry[];
  exportDate: Date;
  exportedBy: string;
}