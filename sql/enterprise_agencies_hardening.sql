-- Enterprise Agencies Hardening & Audit System
-- 1. Create enum for agency status if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_status') THEN
        CREATE TYPE agency_status AS ENUM ('active', 'suspended', 'pending');
    END IF;
END $$;

-- 2. Harden agencies table
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS status agency_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE; -- FOR SOFT DELETE

-- 3. Create Audit Logs table
CREATE TABLE IF NOT EXISTS agency_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_id UUID REFERENCES auth.users(id),
    agency_id UUID REFERENCES agencies(id),
    action TEXT NOT NULL, -- 'create', 'update', 'suspend', 'activate', 'delete'
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit logs
ALTER TABLE agency_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "superadmin_audit_all" ON agency_audit_logs
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
    )
);

-- 4. Update Agencies RLS to support Soft Delete
-- Modify existing policies to ignore soft-deleted rows
DROP POLICY IF EXISTS "a_admin_all" ON agencies;
DROP POLICY IF EXISTS "a_staff_view" ON agencies;

CREATE POLICY "a_admin_all" ON agencies 
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    AND deleted_at IS NULL
);

CREATE POLICY "a_staff_view" ON agencies 
FOR SELECT USING (
    id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
    AND deleted_at IS NULL
);
