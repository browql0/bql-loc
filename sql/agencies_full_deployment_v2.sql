-- ========================================================
-- BQL RENT: MASTER AGENCIES DEPLOYMENT (Full Foundation)
-- This script is idempotent and handles both setup and optimization.
-- ========================================================

-- 1. TYPE FOUNDATION
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_status') THEN
        CREATE TYPE agency_status AS ENUM ('active', 'suspended', 'pending');
    END IF;
END $$;

-- 2. SCHEMA HARDENING (Columns)
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS status agency_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. AUDIT SYSTEM
CREATE TABLE IF NOT EXISTS agency_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_id UUID REFERENCES auth.users(id),
    agency_id UUID REFERENCES agencies(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CONSTRAINTS & INTEGRITY
-- Clean up existing nulls before applying NOT NULL
UPDATE agencies SET status = 'active' WHERE status IS NULL;
ALTER TABLE agencies ALTER COLUMN status SET NOT NULL;

-- Unique constraint with safety (Check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_name_unique') THEN
        ALTER TABLE agencies ADD CONSTRAINT agency_name_unique UNIQUE (name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_name_check') THEN
        ALTER TABLE agencies ADD CONSTRAINT agency_name_check CHECK (char_length(trim(name)) > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_action_check') THEN
        ALTER TABLE agency_audit_logs ADD CONSTRAINT audit_action_check CHECK (action IN ('create_agency', 'status_change', 'soft_delete', 'update_details'));
    END IF;
END $$;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_created_at ON agencies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agencies_deleted_at ON agencies(deleted_at) WHERE deleted_at IS NOT NULL;

-- 6. SECURITY: RLS & POLICIES
ALTER TABLE agency_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin_audit_all" ON agency_audit_logs;
CREATE POLICY "superadmin_audit_all" ON agency_audit_logs
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- Update Agencies RLS for Soft Delete
DROP POLICY IF EXISTS "a_admin_all" ON agencies;
CREATE POLICY "a_admin_all" ON agencies 
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    AND deleted_at IS NULL
);

-- 7. ENTERPRISE BUSINESS LOGIC (RPCs)
-- Logic migrated to optimized version from agency_backend_optimization.sql
CREATE OR REPLACE FUNCTION get_agencies_enterprise(
    search_term TEXT DEFAULT '',
    status_filter agency_status DEFAULT NULL,
    limit_val INT DEFAULT 10,
    offset_val INT DEFAULT 0,
    sort_column TEXT DEFAULT 'created_at',
    sort_direction TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    status agency_status,
    owner_name TEXT,
    owner_email TEXT,
    owner_phone TEXT,
    cars_count BIGINT,
    users_count BIGINT,
    revenue_est NUMERIC,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_search TEXT := trim(search_term);
    v_limit INT := LEAST(GREATEST(limit_val, 1), 100);
BEGIN
    RETURN QUERY
    WITH filtered_agencies AS (
        SELECT 
            a.id,
            a.name,
            a.status,
            a.last_activity,
            a.created_at
        FROM agencies a
        WHERE a.deleted_at IS NULL
        AND (v_search = '' OR a.name ILIKE '%' || v_search || '%')
        AND (status_filter IS NULL OR a.status = status_filter)
    ),
    counted_results AS (
        SELECT count(*) as total FROM filtered_agencies
    ),
    calculated_stats AS (
        SELECT 
            fa.id,
            fa.name,
            fa.status,
            p.full_name as owner_name,
            p.email as owner_email,
            p.phone as owner_phone,
            (SELECT count(*) FROM cars c WHERE c.agency_id = fa.id) as cars_count,
            (SELECT count(*) FROM profiles up WHERE up.agency_id = fa.id) as users_count,
            COALESCE((SELECT sum(total_price) FROM bookings b WHERE b.agency_id = fa.id AND b.status IN ('confirmed', 'completed')), 0) as revenue_est,
            fa.last_activity,
            fa.created_at,
            cr.total as total_count
        FROM filtered_agencies fa
        LEFT JOIN profiles p ON p.agency_id = fa.id AND p.role = 'owner'
        CROSS JOIN counted_results cr
    )
    SELECT 
        cs.id,
        cs.name,
        cs.status,
        cs.owner_name,
        cs.owner_email,
        cs.owner_phone,
        cs.cars_count,
        cs.users_count,
        cs.revenue_est,
        cs.last_activity,
        cs.created_at,
        cs.total_count
    FROM calculated_stats cs
    ORDER BY 
        CASE WHEN sort_column = 'name' AND sort_direction = 'ASC' THEN cs.name END ASC,
        CASE WHEN sort_column = 'name' AND sort_direction = 'DESC' THEN cs.name END DESC,
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'ASC' THEN cs.created_at END ASC,
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'DESC' THEN cs.created_at END DESC,
        CASE WHEN sort_column = 'status' AND sort_direction = 'ASC' THEN cs.status::TEXT END ASC,
        CASE WHEN sort_column = 'status' AND sort_direction = 'DESC' THEN cs.status::TEXT END DESC
    LIMIT v_limit
    OFFSET offset_val;
END;
$$;

-- Status Management
CREATE OR REPLACE FUNCTION set_agency_status(
    agency_id_input UUID,
    new_status agency_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id UUID := auth.uid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization failed: Super Admin required.');
    END IF;

    UPDATE agencies 
    SET status = new_status, 
        last_activity = now()
    WHERE id = agency_id_input;

    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'status_change', jsonb_build_object('new_status', new_status));

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Soft Delete
CREATE OR REPLACE FUNCTION soft_delete_agency_enterprise(
    agency_id_input UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id UUID := auth.uid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization failed');
    END IF;

    UPDATE agencies SET deleted_at = now(), status = 'suspended' WHERE id = agency_id_input;

    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'soft_delete', jsonb_build_object('timestamp', now()));

    RETURN jsonb_build_object('success', true);
END;
$$;
