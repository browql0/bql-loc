-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛡️ SYSTEME D'AUDIT V2 - UPGRADE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Date: 2026-01-18
-- Description: Refonte complète du système de logs pour SuperAdmin
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. SECURISATION DE LA TABLE AUDIT_LOGS
-- ═══════════════════════════════════════════════════════════════
-- S'assurer que la table existe avec la bonne structure
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id UUID,
    record_data JSONB, -- Différence old/new
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ajouter des index manquants pour la performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin ON audit_logs USING BRIN(created_at);

-- Sécurité RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ❌ AUCUNE POLICY DE MODIFICATION/SUPPRESSION (Immutable)
-- Seul le système (via triggers Security Definer) peut écrire.
-- Seul le SuperAdmin peut lire.

DROP POLICY IF EXISTS "audit_superadmin_read" ON audit_logs;
CREATE POLICY "audit_superadmin_read" ON audit_logs
    FOR SELECT
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    );

-- 2. FONCTION TRIGGER AMÉLIORÉE
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.log_audit_v2()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    current_user_role TEXT;
BEGIN
    -- Récupérer l'utilisateur actuel si possible, sinon système
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT email, role INTO current_user_email, current_user_role
        FROM profiles WHERE id = current_user_id;
    ELSE
        current_user_email := 'system@auto';
        current_user_role := 'system';
    END IF;

    INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        table_name,
        record_id,
        record_data
    ) VALUES (
        current_user_id,
        current_user_email,
        current_user_role,
        TG_OP,
        TG_TABLE_NAME,
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

-- 3. APPLICATION DES TRIGGERS (TOUTES LES TABLES CRITIQUES)
-- ═══════════════════════════════════════════════════════════════

-- Helper pour recréer proprement les triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('agencies', 'profiles', 'cars', 'clients', 'bookings')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger_v2 ON %I', t);
        EXECUTE format('CREATE TRIGGER audit_trigger_v2 AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION public.log_audit_v2()', t);
    END LOOP;
END $$;

-- 4. FONCTION DE RECUPERATION AVANCEE (RPC)
-- ═══════════════════════════════════════════════════════════════
-- Supporte: Recherche full-text, Date Range, Filtres, Pagination, Total Count

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
    -- 1. Vérification Sécurité (SuperAdmin Only)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Accès refusé. SuperAdmin uniquement.';
    END IF;

    v_offset := (page - 1) * page_size;

    -- 2. Calcul du nombre total (optimisé)
    SELECT COUNT(*)
    INTO v_total_count
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

    -- 3. Récupération des données
    SELECT jsonb_agg(t) INTO v_results
    FROM (
        SELECT 
            id,
            user_email,
            user_role,
            action,
            table_name,
            record_id,
            record_data,
            created_at
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

    -- 4. Retour Formaté
    RETURN jsonb_build_object(
        'data', COALESCE(v_results, '[]'::jsonb),
        'total_count', v_total_count,
        'page', page,
        'last_page', CEIL(v_total_count::NUMERIC / page_size)
    );
END;
$$;
