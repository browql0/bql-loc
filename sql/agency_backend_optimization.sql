-- Agency System: Senior Backend Optimization (RPC)
-- 1. Hardened Retrieval Function
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
    v_limit INT := LEAST(GREATEST(limit_val, 1), 100); -- Clamp between 1 and 100
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
    SELECT * FROM calculated_stats
    ORDER BY 
        CASE WHEN sort_column = 'name' AND sort_direction = 'ASC' THEN name END ASC,
        CASE WHEN sort_column = 'name' AND sort_direction = 'DESC' THEN name END DESC,
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'ASC' THEN created_at END ASC,
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'DESC' THEN created_at END DESC,
        CASE WHEN sort_column = 'status' AND sort_direction = 'ASC' THEN status::TEXT END ASC,
        CASE WHEN sort_column = 'status' AND sort_direction = 'DESC' THEN status::TEXT END DESC
    LIMIT v_limit
    OFFSET offset_val;
END;
$$;

-- 2. Secure Toggle with Explicit Failures
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
    -- 1. Security Check
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization failed: Super Admin required.');
    END IF;

    -- 2. Existence Check
    IF NOT EXISTS (SELECT 1 FROM agencies WHERE id = agency_id_input AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agency not found or archived.');
    END IF;

    -- 3. Update
    UPDATE agencies 
    SET status = new_status, 
        last_activity = now()
    WHERE id = agency_id_input;

    -- 4. Audit
    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'status_change', jsonb_build_object('new_status', new_status));

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
