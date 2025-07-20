-- Account table
CREATE TABLE accounts (
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

-- Create indexes for common search fields
CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_industry ON accounts(industry);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);
CREATE INDEX idx_accounts_updated_at ON accounts(updated_at);

-- Account address table
CREATE TABLE account_addresses (
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

CREATE INDEX idx_account_addresses_account_id ON account_addresses(account_id);

-- Account tags table
CREATE TABLE account_tags (
    account_id VARCHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (account_id, tag),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_account_tags_tag ON account_tags(tag);

-- Account custom fields table
CREATE TABLE account_custom_fields (
    account_id VARCHAR(36) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(50) NOT NULL, -- 'STRING', 'NUMBER', 'BOOLEAN', 'DATE', etc.
    PRIMARY KEY (account_id, field_name),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_account_custom_fields_field_name ON account_custom_fields(field_name);

-- Account relationships table
CREATE TABLE account_relationships (
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

-- Create indexes for relationship queries
CREATE INDEX idx_account_relationships_parent ON account_relationships(parent_account_id);
CREATE INDEX idx_account_relationships_child ON account_relationships(child_account_id);
CREATE UNIQUE INDEX idx_account_relationships_unique ON account_relationships(parent_account_id, child_account_id);

-- Account audit log table
CREATE TABLE account_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ACCESS'
    details TEXT,
    performed_by VARCHAR(36) NOT NULL,
    performed_at TIMESTAMP NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_account_audit_logs_account_id ON account_audit_logs(account_id);
CREATE INDEX idx_account_audit_logs_action ON account_audit_logs(action);
CREATE INDEX idx_account_audit_logs_performed_at ON account_audit_logs(performed_at);