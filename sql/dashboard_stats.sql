-- ═══════════════════════════════════════════════════════════════
-- 📊 DASHBOARD STATISTICS RPC
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Description: Fonction optimisée pour récupérer toutes les stats du dashboard en une seule requête
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
    v_stats JSONB;
    v_result JSONB;
BEGIN
    -- 1. Vérifier les permissions (SuperAdmin uniquement)
    v_role := public.get_my_role();
    
    IF v_role != 'superadmin' THEN
        RAISE EXCEPTION 'Accès refusé: seul le SuperAdmin peut voir ces statistiques';
    END IF;

    -- 2. Calculer les statistiques globales avec CTE pour performance
    WITH current_counts AS (
        SELECT 
            (SELECT COUNT(*) FROM agencies) as agencies_total,
            (SELECT COUNT(*) FROM profiles WHERE role != 'superadmin') as users_total,
            (SELECT COUNT(*) FROM cars) as cars_total,
            (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status IN ('confirmed', 'completed', 'in_progress')) as revenue_total
    ),
    last_month_counts AS (
        SELECT 
            (SELECT COUNT(*) FROM agencies WHERE created_at < date_trunc('month', CURRENT_DATE)) as agencies_last,
            (SELECT COUNT(*) FROM profiles WHERE role != 'superadmin' AND created_at < date_trunc('month', CURRENT_DATE)) as users_last,
            (SELECT COUNT(*) FROM cars WHERE created_at < date_trunc('month', CURRENT_DATE)) as cars_last,
            (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status IN ('confirmed', 'completed', 'in_progress') AND created_at < date_trunc('month', CURRENT_DATE)) as revenue_last
    ),
    monthly_growth AS (
        SELECT 
            to_char(date_trunc('month', generate_series), 'Mon') as name,
            date_trunc('month', generate_series) as month_start,
            COALESCE(count(a.id), 0) as agencies_count,
            COALESCE(count(p.id), 0) as users_count,
            COALESCE(sum(b.total_price), 0) as revenue_amount
        FROM generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
        )
        LEFT JOIN agencies a ON date_trunc('month', a.created_at) = date_trunc('month', generate_series)
        LEFT JOIN profiles p ON date_trunc('month', p.created_at) = date_trunc('month', generate_series) AND p.role != 'superadmin'
        LEFT JOIN bookings b ON date_trunc('month', b.created_at) = date_trunc('month', generate_series) AND b.status IN ('confirmed', 'completed', 'in_progress')
        GROUP BY 1, 2
        ORDER BY 2 ASC
    ),
    recent_activity AS (
        -- Combine recent agencies and users using UNION ALL
        SELECT * FROM (
            SELECT 
                created_at,
                'agency_created' as type,
                jsonb_build_object('name', name, 'id', id) as data
            FROM agencies
            UNION ALL
            SELECT 
                created_at,
                'user_registered' as type,
                jsonb_build_object('email', email, 'role', role, 'full_name', full_name) as data
            FROM profiles
            WHERE role != 'superadmin'
        ) combined
        ORDER BY created_at DESC
        LIMIT 10
    )
    SELECT jsonb_build_object(
        'metrics', (
            SELECT jsonb_build_object(
                'agencies', jsonb_build_object('total', c.agencies_total, 'last', l.agencies_last),
                'users', jsonb_build_object('total', c.users_total, 'last', l.users_last),
                'cars', jsonb_build_object('total', c.cars_total, 'last', l.cars_last),
                'revenue', jsonb_build_object('total', c.revenue_total, 'last', l.revenue_last)
            )
            FROM current_counts c, last_month_counts l
        ),
        'charts', (
            SELECT jsonb_agg(row_to_json(m)) FROM monthly_growth m
        ),
        'activity', (
            SELECT jsonb_agg(row_to_json(r)) FROM recent_activity r
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Récupère les statistiques agrégées (KPIs, graphes, activités) pour le SuperAdmin dashboard';
