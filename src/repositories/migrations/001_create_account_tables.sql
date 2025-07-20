-- Migration: 001_create_account_tables.sql
-- Description: Initial migration to create account tables
-- Created: 2025-07-19

-- Enable transaction for atomicity
BEGIN;

-- Account table
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    description TEXT,
    annual_revenue DECIMAL(15, 2),
    employee_count INTEGER,
    status VARCHAR(50) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Account address table
CREATE TABLE IF NOT EXISTS account_addresses (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    address_type VARCHAR(50) NOT NULL, -- 'BILLING' or 'SHIPPING'
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Account tags table
CREATE TABLE IF NOT EXISTS account_tags (
    account_id VARCHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (account_id, tag),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Account custom fields table
CREATE TABLE IF NOT EXISTS account_custom_fields (
    account_id VARCHAR(36) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(50) NOT NULL, -- 'STRING', 'NUMBER', 'BOOLEAN', 'DATE', etc.
    PRIMARY KEY (account_id, field_name),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Commit the transaction
COMMIT;