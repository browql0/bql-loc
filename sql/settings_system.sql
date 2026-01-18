-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 SYSTEM SETTINGS - Enterprise Configuration Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Date: 2026-01-19
-- Description: Complete settings system with RLS, RPCs, and audit logging
-- Super Admin only access - enterprise-grade security
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════════════════
-- 1. SYSTEM SETTINGS TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('system', 'security', 'notifications', 'integrations')),
    label TEXT NOT NULL,
    description TEXT,
    data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'email', 'json')),
    is_sensitive BOOLEAN DEFAULT false,
    is_critical BOOLEAN DEFAULT false, -- Requires confirmation modal
    validation_rules JSONB, -- { min, max, pattern, required }
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Comments for documentation
COMMENT ON TABLE system_settings IS 'Global system configuration - SuperAdmin only';
COMMENT ON COLUMN system_settings.is_sensitive IS 'If true, value is masked in API responses';
COMMENT ON COLUMN system_settings.is_critical IS 'If true, requires confirmation modal to change';

-- ═══════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY (SuperAdmin Only)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "settings_superadmin_select" ON system_settings;
DROP POLICY IF EXISTS "settings_superadmin_insert" ON system_settings;
DROP POLICY IF EXISTS "settings_superadmin_update" ON system_settings;
DROP POLICY IF EXISTS "settings_superadmin_delete" ON system_settings;

-- SuperAdmin can read all settings
CREATE POLICY "settings_superadmin_select" ON system_settings
    FOR SELECT
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    );

-- SuperAdmin can insert (for initialization)
CREATE POLICY "settings_superadmin_insert" ON system_settings
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    );

-- SuperAdmin can update
CREATE POLICY "settings_superadmin_update" ON system_settings
    FOR UPDATE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    )
    WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    );

-- SuperAdmin can delete (careful - for cleanup only)
CREATE POLICY "settings_superadmin_delete" ON system_settings
    FOR DELETE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
    );

-- ═══════════════════════════════════════════════════════════════
-- 3. DEFAULT SETTINGS DATA
-- ═══════════════════════════════════════════════════════════════

INSERT INTO system_settings (key, value, category, label, description, data_type, is_sensitive, is_critical, validation_rules) 
VALUES
    -- SYSTEM SETTINGS
    ('site_name', '"BQL Rent Systems"', 'system', 'Nom du site', 'Nom affiché sur la plateforme', 'string', false, false, '{"required": true, "maxLength": 100}'),
    ('site_email', '"contact@bql.com"', 'system', 'Email de contact', 'Email principal de la plateforme', 'email', false, false, '{"required": true, "maxLength": 255}'),
    ('max_agencies', '100', 'system', 'Nombre maximum d''agences', 'Limite du nombre d''agences autorisées', 'number', false, false, '{"min": 1, "max": 1000}'),
    ('allow_registrations', 'true', 'system', 'Autoriser les inscriptions', 'Permettre les nouvelles inscriptions sur la plateforme', 'boolean', false, true, null),
    
    -- SECURITY SETTINGS
    ('maintenance_mode', 'false', 'security', 'Mode maintenance', 'Désactive l''accès public pendant la maintenance', 'boolean', false, true, null),
    ('session_timeout', '30', 'security', 'Timeout de session (minutes)', 'Durée d''inactivité avant déconnexion automatique', 'number', false, true, '{"min": 5, "max": 480}'),
    ('force_2fa', 'false', 'security', 'Forcer 2FA', 'Exiger l''authentification à deux facteurs pour tous les utilisateurs', 'boolean', false, true, null),
    ('password_min_length', '8', 'security', 'Longueur minimale mot de passe', 'Nombre minimum de caractères requis', 'number', false, false, '{"min": 6, "max": 32}'),
    
    -- NOTIFICATION SETTINGS
    ('email_notifications', 'true', 'notifications', 'Notifications par email', 'Activer l''envoi d''emails automatiques', 'boolean', false, false, null),
    ('notify_new_agency', 'true', 'notifications', 'Notifier nouvelles agences', 'Email lors de la création d''une nouvelle agence', 'boolean', false, false, null),
    ('notify_new_user', 'true', 'notifications', 'Notifier nouveaux utilisateurs', 'Email lors de l''inscription d''un nouvel utilisateur', 'boolean', false, false, null),
    
    -- INTEGRATION SETTINGS  
    ('api_rate_limit', '1000', 'integrations', 'Limite API (req/heure)', 'Nombre maximum de requêtes API par heure', 'number', false, false, '{"min": 100, "max": 10000}'),
    ('webhook_url', '""', 'integrations', 'URL Webhook', 'URL pour les notifications webhook', 'string', true, false, '{"maxLength": 500}'),
    ('external_api_key', '""', 'integrations', 'Clé API externe', 'Clé pour les intégrations externes', 'string', true, false, '{"maxLength": 255}')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 4. SECURE RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- GET ALL SETTINGS (with sensitive value masking)
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Security check: SuperAdmin only
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Accès refusé. SuperAdmin uniquement.';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'key', s.key,
            'value', CASE WHEN s.is_sensitive THEN '"********"'::jsonb ELSE s.value END,
            'category', s.category,
            'label', s.label,
            'description', s.description,
            'data_type', s.data_type,
            'is_sensitive', s.is_sensitive,
            'is_critical', s.is_critical,
            'validation_rules', s.validation_rules,
            'updated_at', s.updated_at
        ) ORDER BY 
            CASE s.category 
                WHEN 'system' THEN 1 
                WHEN 'security' THEN 2 
                WHEN 'notifications' THEN 3 
                WHEN 'integrations' THEN 4 
            END,
            s.created_at
    )
    INTO v_result
    FROM system_settings s;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- GET SETTINGS BY CATEGORY
