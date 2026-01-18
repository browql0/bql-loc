-- ═══════════════════════════════════════════════════════════════
-- 📜 ACTIVITY HISTORY RPC
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Description: Récupère l'historique complet des activités (agences, users) avec pagination
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_activity_history(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    created_at TIMESTAMP WITH TIME ZONE,
    type TEXT,
    data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        SELECT 
            a.created_at,
            'agency_created'::text as type,
            jsonb_build_object('name', a.name, 'id', a.id) as data
        FROM agencies a
        UNION ALL
        SELECT 
            p.created_at,
            'user_registered'::text as type,
            jsonb_build_object('email', p.email, 'role', p.role, 'full_name', p.full_name) as data
        FROM profiles p
        WHERE p.role != 'superadmin'
    ) combined
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION public.get_activity_history(INT, INT) IS 'Retourne l''historique paginé des créations (agences + users)';
