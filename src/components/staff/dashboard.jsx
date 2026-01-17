import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Users,
    Car,
    Calendar,
    TrendingUp,
    DollarSign,
    Activity,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import ErrorMessage from '../ErrorMessage';
import './dashboard.css';

const StaffDashboardTab = ({ agencyId }) => {
    const [stats, setStats] = useState({
        totalClients: 0,
        totalCars: 0,
        activeBookings: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [agencyId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch clients count
            const { count: clientsCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true });

            // Fetch cars count
            const { count: carsCount } = await supabase
                .from('cars')
                .select('*', { count: 'exact', head: true });

            // Fetch bookings count (if bookings table exists)
            let bookingsCount = 0;
            try {
                const { count } = await supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true });
                bookingsCount = count || 0;
            } catch (e) {
                // Bookings table might not exist or have RLS issues
            }

            setStats({
                totalClients: clientsCount || 0,
                totalCars: carsCount || 0,
                activeBookings: bookingsCount,
                totalRevenue: 0 // Would need to calculate from bookings/payments
            });

            // Fetch recent clients
            const { data: recentClients } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentClients) {
                setRecentActivity(recentClients.map(client => ({
                    id: client.id,
                    type: 'client',
                    title: `Nouveau client: ${client.name}`,
                    time: new Date(client.created_at).toLocaleDateString('fr-FR'),
                    icon: Users
                })));
            }
        } catch (error) {
            const errorMessage = error?.message || 'Erreur lors du chargement des données.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            id: 'clients',
            label: 'Clients',
            value: stats.totalClients,
            icon: Users,
            color: 'rgba(59, 130, 246, 0.1)',
            iconColor: '#3b82f6'
        },
        {
            id: 'cars',
            label: 'Véhicules',
            value: stats.totalCars,
            icon: Car,
            color: 'rgba(16, 185, 129, 0.1)',
            iconColor: '#10b981'
        },
        {
            id: 'bookings',
            label: 'Réservations',
            value: stats.activeBookings,
            icon: Calendar,
            color: 'rgba(168, 85, 247, 0.1)',
            iconColor: '#a855f7'
        },
        {
            id: 'revenue',
            label: 'Revenus (Mois)',
            value: `${stats.totalRevenue} MAD`,
            icon: DollarSign,
            color: 'rgba(245, 158, 11, 0.1)',
            iconColor: '#f59e0b'
        }
    ];

    return (
        <div className="staff-dashboard-tab">
            <div className="dashboard-header">
                <div>
                    <h2>Tableau de bord</h2>
                    <p>Vue d'ensemble de votre activité</p>
                </div>
            </div>

            {error && (
                <ErrorMessage 
                    message={error} 
                    onDismiss={() => setError(null)}
                    retry={fetchDashboardData}
                    retryLabel="Réessayer"
                />
            )}

            {loading ? (
                <div className="loading-state">
                    <Activity size={24} className="spinner" />
                    <span>Chargement des données...</span>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        {statCards.map((stat) => (
                            <div key={stat.id} className="stat-card">
                                <div className="stat-icon" style={{ background: stat.color }}>
                                    <stat.icon size={24} style={{ color: stat.iconColor }} />
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">{stat.label}</p>
                                    <h3 className="stat-value">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="dashboard-sections">
                        <div className="dashboard-section">
                            <div className="section-header">
                                <h3>Activité récente</h3>
                                <button className="view-all-btn">Voir tout</button>
                            </div>
                            <div className="activity-list">
                                {recentActivity.length === 0 ? (
                                    <div className="empty-state">
                                        <Activity size={48} />
                                        <p>Aucune activité récente</p>
                                    </div>
                                ) : (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="activity-item">
                                            <div className="activity-icon">
                                                <activity.icon size={18} />
                                            </div>
                                            <div className="activity-content">
                                                <p className="activity-title">{activity.title}</p>
                                                <span className="activity-time">{activity.time}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="dashboard-section">
                            <div className="section-header">
                                <h3>Actions rapides</h3>
                            </div>
                            <div className="quick-actions">
                                <button className="quick-action-btn">
                                    <Users size={20} />
                                    <span>Ajouter un client</span>
                                </button>
                                <button className="quick-action-btn">
                                    <Car size={20} />
                                    <span>Voir les véhicules</span>
                                </button>
                                <button className="quick-action-btn">
                                    <Calendar size={20} />
                                    <span>Nouvelle réservation</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StaffDashboardTab;

