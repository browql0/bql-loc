-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔒 AMÉLIORATION SÉCURITÉ - BQL LOCATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Date: 2026-01-17
-- Description: Renforcement des RLS policies et création d'un système d'audit
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════════════════
-- 1. TABLE AUDIT LOGS (Traçabilité des actions sensibles)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role user_role,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL, -- 'agencies', 'profiles', 'cars', etc.
    record_id UUID,
    record_data JSONB, -- Données avant/après modification
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS pour audit_logs (seul SuperAdmin peut lire)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_superadmin_read" ON audit_logs;
CREATE POLICY "audit_superadmin_read" ON audit_logs
    FOR SELECT
    USING (public.get_my_role() = 'superadmin');

-- Fonction pour enregistrer les audits automatiquement
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        table_name,
        record_id,
        record_data
    ) VALUES (
        auth.uid(),
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        public.get_my_role(),
        TG_OP, -- 'INSERT', 'UPDATE', 'DELETE'
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            ELSE jsonb_build_object('new', to_jsonb(NEW))
        END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- 2. AMÉLIORATION DES RLS POLICIES (Plus Restrictives)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- A. PROFILES - Séparer les opérations
-- ─────────────────────────────────────────────────────────────

-- Supprimer les anciennes policies trop permissives
DROP POLICY IF EXISTS "p_select_own" ON profiles;
DROP POLICY IF EXISTS "p_owner_manage" ON profiles;
DROP POLICY IF EXISTS "p_admin_all" ON profiles;

-- ✅ NOUVELLE POLICY: Lecture de son propre profil
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- ✅ NOUVELLE POLICY: SuperAdmin peut tout lire
CREATE POLICY "profiles_select_superadmin" ON profiles
    FOR SELECT
    USING (public.get_my_role() = 'superadmin');

-- ✅ NOUVELLE POLICY: Owner peut lire les profils de son agence
CREATE POLICY "profiles_select_owner_agency" ON profiles
    FOR SELECT
    USING (
        public.get_my_role() = 'owner' 
        AND agency_id = public.get_my_agency()
    );

-- ✅ NOUVELLE POLICY: Owner peut créer du staff dans son agence
CREATE POLICY "profiles_insert_owner_staff" ON profiles
    FOR INSERT
    WITH CHECK (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
        AND role = 'staff' -- ❌ Ne peut PAS créer d'autres owners
    );

-- ✅ NOUVELLE POLICY: SuperAdmin peut tout créer
CREATE POLICY "profiles_insert_superadmin" ON profiles
    FOR INSERT
    WITH CHECK (public.get_my_role() = 'superadmin');

-- ✅ NOUVELLE POLICY: Owner peut modifier staff de son agence (MAIS PAS LE RÔLE)
CREATE POLICY "profiles_update_owner_staff" ON profiles
    FOR UPDATE
    USING (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
        AND role = 'staff'
    )
    WITH CHECK (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
        AND role = 'staff' -- ❌ Empêche l'escalade de privilège
    );

-- ✅ NOUVELLE POLICY: SuperAdmin peut tout modifier
CREATE POLICY "profiles_update_superadmin" ON profiles
    FOR UPDATE
    USING (public.get_my_role() = 'superadmin')
    WITH CHECK (public.get_my_role() = 'superadmin');

-- ✅ NOUVELLE POLICY: Owner peut supprimer staff de son agence
CREATE POLICY "profiles_delete_owner_staff" ON profiles
    FOR DELETE
    USING (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
        AND role = 'staff'
    );

-- ✅ NOUVELLE POLICY: SuperAdmin peut tout supprimer
CREATE POLICY "profiles_delete_superadmin" ON profiles
    FOR DELETE
    USING (public.get_my_role() = 'superadmin');

-- ─────────────────────────────────────────────────────────────
-- B. AGENCIES - Séparer les opérations
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "a_admin_all" ON agencies;
DROP POLICY IF EXISTS "a_staff_view" ON agencies;

-- ✅ SuperAdmin: Tout lire
CREATE POLICY "agencies_select_superadmin" ON agencies
    FOR SELECT
    USING (public.get_my_role() = 'superadmin');

-- ✅ Owner/Staff: Lire son agence uniquement
CREATE POLICY "agencies_select_own" ON agencies
    FOR SELECT
    USING (id = public.get_my_agency());

-- ✅ SuperAdmin: Créer des agences
CREATE POLICY "agencies_insert_superadmin" ON agencies
    FOR INSERT
    WITH CHECK (public.get_my_role() = 'superadmin');

-- ✅ SuperAdmin: Modifier des agences
CREATE POLICY "agencies_update_superadmin" ON agencies
    FOR UPDATE
    USING (public.get_my_role() = 'superadmin')
    WITH CHECK (public.get_my_role() = 'superadmin');

-- ✅ SuperAdmin: Supprimer des agences
CREATE POLICY "agencies_delete_superadmin" ON agencies
    FOR DELETE
    USING (public.get_my_role() = 'superadmin');

-- ─────────────────────────────────────────────────────────────
-- C. CARS - Lecture seule pour Staff
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "c_agency_manage" ON cars;
DROP POLICY IF EXISTS "c_admin_all" ON cars;

-- ✅ SuperAdmin: Tout
CREATE POLICY "cars_all_superadmin" ON cars
    FOR ALL
    USING (public.get_my_role() = 'superadmin')
    WITH CHECK (public.get_my_role() = 'superadmin');

-- ✅ Owner: Gérer voitures de son agence
CREATE POLICY "cars_all_owner" ON cars
    FOR ALL
    USING (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
    )
    WITH CHECK (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
    );

-- ✅ Staff: LECTURE SEULE des voitures de son agence
CREATE POLICY "cars_select_staff" ON cars
    FOR SELECT
    USING (
        public.get_my_role() = 'staff'
        AND agency_id = public.get_my_agency()
    );

-- ─────────────────────────────────────────────────────────────
-- D. CLIENTS - Lecture seule pour Staff
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cl_agency_manage" ON clients;
DROP POLICY IF EXISTS "cl_admin_all" ON clients;

-- ✅ SuperAdmin: Tout
CREATE POLICY "clients_all_superadmin" ON clients
    FOR ALL
    USING (public.get_my_role() = 'superadmin')
    WITH CHECK (public.get_my_role() = 'superadmin');

-- ✅ Owner: Gérer clients de son agence
CREATE POLICY "clients_all_owner" ON clients
    FOR ALL
    USING (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
    )
    WITH CHECK (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
    );

-- ✅ Staff: Gérer clients de son agence (création autorisée)
CREATE POLICY "clients_all_staff" ON clients
    FOR ALL
    USING (
        public.get_my_role() = 'staff'
        AND agency_id = public.get_my_agency()
    )
    WITH CHECK (
        public.get_my_role() = 'staff'
        AND agency_id = public.get_my_agency()
    );

-- ─────────────────────────────────────────────────────────────
-- E. BOOKINGS - Tous les rôles peuvent gérer
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "b_agency_manage" ON bookings;
DROP POLICY IF EXISTS "b_admin_all" ON bookings;

-- ✅ SuperAdmin: Tout
CREATE POLICY "bookings_all_superadmin" ON bookings
    FOR ALL
    USING (public.get_my_role() = 'superadmin')
    WITH CHECK (public.get_my_role() = 'superadmin');

-- ✅ Owner + Staff: Gérer réservations de leur agence
CREATE POLICY "bookings_all_agency" ON bookings
    FOR ALL
    USING (
        public.get_my_role() IN ('owner', 'staff')
        AND agency_id = public.get_my_agency()
    )
    WITH CHECK (
        public.get_my_role() IN ('owner', 'staff')
        AND agency_id = public.get_my_agency()
    );

-- ═══════════════════════════════════════════════════════════════
-- 3. TRIGGERS AUDIT (Enregistrer les actions sensibles)
-- ═══════════════════════════════════════════════════════════════

-- Audit sur agencies (création, modification, suppression)
DROP TRIGGER IF EXISTS audit_agencies_trigger ON agencies;
CREATE TRIGGER audit_agencies_trigger
    AFTER INSERT OR UPDATE OR DELETE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit();

-- Audit sur profiles (seulement modification et suppression)
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
    AFTER UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit();

-- ═══════════════════════════════════════════════════════════════
-- 4. FONCTION RPC POUR SUPPRIMER UNE AGENCE (Sécurisée)
-- ═══════════════════════════════════════════════════════════════

-- Recréer avec meilleure gestion d'erreur
CREATE OR REPLACE FUNCTION public.delete_agency(agency_id_input UUID)
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
BEGIN
    -- Vérifier que l'utilisateur est SuperAdmin
    SELECT public.get_my_role() INTO v_role;
    
    IF v_role != 'superadmin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Seul le SuperAdmin peut supprimer des agences'
        );
    END IF;

    -- Vérifier que l'agence existe
    IF NOT EXISTS (SELECT 1 FROM agencies WHERE id = agency_id_input) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Agence introuvable'
        );
    END IF;

    -- Supprimer l'agence (CASCADE supprimera aussi cars, clients, bookings, profiles)
    DELETE FROM agencies WHERE id = agency_id_input;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Agence supprimée avec succès'
    );
