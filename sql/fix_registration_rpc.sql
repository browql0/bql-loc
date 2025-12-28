-- 1. Add full_name to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- 2. Create a secure function to handle registration (Bypasses RLS)
CREATE OR REPLACE FUNCTION create_agency_and_admin(
    agency_name_input TEXT,
    owner_name_input TEXT,
    owner_email_input TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: This allows the function to bypass RLS policies
SET search_path = public
AS $$
DECLARE
    new_agency_id UUID;
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register an agency.';
    END IF;

    -- 1. Create the Agency
    INSERT INTO agencies (name)
    VALUES (agency_name_input)
    RETURNING id INTO new_agency_id;

    -- 2. Create the User Profile (without role - admin will assign it later)
    INSERT INTO profiles (id, role, agency_id, email, full_name)
    VALUES (
        current_user_id, 
        NULL, 
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