CREATE OR REPLACE FUNCTION get_settings_by_category(p_category TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Security check: SuperAdmin only
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Accès refusé. SuperAdmin uniquement.';
    END IF;

    -- Validate category
    IF p_category NOT IN ('system', 'security', 'notifications', 'integrations') THEN
        RAISE EXCEPTION 'Catégorie invalide: %', p_category;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'key', s.key,
            'value', CASE WHEN s.is_sensitive THEN '"********"'::jsonb ELSE s.value END,
            'category', s.category,
            'label', s.label,
            'description', s.description,
            'data_type', s.data_type,
            'is_sensitive', s.is_sensitive,
            'is_critical', s.is_critical,
            'validation_rules', s.validation_rules,
            'updated_at', s.updated_at
        ) ORDER BY s.created_at
    )
    INTO v_result
    FROM system_settings s
    WHERE s.category = p_category;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- UPDATE SINGLE SETTING
CREATE OR REPLACE FUNCTION update_setting(
    p_key TEXT,
    p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_setting RECORD;
    v_validation JSONB;
    v_value_text TEXT;
    v_value_num NUMERIC;
BEGIN
    -- Security check: SuperAdmin only
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès refusé. SuperAdmin uniquement.');
    END IF;

    -- Get the setting
    SELECT * INTO v_setting FROM system_settings WHERE key = p_key;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Paramètre introuvable: ' || p_key);
    END IF;

    -- Validate based on data_type
    v_validation := v_setting.validation_rules;
    
    CASE v_setting.data_type
        WHEN 'string', 'email' THEN
            v_value_text := p_value #>> '{}';
            IF v_validation IS NOT NULL THEN
                IF (v_validation->>'maxLength') IS NOT NULL AND length(v_value_text) > (v_validation->>'maxLength')::int THEN
                    RETURN jsonb_build_object('success', false, 'error', 'Valeur trop longue (max ' || (v_validation->>'maxLength') || ' caractères)');
                END IF;
                IF (v_validation->>'required')::boolean AND (v_value_text IS NULL OR v_value_text = '') THEN
                    RETURN jsonb_build_object('success', false, 'error', 'Ce champ est requis');
                END IF;
            END IF;
            -- Email validation
            IF v_setting.data_type = 'email' AND v_value_text IS NOT NULL AND v_value_text != '' THEN
                IF v_value_text !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
                    RETURN jsonb_build_object('success', false, 'error', 'Format d''email invalide');
                END IF;
            END IF;
            
        WHEN 'number' THEN
            BEGIN
                v_value_num := (p_value #>> '{}')::numeric;
            EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object('success', false, 'error', 'Valeur numérique invalide');
            END;
            IF v_validation IS NOT NULL THEN
                IF (v_validation->>'min') IS NOT NULL AND v_value_num < (v_validation->>'min')::numeric THEN
                    RETURN jsonb_build_object('success', false, 'error', 'Valeur minimale: ' || (v_validation->>'min'));
                END IF;
                IF (v_validation->>'max') IS NOT NULL AND v_value_num > (v_validation->>'max')::numeric THEN
                    RETURN jsonb_build_object('success', false, 'error', 'Valeur maximale: ' || (v_validation->>'max'));
                END IF;
            END IF;
            
        WHEN 'boolean' THEN
            IF p_value::text NOT IN ('true', 'false') THEN
                RETURN jsonb_build_object('success', false, 'error', 'Valeur booléenne invalide');
            END IF;
    END CASE;

    -- Update the setting
    UPDATE system_settings 
    SET 
        value = p_value,
        updated_by = auth.uid(),
        updated_at = now()
    WHERE key = p_key;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Paramètre mis à jour',
        'key', p_key,
        'is_critical', v_setting.is_critical
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Erreur: ' || SQLERRM);
END;
$$;

-- UPDATE MULTIPLE SETTINGS (Batch)
CREATE OR REPLACE FUNCTION update_settings_batch(
    p_settings JSONB -- Array of {key, value} objects
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item JSONB;
    v_result JSONB;
    v_errors JSONB := '[]'::jsonb;
    v_success_count INT := 0;
BEGIN
    -- Security check: SuperAdmin only
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès refusé. SuperAdmin uniquement.');
    END IF;

    -- Process each setting
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_settings)
    LOOP
        v_result := update_setting(
            v_item->>'key',
            v_item->'value'
        );
        
        IF (v_result->>'success')::boolean THEN
            v_success_count := v_success_count + 1;
        ELSE
            v_errors := v_errors || jsonb_build_object(
                'key', v_item->>'key',
                'error', v_result->>'error'
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', jsonb_array_length(v_errors) = 0,
        'updated_count', v_success_count,
        'errors', v_errors
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 5. AUDIT LOGGING FOR SETTINGS
-- ═══════════════════════════════════════════════════════════════

-- Trigger function for settings audit
CREATE OR REPLACE FUNCTION log_settings_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email TEXT;
    v_user_role TEXT;
    v_old_value JSONB;
    v_new_value JSONB;
BEGIN
    -- Get user info
    SELECT email, role INTO v_user_email, v_user_role
    FROM profiles WHERE id = auth.uid();
    
    -- Mask sensitive values in audit log
    IF TG_OP = 'UPDATE' THEN
        v_old_value := CASE WHEN OLD.is_sensitive THEN '"[MASKED]"'::jsonb ELSE OLD.value END;
        v_new_value := CASE WHEN NEW.is_sensitive THEN '"[MASKED]"'::jsonb ELSE NEW.value END;
    ELSIF TG_OP = 'INSERT' THEN
        v_new_value := CASE WHEN NEW.is_sensitive THEN '"[MASKED]"'::jsonb ELSE NEW.value END;
    ELSIF TG_OP = 'DELETE' THEN
        v_old_value := CASE WHEN OLD.is_sensitive THEN '"[MASKED]"'::jsonb ELSE OLD.value END;
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
        auth.uid(),
        COALESCE(v_user_email, 'system'),
        COALESCE(v_user_role, 'system'),
        TG_OP,
        'system_settings',
        COALESCE(NEW.id, OLD.id),
        CASE
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object(
                'setting_key', OLD.key,
                'old_value', v_old_value
            )
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
                'setting_key', NEW.key,
                'old_value', v_old_value,
                'new_value', v_new_value
            )
            WHEN TG_OP = 'INSERT' THEN jsonb_build_object(
                'setting_key', NEW.key,
                'new_value', v_new_value
            )
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger
DROP TRIGGER IF EXISTS audit_settings_trigger ON system_settings;
CREATE TRIGGER audit_settings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_audit();

-- ═══════════════════════════════════════════════════════════════
-- 6. HELPER FUNCTION: Get single setting value (for internal use)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_setting_value(p_key TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT value FROM system_settings WHERE key = p_key;
$$;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETE
-- ═══════════════════════════════════════════════════════════════
-- To apply:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Paste this script
-- 3. Execute
-- ═══════════════════════════════════════════════════════════════

COMMENT ON FUNCTION get_all_settings() IS 'Get all system settings - SuperAdmin only, masks sensitive values';
COMMENT ON FUNCTION get_settings_by_category(TEXT) IS 'Get settings by category - SuperAdmin only';
COMMENT ON FUNCTION update_setting(TEXT, JSONB) IS 'Update a single setting with validation - SuperAdmin only';
COMMENT ON FUNCTION update_settings_batch(JSONB) IS 'Batch update multiple settings - SuperAdmin only';
COMMENT ON FUNCTION get_setting_value(TEXT) IS 'Internal helper to get a setting value';
