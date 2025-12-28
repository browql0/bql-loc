-- Add 'pending' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pending';

-- Update the RPC function to default to 'pending' or allow passing role
-- We will just recreate it to default new users to 'pending' instead of 'owner'

CREATE OR REPLACE FUNCTION create_agency_and_admin(
    agency_name_input TEXT,
    owner_name_input TEXT,
    owner_email_input TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_agency_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register an agency.';
    END IF;

    -- 1. Create the Agency
    INSERT INTO agencies (name)
    VALUES (agency_name_input)
    RETURNING id INTO new_agency_id;

    -- 2. Create the Owner Profile with 'pending' role
    INSERT INTO profiles (id, role, agency_id, email, full_name)
    VALUES (
        current_user_id, 
        'pending',  -- CHANGED FROM 'owner' TO 'pending'
        new_agency_id, 
        owner_email_input,
        owner_name_input
    );

    RETURN jsonb_build_object(
        'success', true, 
        'agency_id', new_agency_id,
        'profile_id', current_user_id
    );
END;
$$;
