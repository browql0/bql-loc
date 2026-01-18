-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛡️ SYSTEME D'AUDIT V2 - RETRY (DEADLOCK FIX)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Date: 2026-01-18
-- Description: Version sans boucle PL/pgSQL pour éviter les deadlocks
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. SECURISATION DE LA TABLE AUDIT_LOGS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    record_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin ON audit_logs USING BRIN(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_superadmin_read" ON audit_logs;
CREATE POLICY "audit_superadmin_read" ON audit_logs
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin');

-- 2. FONCTION TRIGGER LOGIC
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.log_audit_v2()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    current_user_role TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT email, role INTO current_user_email, current_user_role
        FROM profiles WHERE id = current_user_id;
    ELSE
        current_user_email := 'system@auto';
        current_user_role := 'system';
    END IF;

    INSERT INTO audit_logs (
        user_id, user_email, user_role, action, table_name, record_id, record_data
    ) VALUES (
        current_user_id, current_user_email, current_user_role, TG_OP, TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGERS (INDIVIDUELS POUR EVITER DEADLOCK)
-- ═══════════════════════════════════════════════════════════════

-- A. AGENCIES
DROP TRIGGER IF EXISTS audit_trigger_v2 ON agencies;
CREATE TRIGGER audit_trigger_v2 
AFTER INSERT OR UPDATE OR DELETE ON agencies 
FOR EACH ROW EXECUTE FUNCTION public.log_audit_v2();

-- B. PROFILES
DROP TRIGGER IF EXISTS audit_trigger_v2 ON profiles;
CREATE TRIGGER audit_trigger_v2 
AFTER INSERT OR UPDATE OR DELETE ON profiles 
FOR EACH ROW EXECUTE FUNCTION public.log_audit_v2();

-- C. CARS
DROP TRIGGER IF EXISTS audit_trigger_v2 ON cars;
CREATE TRIGGER audit_trigger_v2 
AFTER INSERT OR UPDATE OR DELETE ON cars 
FOR EACH ROW EXECUTE FUNCTION public.log_audit_v2();

-- D. CLIENTS
DROP TRIGGER IF EXISTS audit_trigger_v2 ON clients;
CREATE TRIGGER audit_trigger_v2 
AFTER INSERT OR UPDATE OR DELETE ON clients 
FOR EACH ROW EXECUTE FUNCTION public.log_audit_v2();

-- E. BOOKINGS
DROP TRIGGER IF EXISTS audit_trigger_v2 ON bookings;
CREATE TRIGGER audit_trigger_v2 
AFTER INSERT OR UPDATE OR DELETE ON bookings 
FOR EACH ROW EXECUTE FUNCTION public.log_audit_v2();

-- 4. FONCTION RPC (GET AUDIT LOGS)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_audit_logs_v2(
    search_query TEXT DEFAULT '',
    filter_table TEXT DEFAULT NULL,
    filter_action TEXT DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    page INT DEFAULT 1,
    page_size INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_count BIGINT;
    v_results JSONB;
    v_offset INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Accès refusé. SuperAdmin uniquement.';
    END IF;

    v_offset := (page - 1) * page_size;

    -- Count
    SELECT COUNT(*) INTO v_total_count
    FROM audit_logs
    WHERE
        (search_query = '' OR (
            user_email ILIKE '%' || search_query || '%' OR
            record_id::text ILIKE '%' || search_query || '%' OR
            table_name ILIKE '%' || search_query || '%'
        ))
        AND (filter_table IS NULL OR table_name = filter_table)
        AND (filter_action IS NULL OR action = filter_action)
        AND (start_date IS NULL OR created_at >= start_date)
        AND (end_date IS NULL OR created_at <= end_date);

    -- Data
    SELECT jsonb_agg(t) INTO v_results
    FROM (
        SELECT id, user_email, user_role, action, table_name, record_id, record_data, created_at
        FROM audit_logs
        WHERE
            (search_query = '' OR (
                user_email ILIKE '%' || search_query || '%' OR
                record_id::text ILIKE '%' || search_query || '%' OR
                table_name ILIKE '%' || search_query || '%'
            ))
            AND (filter_table IS NULL OR table_name = filter_table)
            AND (filter_action IS NULL OR action = filter_action)
            AND (start_date IS NULL OR created_at >= start_date)
            AND (end_date IS NULL OR created_at <= end_date)
        ORDER BY created_at DESC
        LIMIT page_size
        OFFSET v_offset
    ) t;

    RETURN jsonb_build_object(
        'data', COALESCE(v_results, '[]'::jsonb),
        'total_count', v_total_count,
        'page', page,
        'last_page', CEIL(v_total_count::NUMERIC / page_size)
    );
END;
$$;
