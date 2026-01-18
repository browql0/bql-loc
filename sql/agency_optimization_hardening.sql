-- Agency System: Zero-Defect SQL Optimization
-- 1. Schema Hardening: Constraints
-- Ensure agency names are unique and not just whitespace
ALTER TABLE agencies 
ADD CONSTRAINT agency_name_unique UNIQUE (name),
ADD CONSTRAINT agency_name_check CHECK (char_length(trim(name)) > 0);

-- 2. Performance Optimization: Indexes
-- Optimized indexes for the 'get_agencies_enterprise' RPC
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_created_at ON agencies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agencies_deleted_at ON agencies(deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. Audit System Hardening
-- Add check constraint to ensure valid actions are logged
ALTER TABLE agency_audit_logs
ADD CONSTRAINT audit_action_check CHECK (action IN ('create_agency', 'status_change', 'soft_delete', 'update_details'));

-- 4. Orphan Prevention
-- Ensure agency_id in profiles always points to an active agency (not strictly possible with soft-delete without triggers, 
-- but we ensure the FK is robust)
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_agency_id_fkey,
ADD CONSTRAINT profiles_agency_id_fkey 
    FOREIGN KEY (agency_id) 
    REFERENCES agencies(id) 
    ON DELETE SET NULL;

-- 5. Data Integrity: Default Status Fix
-- Ensure all existing agencies have a valid status
UPDATE agencies SET status = 'active' WHERE status IS NULL;
ALTER TABLE agencies ALTER COLUMN status SET NOT NULL;
