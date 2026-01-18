-- ═══════════════════════════════════════════════════════════════
-- 📅 SYSTÈME DE RÉSERVATIONS - AMÉLIORATIONS
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Description: Amélioration de la table bookings et ajout de fonctionnalités
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. AJOUT DE COLONNES MANQUANTES
-- ─────────────────────────────────────────────────────────────

-- Ajouter des colonnes pour un workflow complet
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS status_reason TEXT,
ADD COLUMN IF NOT EXISTS check_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS check_out_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Créer un type ENUM pour les statuts de réservation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM (
            'pending',      -- En attente de confirmation
            'confirmed',    -- Confirmée
            'in_progress',  -- En cours (voiture prise)
            'completed',    -- Terminée (voiture rendue)
            'cancelled'     -- Annulée
        );
    END IF;
END $$;

-- Créer un type ENUM pour les statuts de paiement
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending',      -- En attente
            'partial',      -- Partiel (acompte)
            'paid',         -- Payé
            'refunded'      -- Remboursé
        );
    END IF;
END $$;

-- Modifier la colonne status pour utiliser l'ENUM (si ce n'est pas déjà fait)
-- Note: Cette opération peut échouer si des données existent. À adapter selon vos besoins.
ALTER TABLE bookings 
ALTER COLUMN status TYPE booking_status USING status::booking_status;

ALTER TABLE bookings 
ALTER COLUMN payment_status TYPE payment_status USING payment_status::payment_status;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings(created_by);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 2. FONCTIONS RPC POUR GESTION DES RÉSERVATIONS
-- ─────────────────────────────────────────────────────────────

-- Fonction pour obtenir les réservations avec détails complets
CREATE OR REPLACE FUNCTION public.get_bookings_with_details(
    p_agency_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    agency_id UUID,
    car_id UUID,
    client_id UUID,
    start_date DATE,
    end_date DATE,
    status booking_status,
    status_reason TEXT,
    total_price DECIMAL,
    deposit_amount DECIMAL,
    payment_status payment_status,
    check_in_date TIMESTAMP WITH TIME ZONE,
    check_out_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    car_brand TEXT,
    car_model TEXT,
    car_plate TEXT,
    client_name TEXT,
    client_phone TEXT,
    client_email TEXT,
    agency_name TEXT,
    days_count INT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.agency_id,
        b.car_id,
        b.client_id,
        b.start_date,
        b.end_date,
        b.status,
        b.status_reason,
        b.total_price,
        b.deposit_amount,
        b.payment_status,
        b.check_in_date,
        b.check_out_date,
        b.notes,
        b.created_at,
        c.brand as car_brand,
        c.model as car_model,
        c.plate as car_plate,
        cl.name as client_name,
        cl.phone as client_phone,
        cl.email as client_email,
        a.name as agency_name,
        (b.end_date - b.start_date)::INT as days_count,
        (b.status IN ('confirmed', 'in_progress')) as is_active
    FROM bookings b
    INNER JOIN cars c ON b.car_id = c.id
    INNER JOIN clients cl ON b.client_id = cl.id
    INNER JOIN agencies a ON b.agency_id = a.id
    WHERE 
        (p_agency_id IS NULL OR b.agency_id = p_agency_id)
        AND (p_status IS NULL OR b.status::TEXT = p_status)
    ORDER BY b.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour changer le statut d'une réservation
CREATE OR REPLACE FUNCTION public.update_booking_status(
    p_booking_id UUID,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_user_role user_role;
    v_user_agency UUID;
BEGIN
    -- Récupérer le rôle et l'agence de l'utilisateur
    v_user_role := public.get_my_role();
    v_user_agency := public.get_my_agency();
    
    -- Vérifier que la réservation existe et que l'utilisateur a accès
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Réservation introuvable'
        );
    END IF;
    
    -- Vérifier les permissions
    IF v_user_role != 'superadmin' AND v_booking.agency_id != v_user_agency THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Vous n''avez pas accès à cette réservation'
        );
    END IF;
    
    -- Mettre à jour le statut
    UPDATE bookings
    SET 
        status = p_new_status::booking_status,
        status_reason = COALESCE(p_reason, status_reason),
        check_in_date = CASE 
            WHEN p_new_status = 'in_progress' AND check_in_date IS NULL 
            THEN timezone('utc'::text, now())
            ELSE check_in_date
        END,
        check_out_date = CASE 
            WHEN p_new_status = 'completed' AND check_out_date IS NULL 
            THEN timezone('utc'::text, now())
            ELSE check_out_date
        END
    WHERE id = p_booking_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Statut mis à jour avec succès',
        'new_status', p_new_status
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier la disponibilité d'une voiture
CREATE OR REPLACE FUNCTION public.check_car_availability(
    p_car_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_conflict_count INT;
BEGIN
    -- Compter les réservations en conflit
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE car_id = p_car_id
    AND status IN ('confirmed', 'in_progress')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
        (start_date <= p_end_date AND end_date >= p_start_date)
    );
    
    IF v_conflict_count > 0 THEN
        RETURN jsonb_build_object(
            'available', false,
            'message', 'La voiture est déjà réservée pour ces dates',
            'conflicts', v_conflict_count
        );
    ELSE
        RETURN jsonb_build_object(
            'available', true,
            'message', 'La voiture est disponible'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. TRIGGER NOTIFICATION POUR CHANGEMENT DE STATUT
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
    v_car_name TEXT;
    v_agency_users UUID[];
    v_status_label TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Récupérer les infos
        SELECT name INTO v_client_name FROM clients WHERE id = NEW.client_id;
        SELECT brand || ' ' || model INTO v_car_name FROM cars WHERE id = NEW.car_id;
        
        -- Label du statut
        v_status_label := CASE NEW.status
            WHEN 'pending' THEN 'en attente'
            WHEN 'confirmed' THEN 'confirmée'
            WHEN 'in_progress' THEN 'en cours'
            WHEN 'completed' THEN 'terminée'
            WHEN 'cancelled' THEN 'annulée'
            ELSE NEW.status::TEXT
        END;
        
        -- Récupérer les users de l'agence
        SELECT ARRAY_AGG(id) INTO v_agency_users
        FROM profiles
        WHERE agency_id = NEW.agency_id
        AND role IN ('owner', 'staff');
        
        -- Créer notification
        INSERT INTO notifications (user_id, agency_id, title, message, type)
        SELECT 
            unnest(v_agency_users),
            NEW.agency_id,
            'Réservation ' || v_status_label,
            'La réservation de ' || COALESCE(v_client_name, 'Client') || 
            ' pour ' || COALESCE(v_car_name, 'véhicule') || 
            ' est maintenant ' || v_status_label,
            CASE NEW.status
                WHEN 'confirmed' THEN 'success'
                WHEN 'completed' THEN 'success'
                WHEN 'cancelled' THEN 'warning'
                ELSE 'info'
            END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_booking_status ON bookings;
CREATE TRIGGER trigger_notify_booking_status
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_status_change();

-- ═══════════════════════════════════════════════════════════════
-- ✅ SYSTÈME DE RÉSERVATIONS AMÉLIORÉ
-- ═══════════════════════════════════════════════════════════════

COMMENT ON FUNCTION public.get_bookings_with_details IS 'Récupère les réservations avec tous les détails (voiture, client, agence)';
COMMENT ON FUNCTION public.update_booking_status IS 'Met à jour le statut d''une réservation avec vérification des permissions';
COMMENT ON FUNCTION public.check_car_availability IS 'Vérifie si une voiture est disponible pour des dates données';
