-- ========================================================
-- BQL RENT: AGENCY SECURITY PATCH
-- Production-Ready Security Hardening for Agency RPCs
-- This script adds Super Admin authorization to all agency
-- management functions and improves input validation.
-- ========================================================

-- ===========================================
-- 1. SECURE get_agencies_enterprise
-- Add Super Admin authorization check
-- ===========================================
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
    v_search TEXT := trim(coalesce(search_term, ''));
    v_limit INT := LEAST(GREATEST(coalesce(limit_val, 10), 1), 100);
    v_offset INT := GREATEST(coalesce(offset_val, 0), 0);
    v_sort_col TEXT := coalesce(sort_column, 'created_at');
    v_sort_dir TEXT := UPPER(coalesce(sort_direction, 'DESC'));
BEGIN
    -- SECURITY: Super Admin Authorization Check
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Accès non autorisé: Super Admin requis';
    END IF;

    -- Validate sort direction
    IF v_sort_dir NOT IN ('ASC', 'DESC') THEN
        v_sort_dir := 'DESC';
    END IF;

    -- Validate sort column to prevent SQL injection
    IF v_sort_col NOT IN ('name', 'created_at', 'status', 'last_activity') THEN
        v_sort_col := 'created_at';
    END IF;

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
        CASE WHEN v_sort_col = 'name' AND v_sort_dir = 'ASC' THEN cs.name END ASC,
        CASE WHEN v_sort_col = 'name' AND v_sort_dir = 'DESC' THEN cs.name END DESC,
        CASE WHEN v_sort_col = 'created_at' AND v_sort_dir = 'ASC' THEN cs.created_at END ASC,
        CASE WHEN v_sort_col = 'created_at' AND v_sort_dir = 'DESC' THEN cs.created_at END DESC,
        CASE WHEN v_sort_col = 'status' AND v_sort_dir = 'ASC' THEN cs.status::TEXT END ASC,
        CASE WHEN v_sort_col = 'status' AND v_sort_dir = 'DESC' THEN cs.status::TEXT END DESC
    LIMIT v_limit
    OFFSET v_offset;
END;
$$;


