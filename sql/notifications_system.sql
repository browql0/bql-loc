-- ═══════════════════════════════════════════════════════════════
-- 📬 SYSTÈME DE NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Description: Table et fonctions pour gérer les notifications en temps réel
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. TABLE NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    read BOOLEAN DEFAULT FALSE,
    link TEXT, -- Optional link to related resource
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. RLS POLICIES
-- ─────────────────────────────────────────────────────────────

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Utilisateur peut lire ses propres notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Utilisateur peut marquer ses notifications comme lues
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- SuperAdmin peut créer des notifications pour tous
DROP POLICY IF EXISTS "notifications_insert_superadmin" ON notifications;
CREATE POLICY "notifications_insert_superadmin" ON notifications
    FOR INSERT
    WITH CHECK (public.get_my_role() = 'superadmin');

-- Owner peut créer des notifications pour son agence
DROP POLICY IF EXISTS "notifications_insert_owner" ON notifications;
CREATE POLICY "notifications_insert_owner" ON notifications
    FOR INSERT
    WITH CHECK (
        public.get_my_role() = 'owner'
        AND agency_id = public.get_my_agency()
    );

-- ─────────────────────────────────────────────────────────────
-- 3. FONCTIONS HELPER
-- ─────────────────────────────────────────────────────────────

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_agency_id UUID DEFAULT NULL,
    p_link TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    INSERT INTO notifications (user_id, agency_id, title, message, type, link)
    VALUES (p_user_id, p_agency_id, p_title, p_message, p_type, p_link);
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Notification créée'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer comme lu
CREATE OR REPLACE FUNCTION public.mark_notification_read(
    p_notification_id UUID
)
RETURNS JSONB AS $$
BEGIN
    UPDATE notifications
    SET read = TRUE
    WHERE id = p_notification_id
    AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Notification non trouvée ou accès refusé'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Notification marquée comme lue'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer toutes comme lues
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET read = TRUE
    WHERE user_id = auth.uid()
    AND read = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'count', v_count,
        'message', v_count || ' notification(s) marquée(s) comme lue(s)'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 4. TRIGGERS AUTOMATIQUES
-- ─────────────────────────────────────────────────────────────

-- Trigger: Nouveau staff rejoint une agence
CREATE OR REPLACE FUNCTION public.notify_new_staff()
RETURNS TRIGGER AS $$
DECLARE
    v_agency_name TEXT;
    v_owner_id UUID;
    v_staff_name TEXT;
BEGIN
    IF NEW.role = 'staff' AND TG_OP = 'INSERT' THEN
        -- Récupérer le nom de l'agence et l'owner
        SELECT a.name INTO v_agency_name
        FROM agencies a
        WHERE a.id = NEW.agency_id;
        
        SELECT p.id INTO v_owner_id
        FROM profiles p
        WHERE p.agency_id = NEW.agency_id
        AND p.role = 'owner'
        LIMIT 1;
        
        -- Nom du staff
        v_staff_name := COALESCE(NEW.full_name, NEW.email);
        
        -- Créer notification pour l'owner
        IF v_owner_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, agency_id, title, message, type)
            VALUES (
                v_owner_id,
                NEW.agency_id,
                'Nouveau Staff',
                v_staff_name || ' a rejoint l''équipe de ' || v_agency_name,
                'success'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_staff ON profiles;
CREATE TRIGGER trigger_notify_new_staff
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_staff();

-- Trigger: Nouvelle réservation
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
    v_car_name TEXT;
    v_agency_users UUID[];
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Récupérer info client
        SELECT name INTO v_client_name
        FROM clients
        WHERE id = NEW.client_id;
        
        -- Récupérer info voiture
        SELECT brand || ' ' || model INTO v_car_name
        FROM cars
        WHERE id = NEW.car_id;
        
        -- Récupérer tous les users de l'agence (owner + staff)
        SELECT ARRAY_AGG(id) INTO v_agency_users
        FROM profiles
        WHERE agency_id = NEW.agency_id;
        
        -- Créer notification pour chaque user de l'agence
        INSERT INTO notifications (user_id, agency_id, title, message, type)
        SELECT 
            unnest(v_agency_users),
            NEW.agency_id,
            'Nouvelle Réservation',
            'Réservation de ' || COALESCE(v_client_name, 'Client') || ' pour ' || COALESCE(v_car_name, 'un véhicule'),
            'info';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_booking ON bookings;
CREATE TRIGGER trigger_notify_new_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_booking();

-- ─────────────────────────────────────────────────────────────
-- 5. DONNÉES DE DÉMO (Optionnel - à supprimer en production)
-- ─────────────────────────────────────────────────────────────

/*
-- Exemple: Créer une notification de test
SELECT public.create_notification(
    auth.uid(),
    'Bienvenue !',
    'Votre tableau de bord est maintenant configuré.',
    'success'
);
*/

-- ═══════════════════════════════════════════════════════════════
-- ✅ SYSTÈME DE NOTIFICATIONS PRÊT
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE notifications IS 'Notifications en temps réel pour les utilisateurs';
COMMENT ON FUNCTION public.create_notification IS 'Créer une notification pour un utilisateur';
COMMENT ON FUNCTION public.mark_notification_read IS 'Marquer une notification comme lue';
COMMENT ON FUNCTION public.mark_all_notifications_read IS 'Marquer toutes les notifications comme lues';
