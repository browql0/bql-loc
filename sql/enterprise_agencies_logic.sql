-- Enterprise Agencies Business Logic (RPC)
-- 1. Function to Get Agencies with Advanced Filtering
CREATE OR REPLACE FUNCTION get_agencies_enterprise(
    search_term TEXT DEFAULT '',
    status_filter agency_status DEFAULT NULL,
    limit_val INT DEFAULT 10,
    offset_val INT DEFAULT 0
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
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        AND (search_term = '' OR a.name ILIKE '%' || search_term || '%')
        AND (status_filter IS NULL OR a.status = status_filter)
    ),
    counted_results AS (
        SELECT count(*) as total FROM filtered_agencies
    )
    SELECT 
        fa.id,
        fa.name,
        fa.status,
        p.full_name as owner_name,
        p.email as owner_email,
        p.phone as owner_phone,
        (SELECT count(*) FROM cars c WHERE c.agency_id = fa.id) as cars_count,
        (SELECT count(*) FROM profiles up WHERE up.agency_id = fa.id) as users_count,
        fa.last_activity,
        fa.created_at,
        cr.total as total_count
    FROM filtered_agencies fa
    LEFT JOIN profiles p ON p.agency_id = fa.id AND p.role = 'owner'
    CROSS JOIN counted_results cr
    ORDER BY fa.created_at DESC
    LIMIT limit_val
    OFFSET offset_val;
END;
$$;

-- 2. Function to Toggle Agency Status with Auditing
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
    -- 1. Security Check (Super Admin only)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Non autorisé';
    END IF;

    -- 2. Update Status
    UPDATE agencies 
    SET status = new_status, 
        last_activity = now()
    WHERE id = agency_id_input;

    -- 3. Log Action
    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'status_change', jsonb_build_object('new_status', new_status));

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Function to Soft Delete Agency with Safety Checks
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
    active_users_count INT;
BEGIN
    -- 1. Security Check
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Non autorisé';
    END IF;

    -- 2. Safety Check (Block if active users exist)
    SELECT count(*) INTO active_users_count FROM profiles WHERE agency_id = agency_id_input;
    
    -- 3. Perform Soft Delete
    UPDATE agencies 
    SET deleted_at = now(),
        status = 'suspended' 
    WHERE id = agency_id_input;

    -- 4. Log Action
    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'soft_delete', jsonb_build_object('users_wiped_count', active_users_count));

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Enterprise Agency Creation with Auditing
CREATE OR REPLACE FUNCTION create_agency_enterprise(
    agency_name_text TEXT,
    owner_name_text TEXT,
    owner_email_text TEXT,
    owner_phone_text TEXT,
    owner_password_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    result JSONB;
    new_agency_id UUID;
    admin_id UUID := auth.uid();
BEGIN
    -- Use the existing secure function for the core heavy lifting
    SELECT create_agency_with_owner(
        agency_name_text,
        owner_name_text,
        owner_email_text,
        owner_phone_text,
        owner_password_text
    ) INTO result;

    IF (result->>'success')::BOOLEAN THEN
        new_agency_id := (result->>'agency_id')::UUID;
        
        -- Set initial high-fidelity status
        UPDATE agencies SET status = 'active' WHERE id = new_agency_id;

        -- Log Enterprise Creation
        INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
        VALUES (admin_id, new_agency_id, 'create_agency', jsonb_build_object('name', agency_name_text, 'owner', owner_name_text));
    END IF;

    RETURN result;
END;
$$;
