-- ═══════════════════════════════════════════════════════════════
-- 📊 DASHBOARD STATISTICS RPC - FIXED VERSION
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-18
-- Fix: Corrected monthly_growth CTE to avoid duplicate counts from LEFT JOINs
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
            (SELECT COUNT(*) FROM agencies WHERE deleted_at IS NULL) as agencies_total,
            (SELECT COUNT(*) FROM profiles WHERE role != 'superadmin') as users_total,
            (SELECT COUNT(*) FROM cars) as cars_total,
            (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status IN ('confirmed', 'completed', 'in_progress')) as revenue_total
    ),
    last_month_counts AS (
        SELECT 
            (SELECT COUNT(*) FROM agencies WHERE deleted_at IS NULL AND created_at < date_trunc('month', CURRENT_DATE)) as agencies_last,
            (SELECT COUNT(*) FROM profiles WHERE role != 'superadmin' AND created_at < date_trunc('month', CURRENT_DATE)) as users_last,
            (SELECT COUNT(*) FROM cars WHERE created_at < date_trunc('month', CURRENT_DATE)) as cars_last,
            (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status IN ('confirmed', 'completed', 'in_progress') AND created_at < date_trunc('month', CURRENT_DATE)) as revenue_last
    ),
    -- FIX: Separate subqueries to avoid duplicate counts from multiple LEFT JOINs
    months AS (
        SELECT 
            to_char(date_trunc('month', gs), 'Mon') as name,
            date_trunc('month', gs) as month_start
        FROM generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
        ) gs
    ),
    monthly_agencies AS (
        SELECT 
            date_trunc('month', created_at) as month,
            COUNT(*) as count
        FROM agencies
        WHERE deleted_at IS NULL
        GROUP BY 1
    ),
    monthly_users AS (
        SELECT 
            date_trunc('month', created_at) as month,
            COUNT(*) as count
        FROM profiles
        WHERE role != 'superadmin'
        GROUP BY 1
    ),
    monthly_revenue AS (
        SELECT 
            date_trunc('month', created_at) as month,
            COALESCE(SUM(total_price), 0) as amount
        FROM bookings
        WHERE status IN ('confirmed', 'completed', 'in_progress')
        GROUP BY 1
    ),
    monthly_growth AS (
        SELECT 
            m.name,
            m.month_start,
            COALESCE(ma.count, 0) as agencies_count,
            COALESCE(mu.count, 0) as users_count,
            COALESCE(mr.amount, 0) as revenue_amount
        FROM months m
        LEFT JOIN monthly_agencies ma ON ma.month = m.month_start
        LEFT JOIN monthly_users mu ON mu.month = m.month_start
        LEFT JOIN monthly_revenue mr ON mr.month = m.month_start
        ORDER BY m.month_start ASC
    ),
    recent_activity AS (
        -- Combine recent agencies and users using UNION ALL
        SELECT * FROM (
            SELECT 
                created_at,
                'agency_created' as type,
                jsonb_build_object('name', name, 'id', id) as data
            FROM agencies
            WHERE deleted_at IS NULL
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
COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Récupère les statistiques agrégées (KPIs, graphes, activités) pour le SuperAdmin dashboard - Version corrigée';
