-- 1. Create enum for roles (Safe version)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'staff');
    END IF;
END $$;
-- 2. Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 3. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'staff' NOT NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 4. Create cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    plate TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'available',
    price_per_day DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 5. Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 6. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    total_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 7. RLS (Row Level Security)
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 8. ANTI-RECURSION FUNCTIONS (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  -- This query runs as the creator (postgres) and ignores RLS, breaking the loop
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_agency()
RETURNS uuid AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 9. CLEANUP POLICIES
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Owners manage staff" ON profiles;
DROP POLICY IF EXISTS "Superadmin manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Superadmin manage agencies" ON agencies;
DROP POLICY IF EXISTS "Staff view agency" ON agencies;
DROP POLICY IF EXISTS "Agency manage cars" ON cars;
DROP POLICY IF EXISTS "Superadmin manage cars" ON cars;
DROP POLICY IF EXISTS "Agency manage clients" ON clients;
DROP POLICY IF EXISTS "Superadmin manage clients" ON clients;
DROP POLICY IF EXISTS "Agency manage bookings" ON bookings;
DROP POLICY IF EXISTS "Superadmin manage bookings" ON bookings;

-- 10. DEPLOY SAFE POLICIES
-- Profiles
CREATE POLICY "p_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "p_owner_manage" ON profiles FOR ALL USING (agency_id = public.get_my_agency() AND public.get_my_role() = 'owner');
CREATE POLICY "p_admin_all" ON profiles FOR ALL USING (public.get_my_role() = 'superadmin');

-- Agencies
CREATE POLICY "a_admin_all" ON agencies FOR ALL USING (public.get_my_role() = 'superadmin');
CREATE POLICY "a_staff_view" ON agencies FOR SELECT USING (id = public.get_my_agency());

-- Cars
CREATE POLICY "c_agency_manage" ON cars FOR ALL USING (agency_id = public.get_my_agency());
CREATE POLICY "c_admin_all" ON cars FOR ALL USING (public.get_my_role() = 'superadmin');

-- Clients
CREATE POLICY "cl_agency_manage" ON clients FOR ALL USING (agency_id = public.get_my_agency());
CREATE POLICY "cl_admin_all" ON clients FOR ALL USING (public.get_my_role() = 'superadmin');

-- Bookings
CREATE POLICY "b_agency_manage" ON bookings FOR ALL USING (agency_id = public.get_my_agency());
CREATE POLICY "b_admin_all" ON bookings FOR ALL USING (public.get_my_role() = 'superadmin');
