import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Building2,
    Users,
    Car,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Plus,
    Trash2
} from 'lucide-react';
import './OverviewTab.css';

const OverviewTab = () => {
    const [stats, setStats] = useState({
        agencies: { total: 0, trend: '0%', isUp: true },
        users: { total: 0, trend: '0%', isUp: true },
        cars: { total: 0, trend: '0%', isUp: true },
        revenue: { total: 0, trend: '0%', isUp: true },
        recentAgencies: [],
        growthData: []
    });
    const [loading, setLoading] = useState(true);

    const calculateTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const diff = ((current - previous) / previous) * 100;
        return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    };

    const fetchOverviewData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const firstDateOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const firstDateOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

            // 1. Agencies Data
            const { data: allAgencies } = await supabase
                .from('agencies')
                .select('id, created_at, name, profiles(full_name)')
                .order('created_at', { ascending: false });

            const agenciesTotal = allAgencies?.length || 0;
            const agenciesThisMonth = allAgencies?.filter(a => a.created_at >= firstDateOfMonth).length || 0;
            const agenciesLastMonth = allAgencies?.filter(a => a.created_at >= firstDateOfLastMonth && a.created_at < firstDateOfMonth).length || 0;
            const agenciesTrend = calculateTrend(agenciesThisMonth, agenciesLastMonth);

            // 2. Users Data
            const { data: allUsers } = await supabase
                .from('profiles')
                .select('created_at');

            const usersTotal = allUsers?.length || 0;
            const usersThisMonth = allUsers?.filter(u => u.created_at >= firstDateOfMonth).length || 0;
            const usersLastMonth = allUsers?.filter(u => u.created_at >= firstDateOfLastMonth && u.created_at < firstDateOfMonth).length || 0;
            const usersTrend = calculateTrend(usersThisMonth, usersLastMonth);

            // 3. Cars Data
            const { data: allCars } = await supabase
                .from('cars')
                .select('created_at');

            const carsTotal = allCars?.length || 0;
            const carsThisMonth = allCars?.filter(c => c.created_at >= firstDateOfMonth).length || 0;
            const carsLastMonth = allCars?.filter(c => c.created_at >= firstDateOfLastMonth && c.created_at < firstDateOfMonth).length || 0;
            const carsTrend = calculateTrend(carsThisMonth, carsLastMonth);

            // 4. Revenue Data
            const { data: allBookings } = await supabase
                .from('bookings')
                .select('total_price, created_at')
                .in('status', ['confirmed', 'completed']);

            const revenueTotal = allBookings?.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0) || 0;
            const revenueThisMonth = allBookings?.filter(b => b.created_at >= firstDateOfMonth)
                .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0) || 0;
            const revenueLastMonth = allBookings?.filter(b => b.created_at >= firstDateOfLastMonth && b.created_at < firstDateOfMonth)
                .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0) || 0;
            const revenueTrend = calculateTrend(revenueThisMonth, revenueLastMonth);

            // 5. Growth Data (Graph)
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({
                    name: d.toLocaleString('default', { month: 'short' }),
                    count: 0,
                    timestamp: d
                });
            }

            allAgencies?.forEach(agency => {
                const createdDate = new Date(agency.created_at);
                const monthMatch = months.find(m =>
                    m.timestamp.getMonth() === createdDate.getMonth() &&
                    m.timestamp.getFullYear() === createdDate.getFullYear()
                );
                if (monthMatch) monthMatch.count++;
            });

            setStats({
                agencies: { total: agenciesTotal, trend: agenciesTrend, isUp: !agenciesTrend.startsWith('-') },
                users: { total: usersTotal, trend: usersTrend, isUp: !usersTrend.startsWith('-') },
                cars: { total: carsTotal, trend: carsTrend, isUp: !carsTrend.startsWith('-') },
                revenue: { total: revenueTotal, trend: revenueTrend, isUp: !revenueTrend.startsWith('-') },
                recentAgencies: allAgencies?.slice(0, 5) || [],
                growthData: months
            });
        } catch (error) {
            console.error('Error fetching dynamic overview data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverviewData();
    }, []);

    const formatCurrency = (val) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
        return val;
    };

    const statCards = [
        { title: 'Agences Totales', value: stats.agencies.total, trend: stats.agencies.trend, isUp: stats.agencies.isUp, icon: Building2, color: 'blue' },
        { title: 'Utilisateurs Actifs', value: stats.users.total, trend: stats.users.trend, isUp: stats.users.isUp, icon: Users, color: 'purple' },
        { title: 'Flotte Globale', value: stats.cars.total, trend: stats.cars.trend, isUp: stats.cars.isUp, icon: Car, color: 'orange' },
        { title: 'CA Global (MAD)', value: formatCurrency(stats.revenue.total), trend: stats.revenue.trend, isUp: stats.revenue.isUp, icon: TrendingUp, color: 'green' }
    ];

    if (loading) {
        return (
            <div className="overview-loading-container">
                <div className="loading-spinner-premium"></div>
                <p>Analyse des données en cours...</p>
            </div>
        );
    }

    return (
        <div className="overview-tab">
            {/* Header Section */}
            <div className="overview-header">
                <div className="welcome-text">
                    <h1>Vue d'ensemble</h1>
                    <p>Statistiques consolidées de l'écosystème BQL RENT.</p>
                </div>
                <div className="header-actions-group">
                    <div className="header-badge live">
                        <Activity size={14} className="pulse-icon" />
                        <span>Live Evolution</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((card, idx) => (
                    <div key={idx} className={`stat-card ${card.color}`}>
                        <div className="card-glass"></div>
                        <div className="card-top">
                            <div className="icon-wrapper">
                                <card.icon size={22} />
                            </div>
                        </div>
                        <div className="card-bottom">
                            <div className="value-row">
                                <h3 className="stat-value">{card.value}</h3>
                                <div className={`trend-badge-modern ${card.isUp ? 'up' : 'down'}`}>
                                    {card.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    <span>{card.trend}</span>
                                </div>
                            </div>
                            <p className="stat-title">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Charts & Recent Activity */}
            <div className="overview-content-grid">
                {/* Visual Chart with Real Data */}
                <div className="chart-panel premium-glass">
                    <div className="panel-header">
                        <div className="title-with-subtitle">
                            <h3>Inscriptions Agences</h3>
                            <p>Moyenne de {Math.round(stats.totalAgencies / 6)} / mois</p>
                        </div>
                        <select className="chart-filter">
                            <option>Derniers 6 mois</option>
                        </select>
                    </div>
                    <div className="chart-placeholder">
                        <div className="bars-container">
                            {stats.growthData.map((m, i) => {
                                const maxCount = Math.max(...stats.growthData.map(d => d.count), 1);
                                const heightPercent = (m.count / maxCount) * 85 + 5; // Min 5% for visibility
                                return (
                                    <div key={i} className="bar-wrapper">
                                        <div className="bar-val-hint">{m.count}</div>
                                        <div className="bar" style={{ height: `${heightPercent}%` }}>
                                            <div className="bar-glow"></div>
                                        </div>
                                        <span className="bar-label">{m.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent Agencies Feed */}
                <div className="activity-panel premium-glass">
                    <div className="panel-header">
                        <h3>Activités Récentes</h3>
                        <button className="view-all-btn">Historique</button>
                    </div>
                    <div className="activity-list">
                        {stats.recentAgencies.map((agency) => (
                            <div key={agency.id} className="activity-item">
                                <div className="activity-icon-container plus">
                                    <Plus size={16} />
                                </div>
                                <div className="activity-info">
                                    <h4>{agency.name}</h4>
                                    <p>Propriétaire: {agency.profiles?.[0]?.full_name || 'Admin'}</p>
                                </div>
                                <span className="activity-time">
                                    {new Date(agency.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
