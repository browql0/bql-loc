-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🗑️ USER DELETION RPC - SUPER ADMIN
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Date: 2026-01-18
-- Description: RPC to securely delete a user from auth.users and public.profiles

-- Create RPC to Delete User (Hard Delete)
CREATE OR REPLACE FUNCTION delete_user_admin(user_id_input UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Security Check: Only SuperAdmin can delete users
    IF public.get_my_role() != 'superadmin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: SuperAdmin only');
    END IF;

    -- 2. Prevent self-deletion
    IF user_id_input = auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot delete your own account');
    END IF;

    -- 3. Delete from auth.users
    -- This will cascade to profiles and identities if foreign keys are standard.
    -- If not, we might need to delete from profiles first manually, but usually auth.users is the source of truth.
    DELETE FROM auth.users WHERE id = user_id_input;

    -- If the delete was successful (row count > 0), return success
    IF FOUND THEN
         RETURN jsonb_build_object('success', true);
    ELSE
         RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
