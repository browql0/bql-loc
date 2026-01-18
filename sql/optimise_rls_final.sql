-- ═══════════════════════════════════════════════════════════════
-- 🚀 OPTIMISATION FINALE RLS (ZERO RECURSION)
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Description: 
-- 1. Syncronise role ET agency_id vers auth.users metadata
-- 2. Force get_my_role() et get_my_agency() à lire UNIQUEMENT le JWT
-- 3. Supprime tout accès base de données dans les fonctions RLS (Performance x100)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. TRIGGER DE SYNCHRONISATION (Role + Agency)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_profile_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Met à jour 'role' ET 'agency_id' dans les métadonnées
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', NEW.role,
            'agency_id', NEW.agency_id
        )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_sync_role ON profiles;
CREATE TRIGGER trigger_sync_role
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_to_metadata();

-- ─────────────────────────────────────────────────────────────
-- 2. GET_MY_ROLE (Lecture JWT Exclusive)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
DECLARE
    v_role text;
BEGIN
    -- LIRE UNIQUEMENT LE JWT (Aucune requête DB = Aucune récursion)
    v_role := (auth.jwt() -> 'user_metadata' ->> 'role');
    
    IF v_role IS NOT NULL THEN
        RETURN v_role::user_role;
    END IF;
    
    -- Valeur par défaut si pas de metadata (évite erreur)
    RETURN 'staff'::user_role; 
EXCEPTION WHEN OTHERS THEN
    RETURN 'staff'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. GET_MY_AGENCY (Lecture JWT Exclusive)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_agency()
RETURNS UUID AS $$
DECLARE
    v_agency text;
BEGIN
    -- LIRE UNIQUEMENT LE JWT
    v_agency := (auth.jwt() -> 'user_metadata' ->> 'agency_id');
    
    IF v_agency IS NOT NULL THEN
        RETURN v_agency::uuid;
    END IF;
    
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 4. MIGRATION MASSE (Force Update Maintenant)
-- ─────────────────────────────────────────────────────────────

-- Met à jour tous les utilisateurs existants avec role ET agency_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM profiles LOOP
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', r.role,
                'agency_id', r.agency_id
            )
        WHERE id = r.id;
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ✅ VERIFICATION
-- ═══════════════════════════════════════════════════════════════

SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE id = auth.uid();