EXCEPTION
    WHEN foreign_key_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Impossible de supprimer : des données liées existent encore'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur interne: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- 5. FONCTION POUR OBTENIR LES LOGS D'AUDIT
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_audit_logs(
    limit_count INT DEFAULT 100,
    offset_count INT DEFAULT 0,
    filter_table TEXT DEFAULT NULL,
    filter_action TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_email TEXT,
    user_role user_role,
    action TEXT,
    table_name TEXT,
    record_id UUID,
    record_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Vérifier que l'utilisateur est SuperAdmin
    IF public.get_my_role() != 'superadmin' THEN
        RAISE EXCEPTION 'Accès refusé: seul le SuperAdmin peut consulter les logs';
    END IF;

    RETURN QUERY
    SELECT 
        al.id,
        al.user_email,
        al.user_role,
        al.action,
        al.table_name,
        al.record_id,
        al.record_data,
        al.created_at
    FROM audit_logs al
    WHERE 
        (filter_table IS NULL OR al.table_name = filter_table)
        AND (filter_action IS NULL OR al.action = filter_action)
    ORDER BY al.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════

-- Pour appliquer ce script:
-- 1. Ouvrir Supabase Dashboard → SQL Editor
-- 2. Coller ce script
-- 3. Exécuter

COMMENT ON TABLE audit_logs IS 'Logs d''audit pour tracer toutes les actions sensibles';
COMMENT ON FUNCTION public.log_audit() IS 'Fonction trigger pour enregistrer automatiquement les audits';
COMMENT ON FUNCTION public.delete_agency(UUID) IS 'Fonction sécurisée pour supprimer une agence (SuperAdmin uniquement)';
COMMENT ON FUNCTION public.get_audit_logs(INT, INT, TEXT, TEXT) IS 'Fonction pour récupérer les logs d''audit avec filtres';
