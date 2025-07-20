-- Migration: 003_create_indexes.sql
-- Description: Migration to create indexes for optimized queries
-- Created: 2025-07-19
-- Requirement: 5.3 - Search performance optimization

-- Enable transaction for atomicity
BEGIN;

-- Indexes for accounts table
-- These indexes improve search and filtering performance
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_accounts_industry ON accounts(industry);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_updated_at ON accounts(updated_at);

-- Composite indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_accounts_industry_status ON accounts(industry, status);
CREATE INDEX IF NOT EXISTS idx_accounts_type_status ON accounts(type, status);

-- Full text search index for description (PostgreSQL specific)
-- Note: This syntax is PostgreSQL specific and may need to be adjusted for other databases
-- CREATE INDEX IF NOT EXISTS idx_accounts_description_fts ON accounts USING GIN (to_tsvector('english', description));

-- Indexes for account_addresses table
CREATE INDEX IF NOT EXISTS idx_account_addresses_account_id ON account_addresses(account_id);
CREATE INDEX IF NOT EXISTS idx_account_addresses_country ON account_addresses(country);
CREATE INDEX IF NOT EXISTS idx_account_addresses_city ON account_addresses(city);
CREATE INDEX IF NOT EXISTS idx_account_addresses_postal_code ON account_addresses(postal_code);

-- Indexes for account_tags table
CREATE INDEX IF NOT EXISTS idx_account_tags_tag ON account_tags(tag);

-- Indexes for account_custom_fields table
CREATE INDEX IF NOT EXISTS idx_account_custom_fields_field_name ON account_custom_fields(field_name);
CREATE INDEX IF NOT EXISTS idx_account_custom_fields_field_value ON account_custom_fields(field_value);

-- Indexes for account_relationships table
CREATE INDEX IF NOT EXISTS idx_account_relationships_parent ON account_relationships(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_account_relationships_child ON account_relationships(child_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_relationships_unique ON account_relationships(parent_account_id, child_account_id);
CREATE INDEX IF NOT EXISTS idx_account_relationships_type ON account_relationships(relationship_type);

-- Indexes for account_audit_logs table
CREATE INDEX IF NOT EXISTS idx_account_audit_logs_account_id ON account_audit_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_account_audit_logs_action ON account_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_account_audit_logs_performed_at ON account_audit_logs(performed_at);
CREATE INDEX IF NOT EXISTS idx_account_audit_logs_performed_by ON account_audit_logs(performed_by);

-- Commit the transaction
COMMIT;