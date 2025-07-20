-- Migration for optimizing database queries

-- Add composite indexes for common filter combinations
CREATE INDEX idx_accounts_industry_status ON accounts(industry, status);
CREATE INDEX idx_accounts_type_status ON accounts(type, status);
CREATE INDEX idx_accounts_name_industry ON accounts(name, industry);

-- Add index for revenue range queries
CREATE INDEX idx_accounts_annual_revenue ON accounts(annual_revenue);

-- Add index for employee count range queries
CREATE INDEX idx_accounts_employee_count ON accounts(employee_count);

-- Add index for full text search on description
CREATE INDEX idx_accounts_description ON accounts(description);

-- Add composite index for date range queries
CREATE INDEX idx_accounts_created_updated ON accounts(created_at, updated_at);

-- Add index for email searches
CREATE INDEX idx_accounts_email ON accounts(email);

-- Add index for phone searches
CREATE INDEX idx_accounts_phone ON accounts(phone);

-- Add index for website searches
CREATE INDEX idx_accounts_website ON accounts(website);

-- Add index for relationship queries with type
CREATE INDEX idx_account_relationships_parent_type ON account_relationships(parent_account_id, relationship_type);
CREATE INDEX idx_account_relationships_child_type ON account_relationships(child_account_id, relationship_type);

-- Add index for audit logs with account and action
CREATE INDEX idx_audit_logs_account_action ON account_audit_logs(account_id, action);

-- Add index for custom fields with value for searching
CREATE INDEX idx_account_custom_fields_value ON account_custom_fields(field_value);

-- Add functional index for case-insensitive name searches
CREATE INDEX idx_accounts_name_lower ON accounts(LOWER(name));

-- Add functional index for case-insensitive industry searches
CREATE INDEX idx_accounts_industry_lower ON accounts(LOWER(industry));