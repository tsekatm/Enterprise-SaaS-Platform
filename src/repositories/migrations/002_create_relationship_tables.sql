-- Migration: 002_create_relationship_tables.sql
-- Description: Migration to create account relationship tables
-- Created: 2025-07-19

-- Enable transaction for atomicity
BEGIN;

-- Account relationships table
CREATE TABLE IF NOT EXISTS account_relationships (
    id VARCHAR(36) PRIMARY KEY,
    parent_account_id VARCHAR(36) NOT NULL,
    child_account_id VARCHAR(36) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (parent_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (child_account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Account audit log table
CREATE TABLE IF NOT EXISTS account_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ACCESS'
    details TEXT,
    performed_by VARCHAR(36) NOT NULL,
    performed_at TIMESTAMP NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Commit the transaction
COMMIT;