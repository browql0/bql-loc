-- Allow authenticated users to create a new agency
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."agencies" 
FOR INSERT 
TO "authenticated" 
WITH CHECK (true);

-- Allow authenticated users to create their own profile
CREATE POLICY "Enable insert for users based on user_id" 
ON "public"."profiles" 
FOR INSERT 
TO "authenticated" 
WITH CHECK ((select auth.uid()) = id);

-- Ensure they can select their own profile after creation (usually covered, but good to ensure)
CREATE POLICY "Enable select for users based on user_id" 
ON "public"."profiles" 
FOR SELECT 
TO "authenticated" 
USING ((select auth.uid()) = id);
