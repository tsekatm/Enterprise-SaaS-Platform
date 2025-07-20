import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../AuditService';
import { AuditActionType } from '../../interfaces/IAuditService';

describe('AuditService', () => {
  let auditService: AuditService;
  
  const userId = 'test-user';
  const entityType = 'account';
  const entityId = 'account-123';
  
  beforeEach(() => {
    auditService = new AuditService();
    auditService.setUserName(userId, 'Test User');
  });
  
  describe('logCreation', () => {
    it('should create an audit entry for entity creation', async () => {
      const data = { name: 'Test Account', industry: 'Technology' };
      
      await auditService.logCreation(entityType, entityId, data, userId);
      
      const auditTrail = await auditService.getAuditTrail(entityType, entityId);
      expect(auditTrail.total).toBe(1);
      expect(auditTrail.items[0].action).toBe('create');
      expect(auditTrail.items[0].userId).toBe(userId);
      expect(auditTrail.items[0].entityType).toBe(entityType);
      expect(auditTrail.items[0].entityId).toBe(entityId);
      expect(auditTrail.items[0].details.createdEntity).toEqual(data);
    });
    
    it('should sanitize sensitive data in creation logs', async () => {
      const data = { 
        name: 'Test Account', 
        industry: 'Technology',
        password: 'secret123',
        creditCard: '1234-5678-9012-3456'
      };
      
      await auditService.logCreation(entityType, entityId, data, userId);
      
      const auditTrail = await auditService.getAuditTrail(entityType, entityId);
      expect(auditTrail.items[0].details.createdEntity.password).toBe('[REDACTED]');
      expect(auditTrail.items[0].details.createdEntity.creditCard).toBe('[REDACTED]');
    });
  });
  
  describe('logUpdate', () => {
    it('should create an audit entry for entity update', async () => {
      const changes = { name: 'Updated Account', industry: 'Finance' };
      
      await auditService.logUpdate(entityType, entityId, changes, userId);
      
      const auditTrail = await auditService.getAuditTrail(entityType, entityId);
      expect(auditTrail.total).toBe(1);
      expect(auditTrail.items[0].action).toBe('update');
      expect(auditTrail.items[0].details.changes).toEqual(changes);
    });
  });
  
  describe('logDeletion', () => {
    it('should create an audit entry for entity deletion', async () => {
      await auditService.logDeletion(entityType, entityId, userId);
      
      const auditTrail = await auditService.getAuditTrail(entityType, entityId);
      expect(auditTrail.total).toBe(1);
      expect(auditTrail.items[0].action).toBe('delete');
      expect(auditTrail.items[0].details.deletedEntityId).toBe(entityId);
    });
  });
  
  describe('logAccess', () => {
    it('should create an audit entry for entity access', async () => {
      await auditService.logAccess(entityType, entityId, userId);
      
      const auditTrail = await auditService.getAuditTrail(entityType, entityId);
      expect(auditTrail.total).toBe(1);
      expect(auditTrail.items[0].action).toBe('access');
    });
  });
  
  describe('getAuditTrail', () => {
    it('should return audit trail for an entity', async () => {
      await auditService.logCreation(entityType, entityId, { name: 'Test' }, userId);
      await auditService.logUpdate(entityType, entityId, { name: 'Updated' }, userId);
      await auditService.logAccess(entityType, entityId, userId);
      
      const auditTrail = await auditService.getAuditTrail(entityType, entityId);
      expect(auditTrail.total).toBe(3);
      expect(auditTrail.items.length).toBe(3);
      
      // Should be sorted by timestamp (newest first)
      expect(auditTrail.items[0].action).toBe('access');
      expect(auditTrail.items[1].action).toBe('update');
      expect(auditTrail.items[2].action).toBe('create');
    });
    
    it('should support pagination', async () => {
      // Create 5 audit entries
      for (let i = 0; i < 5; i++) {
        await auditService.logAccess(entityType, entityId, userId);
      }
      
      const page1 = await auditService.getAuditTrail(entityType, entityId, { page: 1, pageSize: 2 });
      expect(page1.total).toBe(5);
      expect(page1.items.length).toBe(2);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);
      expect(page1.totalPages).toBe(3);
      
      const page2 = await auditService.getAuditTrail(entityType, entityId, { page: 2, pageSize: 2 });
      expect(page2.items.length).toBe(2);
      expect(page2.page).toBe(2);
      
      const page3 = await auditService.getAuditTrail(entityType, entityId, { page: 3, pageSize: 2 });
      expect(page3.items.length).toBe(1);
      expect(page3.page).toBe(3);
    });
  });
  
  describe('getAuditEntriesByUser', () => {
    it('should return audit entries for a user', async () => {
      const otherUserId = 'other-user';
      
      await auditService.logCreation(entityType, entityId, { name: 'Test' }, userId);
      await auditService.logCreation(entityType, 'other-entity', { name: 'Other' }, otherUserId);
      await auditService.logUpdate(entityType, entityId, { name: 'Updated' }, userId);
      
      const userEntries = await auditService.getAuditEntriesByUser(userId);
      expect(userEntries.total).toBe(2);
      expect(userEntries.items.every(entry => entry.userId === userId)).toBe(true);
    });
  });
  
  describe('getAuditEntriesByAction', () => {
    it('should return audit entries for an action type', async () => {
      await auditService.logCreation(entityType, entityId, { name: 'Test' }, userId);
      await auditService.logUpdate(entityType, entityId, { name: 'Updated' }, userId);
      await auditService.logDeletion(entityType, entityId, userId);
      
      const actionType: AuditActionType = 'update';
      const actionEntries = await auditService.getAuditEntriesByAction(actionType);
      expect(actionEntries.total).toBe(1);
      expect(actionEntries.items[0].action).toBe(actionType);
    });
  });
  
  describe('getAuditEntriesByDateRange', () => {
    it('should return audit entries within a date range', async () => {
      // Create entries with different timestamps
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Mock the Date constructor to return specific dates
      const realDate = Date;
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(threeDaysAgo);
          } else {
            super(...args);
          }
        }
      } as any;
      
      await auditService.logCreation(entityType, entityId, { name: 'Test' }, userId);
      
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(twoDaysAgo);
          } else {
            super(...args);
          }
        }
      } as any;
      
      await auditService.logUpdate(entityType, entityId, { name: 'Updated' }, userId);
      
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(yesterday);
          } else {
            super(...args);
          }
        }
      } as any;
      
      await auditService.logAccess(entityType, entityId, userId);
      
      // Restore the original Date
      global.Date = realDate;
      
      // Search for entries between yesterday and two days ago
      const rangeEntries = await auditService.getAuditEntriesByDateRange(twoDaysAgo, now);
      expect(rangeEntries.total).toBe(2);
      expect(rangeEntries.items[0].timestamp >= twoDaysAgo).toBe(true);
      expect(rangeEntries.items[0].timestamp <= now).toBe(true);
    });
  });
  
  describe('exportAuditData', () => {
    it('should export audit data for an entity', async () => {
      await auditService.logCreation(entityType, entityId, { name: 'Test' }, userId);
      await auditService.logUpdate(entityType, entityId, { name: 'Updated' }, userId);
      
      const exportData = await auditService.exportAuditData(entityType, entityId);
      expect(exportData.entityType).toBe(entityType);
      expect(exportData.entityId).toBe(entityId);
      expect(exportData.entries.length).toBe(2);
      expect(exportData.exportDate).toBeInstanceOf(Date);
    });
  });
  
  describe('deleteAuditData', () => {
    it('should delete audit data for an entity', async () => {
      await auditService.logCreation(entityType, entityId, { name: 'Test' }, userId);
      await auditService.logUpdate(entityType, entityId, { name: 'Updated' }, userId);
      
      // Create an entry for another entity
      await auditService.logCreation(entityType, 'other-entity', { name: 'Other' }, userId);
      
      // Delete audit data for the first entity
      await auditService.deleteAuditData(entityType, entityId);
      
      // Check that the entries for the first entity are gone
      const auditTrail = await auditService.getAuditTrail(entityType, entityId);
      expect(auditTrail.total).toBe(0);
      
      // Check that the entry for the other entity still exists
      const otherAuditTrail = await auditService.getAuditTrail(entityType, 'other-entity');
      expect(otherAuditTrail.total).toBe(1);
    });
  });
});