-- ===========================================
-- 2. SECURE create_agency_with_owner
-- Add Super Admin check, input validation, duplicate check
-- ===========================================
CREATE OR REPLACE FUNCTION create_agency_with_owner(
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
    new_agency_id UUID;
    new_user_id UUID;
    encrypted_pw TEXT;
    admin_id UUID := auth.uid();
    v_agency_name TEXT := trim(coalesce(agency_name_text, ''));
    v_owner_name TEXT := trim(coalesce(owner_name_text, ''));
    v_owner_email TEXT := lower(trim(coalesce(owner_email_text, '')));
    v_owner_phone TEXT := trim(coalesce(owner_phone_text, ''));
BEGIN
    -- 1. SECURITY: Super Admin Authorization Check
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès non autorisé: Super Admin requis.');
    END IF;

    -- 2. INPUT VALIDATION: Agency Name
    IF v_agency_name = '' OR char_length(v_agency_name) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le nom de l''agence doit contenir au moins 2 caractères.');
    END IF;
    IF char_length(v_agency_name) > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le nom de l''agence ne peut pas dépasser 100 caractères.');
    END IF;

    -- 3. INPUT VALIDATION: Owner Name
    IF v_owner_name = '' OR char_length(v_owner_name) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le nom du propriétaire doit contenir au moins 2 caractères.');
    END IF;

    -- 4. INPUT VALIDATION: Email Format
    IF v_owner_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Format d''email invalide.');
    END IF;

    -- 5. INPUT VALIDATION: Password Strength
    IF char_length(owner_password_text) < 8 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le mot de passe doit contenir au moins 8 caractères.');
    END IF;
    IF owner_password_text !~ '[A-Z]' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le mot de passe doit contenir au moins une majuscule.');
    END IF;
    IF owner_password_text !~ '[0-9]' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le mot de passe doit contenir au moins un chiffre.');
    END IF;

    -- 6. DUPLICATE CHECK: Agency Name
    IF EXISTS (SELECT 1 FROM agencies WHERE lower(trim(name)) = lower(v_agency_name) AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Une agence avec ce nom existe déjà.');
    END IF;

    -- 7. DUPLICATE CHECK: Email
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_owner_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cet email est déjà utilisé.');
    END IF;

    -- 8. Create Agency
    INSERT INTO agencies (name, status)
    VALUES (v_agency_name, 'active')
    RETURNING id INTO new_agency_id;

    -- 9. Create Auth User
    new_user_id := gen_random_uuid();
    encrypted_pw := crypt(owner_password_text, gen_salt('bf'));

    INSERT INTO auth.users (
        id,
        instance_id,
        email, 
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token
    )
    VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        v_owner_email,
        encrypted_pw,
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', v_owner_name, 'role', 'owner'),
        now(),
        now(),
        'authenticated',
        'authenticated',
        encode(gen_random_bytes(32), 'hex')
    );

    -- 10. Create Profile
    INSERT INTO profiles (id, role, agency_id, email, full_name, phone)
    VALUES (
        new_user_id,
        'owner',
        new_agency_id,
        v_owner_email,
        v_owner_name,
        v_owner_phone
    );

    -- 11. Create Identity
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', v_owner_email),
        'email',
        new_user_id::text,
        now(),
        now(),
        now()
    );

    -- 12. Audit Log
    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, new_agency_id, 'create_agency', jsonb_build_object(
        'agency_name', v_agency_name,
        'owner_name', v_owner_name,
        'owner_email', v_owner_email
    ));

    RETURN jsonb_build_object(
        'success', true,
        'agency_id', new_agency_id,
        'user_id', new_user_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ===========================================
-- 3. SECURE update_agency_details
-- Add Super Admin check, validation, and audit logging
-- ===========================================
CREATE OR REPLACE FUNCTION update_agency_details(
    agency_id_input UUID,
    agency_name_text TEXT,
    owner_name_text TEXT,
    owner_email_text TEXT,
    owner_phone_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id UUID := auth.uid();
    v_agency_name TEXT := trim(coalesce(agency_name_text, ''));
    v_owner_name TEXT := trim(coalesce(owner_name_text, ''));
    v_owner_email TEXT := lower(trim(coalesce(owner_email_text, '')));
    v_owner_phone TEXT := trim(coalesce(owner_phone_text, ''));
    v_owner_id UUID;
    v_old_agency_name TEXT;
BEGIN
    -- 1. SECURITY: Super Admin Authorization Check
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès non autorisé: Super Admin requis.');
    END IF;

    -- 2. Verify agency exists and is not deleted
    IF NOT EXISTS (SELECT 1 FROM agencies WHERE id = agency_id_input AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agence introuvable.');
    END IF;

    -- Get current agency name for audit
    SELECT name INTO v_old_agency_name FROM agencies WHERE id = agency_id_input;

    -- 3. INPUT VALIDATION
    IF v_agency_name = '' OR char_length(v_agency_name) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le nom de l''agence doit contenir au moins 2 caractères.');
    END IF;

    IF v_owner_name = '' OR char_length(v_owner_name) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Le nom du propriétaire doit contenir au moins 2 caractères.');
    END IF;

    IF v_owner_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Format d''email invalide.');
    END IF;

    -- 4. DUPLICATE CHECK: Agency Name (excluding current)
    IF EXISTS (
        SELECT 1 FROM agencies 
        WHERE lower(trim(name)) = lower(v_agency_name) 
        AND id != agency_id_input 
        AND deleted_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Une agence avec ce nom existe déjà.');
    END IF;

    -- 5. Get owner ID and check email uniqueness
    SELECT id INTO v_owner_id FROM profiles WHERE agency_id = agency_id_input AND role = 'owner' LIMIT 1;
    
    IF v_owner_id IS NOT NULL THEN
        -- Check if new email is already used by another user
        IF EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = v_owner_email 
            AND id != v_owner_id
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Cet email est déjà utilisé par un autre compte.');
        END IF;
    END IF;

    -- 6. Update Agency
    UPDATE agencies 
    SET name = v_agency_name,
        last_activity = now()
    WHERE id = agency_id_input;

    -- 7. Update Profile
    UPDATE profiles 
    SET 
        full_name = v_owner_name,
        email = v_owner_email,
        phone = v_owner_phone
    WHERE agency_id = agency_id_input AND role = 'owner';

    -- 8. Update Auth User email (important for login)
    IF v_owner_id IS NOT NULL THEN
        UPDATE auth.users 
        SET email = v_owner_email,
            raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', v_owner_name),
            updated_at = now()
        WHERE id = v_owner_id;

        -- Also update identity
        UPDATE auth.identities
        SET identity_data = identity_data || jsonb_build_object('email', v_owner_email),
            updated_at = now()
        WHERE user_id = v_owner_id;
    END IF;

    -- 9. Audit Log
    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'update_details', jsonb_build_object(
        'old_name', v_old_agency_name,
        'new_name', v_agency_name,
        'owner_name', v_owner_name,
        'owner_email', v_owner_email
    ));

    RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ===========================================
-- 4. SECURE set_agency_status (improved)
-- Better error handling and return format
-- ===========================================
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
    v_old_status agency_status;
BEGIN
    -- 1. SECURITY: Super Admin Authorization Check
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès non autorisé: Super Admin requis.');
    END IF;

    -- 2. Verify agency exists
    SELECT status INTO v_old_status FROM agencies WHERE id = agency_id_input AND deleted_at IS NULL;
    IF v_old_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agence introuvable.');
    END IF;

    -- 3. No change needed
    IF v_old_status = new_status THEN
        RETURN jsonb_build_object('success', true, 'message', 'Statut inchangé.');
    END IF;

    -- 4. Update Status
    UPDATE agencies 
    SET status = new_status, 
        last_activity = now()
    WHERE id = agency_id_input;

    -- 5. Audit Log
    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'status_change', jsonb_build_object(
        'old_status', v_old_status,
        'new_status', new_status
    ));

    RETURN jsonb_build_object('success', true, 'new_status', new_status);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ===========================================
-- 5. SECURE soft_delete_agency_enterprise (improved)  
-- Better error handling
-- ===========================================
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
    v_agency_name TEXT;
    v_users_count INT;
BEGIN
    -- 1. SECURITY: Super Admin Authorization Check
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès non autorisé: Super Admin requis.');
    END IF;

    -- 2. Verify agency exists and get name
    SELECT name INTO v_agency_name FROM agencies WHERE id = agency_id_input AND deleted_at IS NULL;
    IF v_agency_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agence introuvable ou déjà supprimée.');
    END IF;

    -- 3. Count affected users for audit
    SELECT count(*) INTO v_users_count FROM profiles WHERE agency_id = agency_id_input;

    -- 4. Perform Soft Delete
    UPDATE agencies 
    SET deleted_at = now(),
        status = 'suspended',
        last_activity = now()
    WHERE id = agency_id_input;

    -- 5. Audit Log
    INSERT INTO agency_audit_logs (super_admin_id, agency_id, action, details)
    VALUES (admin_id, agency_id_input, 'soft_delete', jsonb_build_object(
        'agency_name', v_agency_name,
        'affected_users', v_users_count,
        'timestamp', now()
    ));

    RETURN jsonb_build_object('success', true, 'message', 'Agence archivée avec succès.');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ===========================================
-- 6. Grant necessary permissions
-- ===========================================
GRANT EXECUTE ON FUNCTION get_agencies_enterprise TO authenticated;
GRANT EXECUTE ON FUNCTION create_agency_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION update_agency_details TO authenticated;
GRANT EXECUTE ON FUNCTION set_agency_status TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_agency_enterprise TO authenticated;

-- Note: Even though permissions are granted to 'authenticated',
-- each function checks internally that the caller is a superadmin.
