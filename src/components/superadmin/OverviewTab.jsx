
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Building2,
    Users,
    Car,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    ShieldAlert,
    UserPlus,
    FileText,
    Settings,
    Calendar,
    Activity
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import ErrorMessage from '../ErrorMessage';
import ActivityHistoryModal from './ActivityHistoryModal';
import './OverviewTab.css';

const OverviewTab = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('revenue');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_dashboard_stats');
            if (error) throw error;
            setStats(data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError("Impossible de charger les statistiques. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // --- Content Formatters (KPI Cards) ---
    const formatCurrency = (val) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M DH';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k DH';
        return val + ' DH';
    };

    const formatTrend = (current, last) => {
        if (!last || last === 0) return { value: '+100%', isUp: true };
        const diff = ((current - last) / last) * 100;
        return {
            value: (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%',
            isUp: diff >= 0
        };
    };

    // --- Chart Scaling Helpers ---
    // Rule: Revenue < 1k shows absolute, >= 1k shows '1.5k'. 
    // Rule: Users must be integers (no 0.25).
    const formatYAxis = (val) => {
        if (activeTab === 'revenue') {
            if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
            return val; // Show absolute number if < 1000
        }
        return val; // Users shown as integer by YAxis allowDecimals={false}
    };

    const formatTooltip = (val) => {
        if (activeTab === 'revenue') {
            return [formatCurrency(val), 'Revenus'];
        }
        return [`${val} utilisateurs`, 'Inscriptions'];
    };

    if (loading) {
        return (
            <div className="overview-container">
                <div className="loading-skeleton">
                    <div className="loading-spinner-premium"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorMessage
                message={error}
                onDismiss={() => setError(null)}
                retry={fetchStats}
                retryLabel="Réessayer"
            />
        );
    }

    // Prepare KPI Data
    const kpiCards = [
        {
            title: 'Agences',
            value: stats.metrics.agencies.total,
            last: stats.metrics.agencies.last,
            icon: Building2,
            color: 'blue'
        },
        {
            title: 'Utilisateurs',
            value: stats.metrics.users.total,
            last: stats.metrics.users.last,
            icon: Users,
            color: 'purple'
        },
        {
            title: 'Flotte',
            value: stats.metrics.cars.total,
            last: stats.metrics.cars.last,
            icon: Car,
            color: 'orange'
        },
        {
            title: 'Revenus',
            value: formatCurrency(stats.metrics.revenue.total),
            last: stats.metrics.revenue.last,
            isCurrency: true,
            icon: TrendingUp,
            color: 'green'
        }
    ];

    // Quick Actions Data
    const quickActions = [
        { label: 'Nouvelle Agence', icon: Plus },
        { label: 'Ajouter Admin', icon: UserPlus },
        { label: 'Voir Logs', icon: FileText },
        { label: 'Paramètres', icon: Settings },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const isRevenue = activeTab === 'revenue';
            return (
                <div className="custom-dashboard-tooltip">
                    <div className="tooltip-glass-base">
                        <span className="tooltip-meta">{label}</span>
                        <div className="tooltip-value-row">
                            <div className={`tooltip-indicator ${isRevenue ? 'revenue' : 'growth'}`}></div>
                            <span className="tooltip-label">{isRevenue ? 'Revenus' : 'Inscriptions'}</span>
                            <span className="tooltip-amount">
                                {isRevenue ? formatCurrency(payload[0].value) : payload[0].value}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Prepare Chart Data
    const chartData = (stats?.charts || []).map(item => ({
        ...item,
        value: parseFloat(activeTab === 'revenue'
            ? (item.revenue_amount || 0)
            : (item.users_count || 0)
        )
    }));

    const yAxisDomain = [0, 'auto'];

    return (
        <div className="overview-container">
            {/* 1. Header */}
            {/* 1. Header */}
            <header className="overview-header-modern">
                <div className="header-content">
                    <h1>Vue d'ensemble</h1>
                    <p className="header-subtitle">Performance globale du système.</p>
                </div>
                <div className="header-controls">
                    <div className="system-tactical-strip">
                        <div className="control-item live-indicator">
                            <div className="pulsing-dot"></div>
                            <span>Système Opérationnel</span>
                        </div>
                        <div className="control-item tech-meta">
                            <span>UPTIME: 99.9%</span>
                        </div>
                        <div className="control-item tech-meta desktop-only">
                            <span>LATENCY: 24ms</span>
                        </div>
                        <div className="control-item date-display">
                            <Calendar size={12} />
                            <span>{new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </header>



            {/* 3. KPI Cards */}
            <section className="kpi-section">
                {kpiCards.map((card, idx) => {
                    const trend = formatTrend(
                        card.isCurrency ? stats.metrics.revenue.total : card.value,
                        card.last
                    );
                    const colors = {
                        blue: { text: '#2563EB', bg: '#EFF6FF' },
                        purple: { text: '#7C3AED', bg: '#F5F3FF' },
                        orange: { text: '#EA580C', bg: '#FFF7ED' },
                        green: { text: '#059669', bg: '#ECFDF5' }
                    };
                    const theme = colors[card.color];

                    return (
                        <div key={idx} className="kpi-card">
                            <div className="kpi-card-header">
                                <div className="kpi-icon-wrapper" style={{ color: theme.text, backgroundColor: theme.bg }}>
                                    <card.icon size={20} />
                                </div>
                                <div className={`kpi-trend ${trend.isUp ? 'positive' : 'negative'}`}>
                                    {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    <span>{trend.value}</span>
                                </div>
                            </div>
                            <div className="kpi-card-body">
                                <h2 className="kpi-value">{card.value}</h2>
                                <span className="kpi-label">{card.title}</span>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* 4. Dashboard Grid */}
            <section className="dashboard-main-grid">

                {/* Chart Card */}
                <div className="chart-card">
                    <div className="section-header">
                        <h3 className="section-title">Analyse & Performance</h3>
                        <div className="chart-tabs">
                            <button
                                className={`chart-tab ${activeTab === 'revenue' ? 'active' : ''}`}
                                onClick={() => setActiveTab('revenue')}
                            >
                                Revenus
                            </button>
                            <button
                                className={`chart-tab ${activeTab === 'growth' ? 'active' : ''}`}
                                onClick={() => setActiveTab('growth')}
                            >
                                Inscriptions
                            </button>
                        </div>
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                                    dy={10}
                                    interval={window.innerWidth < 768 ? 2 : 0}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    width={45}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                                    tickFormatter={(value) => {
                                        if (activeTab === 'revenue') {
                                            if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                                            return value;
                                        }
                                        return value;
                                    }}
                                    domain={yAxisDomain}
                                    allowDecimals={activeTab === 'revenue'}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={activeTab === 'revenue' ? '#10B981' : '#3B82F6'}
                                    strokeWidth={4}
                                    fill={activeTab === 'revenue' ? "url(#colorRevenue)" : "url(#colorGrowth)"}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: activeTab === 'revenue' ? '#10B981' : '#3B82F6' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="activity-card">
                    <div className="section-header">
                        <h3 className="section-title">Activités Récentes</h3>
                    </div>
                    <div className="activity-feed">
                        {stats.activity.length === 0 ? (
                            <div className="empty-feed">
                                Aucune activité récente
                            </div>
                        ) : (
                            stats.activity.slice(0, 5).map((item, i) => (
                                <div key={i} className="activity-item">
                                    <div className="activity-icon">
                                        {item.type === 'agency_created' ? <Building2 size={16} /> : <Users size={16} />}
                                    </div>
                                    <div className="activity-content">
                                        <p className="activity-text">
                                            <span className="activity-highlight">
                                                {item.type === 'agency_created' ? item.data.name : item.data.full_name}
                                            </span>
                                            {item.type === 'agency_created' ? ' a rejoint la plateforme' : ' nouvel utilisateur'}
                                        </p>
                                        <span className="activity-time">
                                            {new Date(item.created_at).toLocaleDateString(undefined, {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="card-footer">
                        <button className="view-all-btn" onClick={() => setIsHistoryModalOpen(true)}>
                            Voir tout l'historique
                        </button>
                    </div>
                </div>

            </section>

            <ActivityHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
            />
        </div>
    );
};

export default OverviewTab;
