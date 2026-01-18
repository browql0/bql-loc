-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 👤 USERS MANAGEMENT - SUPER ADMIN
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Date: 2026-01-18
-- Description: Schema updates and RPC functions for Users Tab professionalization
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════════════════
-- 1. SCHEMA UPDATES
-- ═══════════════════════════════════════════════════════════════

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles 
        ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 2. RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- A. GET PAGINATED USERS (Enterprise Level)
CREATE OR REPLACE FUNCTION get_users_enterprise(
    search_term TEXT DEFAULT '',
    status_filter TEXT DEFAULT NULL,
    role_filter TEXT DEFAULT NULL,
    limit_val INT DEFAULT 10,
    offset_val INT DEFAULT 0,
    sort_column TEXT DEFAULT 'created_at',
    sort_direction TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    role user_role,
    status TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ,
    agency_name TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only SuperAdmin can view all users via this RPC
    IF public.get_my_role() != 'superadmin' THEN
        RAISE EXCEPTION 'Access denied: SuperAdmin only';
    END IF;

    RETURN QUERY
    WITH filtered_users AS (
        SELECT 
            p.id,
            p.full_name,
            p.email,
            p.role,
            p.status,
            p.phone,
            p.created_at,
            a.name AS agency_name
        FROM profiles p
        LEFT JOIN agencies a ON p.agency_id = a.id
        WHERE 
            (search_term = '' OR 
             p.full_name ILIKE '%' || search_term || '%' OR 
             p.email ILIKE '%' || search_term || '%')
            AND (status_filter IS NULL OR p.status = status_filter)
            AND (role_filter IS NULL OR role_filter = 'all' OR p.role::text = role_filter)
    )
    SELECT 
        fu.id,
        fu.full_name,
        fu.email,
        fu.role,
        fu.status,
        fu.phone,
        fu.created_at,
        fu.agency_name,
        (SELECT COUNT(*) FROM filtered_users) AS total_count
    FROM filtered_users fu
    ORDER BY
        CASE WHEN sort_direction = 'ASC' THEN
            CASE 
                WHEN sort_column = 'full_name' THEN fu.full_name
                WHEN sort_column = 'email' THEN fu.email
                WHEN sort_column = 'status' THEN fu.status
                WHEN sort_column = 'agency_name' THEN fu.agency_name
                ELSE fu.created_at::text
            END
        END ASC,
        CASE WHEN sort_direction = 'DESC' THEN
            CASE 
                WHEN sort_column = 'full_name' THEN fu.full_name
                WHEN sort_column = 'email' THEN fu.email
                WHEN sort_column = 'status' THEN fu.status
                WHEN sort_column = 'agency_name' THEN fu.agency_name
                ELSE fu.created_at::text
            END
        END DESC
    LIMIT limit_val
    OFFSET offset_val;
END;
$$;

-- B. SET USER STATUS (Suspend/Activate/Block)
CREATE OR REPLACE FUNCTION set_user_status(
    user_id_input UUID,
    new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Security Check
    IF public.get_my_role() != 'superadmin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied');
    END IF;

    -- Prevent self-lockout
    IF user_id_input = auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot change your own status');
    END IF;

    -- Validation
    IF new_status NOT IN ('active', 'suspended', 'blocked') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
    END IF;

    -- Update Profile
    UPDATE profiles 
    SET 
        status = new_status,
        updated_at = now()
    WHERE id = user_id_input;

    -- Optional: If status is 'blocked' or 'suspended', we might want to revoke sessions
    -- But that requires interacting with auth.sessions which is restricted.
    -- App logic should check profile status on login/token refresh.

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- C. UPDATE USER PROFILE (Admin)
CREATE OR REPLACE FUNCTION update_user_profile_admin(
    user_id_input UUID,
    full_name_input TEXT,
    phone_input TEXT,
    role_input user_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_role user_role;
BEGIN
    -- Security Check
    IF public.get_my_role() != 'superadmin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied');
    END IF;

    SELECT role INTO v_old_role FROM profiles WHERE id = user_id_input;

    -- Update Profile
    UPDATE profiles 
    SET 
        full_name = full_name_input,
        phone = phone_input,
        role = role_input,
        updated_at = now()
    WHERE id = user_id_input;

    -- If role changed, we might need to sync with auth.users metadata if used there
    -- (Assuming existing sync triggers handle this, or we rely on profile query)

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 3. AUDIT TRIGGER FOR STATUS CHANGES
-- ═══════════════════════════════════════════════════════════════
-- Ensure log_audit function exists (created in security_improvements.sql)

DROP TRIGGER IF EXISTS audit_profiles_insert_trigger ON profiles;
CREATE TRIGGER audit_profiles_insert_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit();

-- Note: UPDATE/DELETE trigger already added in security_improvements.sql

-- ═══════════════════════════════════════════════════════════════
-- INSTRUCTIONS
-- ═══════════════════════════════════════════════════════════════
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify 'status' column appears in Profiles table
