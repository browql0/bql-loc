-- Add RLS policy to allow users to read their own profile
-- This fixes the 406 error when checking role status

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
