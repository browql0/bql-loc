-- ═══════════════════════════════════════════════════════════════
-- 🛠️ FIX AUTH & RECURSION - BQL LOCATION
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Description: 
-- 1. Syncronise le rôle vers auth.users (évite les requêtes bloquantes)
-- 2. Optimise get_my_role() pour éviter la récursion RLS
-- 3. Force la mise à jour des métadonnées pour les utilisateurs existants
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. FONCTION DE SYNCHRONISATION (Profile -> Auth Metadata)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_profile_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Met à jour les métadonnées de l'utilisateur dans auth.users
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour la mise à jour automatique
DROP TRIGGER IF EXISTS trigger_sync_role ON profiles;
CREATE TRIGGER trigger_sync_role
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_role_to_metadata();

-- ─────────────────────────────────────────────────────────────
-- 2. OPTIMISATION DE GET_MY_ROLE (Anti-Récursion)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
DECLARE
    v_role text;
BEGIN
    -- 1. Essayer de lire depuis le JWT (Rapide, pas de query)
    v_role := (auth.jwt() -> 'user_metadata' ->> 'role');
    
    -- 2. Si pas dans le JWT, lire la table (Fallback sécurisé)
    -- SECURITY DEFINER garantit que RLS est contourné ici pour éviter la récursion
    IF v_role IS NULL THEN
        SELECT role::text INTO v_role 
        FROM profiles 
        WHERE id = auth.uid();
    END IF;
    
    -- Cast vers l'ENUM user_role
    IF v_role IS NOT NULL THEN
        RETURN v_role::user_role;
    END IF;
    
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur de cast ou autre
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. FORCER LA SYNCHRO MAINTENANT
-- ─────────────────────────────────────────────────────────────

-- Met à jour tous les utilisateurs existants
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM profiles LOOP
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', r.role)
        WHERE id = r.id;
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ✅ VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Vérifier que votre user a bien le rôle dans metadata
SELECT id, email, raw_user_meta_data->>'role' as metadata_role 
FROM auth.users 
WHERE id = auth.uid();
