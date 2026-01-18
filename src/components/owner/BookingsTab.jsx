import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Calendar,
    Search,
    Filter,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    PlayCircle,
    AlertCircle,
    Car,
    User,
    CreditCard,
    MoreVertical,
    Edit,
    Trash2
} from 'lucide-react';
import './BookingsTab.css';
import ErrorMessage from '../ErrorMessage';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';

const BookingsTab = ({ agencyId }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        revenue_month: 0
    });

    const fetchBookings = async () => {
        if (!agencyId) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('get_bookings_with_details', {
                p_agency_id: agencyId,
                p_status: filterStatus === 'all' ? null : filterStatus,
                p_limit: 100,
                p_offset: 0
            });

            if (rpcError) throw rpcError;

            setBookings(data || []);

            // Calculer les statistiques
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const statsCalc = {
                total: data?.length || 0,
                pending: data?.filter(b => b.status === 'pending').length || 0,
                confirmed: data?.filter(b => b.status === 'confirmed').length || 0,
                in_progress: data?.filter(b => b.status === 'in_progress').length || 0,
                completed: data?.filter(b => b.status === 'completed').length || 0,
                cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
                revenue_month: data
                    ?.filter(b => {
                        const createdDate = new Date(b.created_at);
                        return createdDate >= startOfMonth && b.status !== 'cancelled';
                    })
                    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0
            };

            setStats(statsCalc);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError(err.message || 'Erreur lors du chargement des réservations');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [agencyId, filterStatus]);

    const handleStatusChange = async (bookingId, newStatus, reason = null) => {
        try {
            const { data, error } = await supabase.rpc('update_booking_status', {
                p_booking_id: bookingId,
                p_new_status: newStatus,
                p_reason: reason
            });

            if (error) throw error;

            if (data?.success) {
                // Refresh bookings
                fetchBookings();
                return { success: true };
            } else {
                throw new Error(data?.error || 'Échec de la mise à jour');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            return { success: false, error: err.message };
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': { label: 'En attente', color: 'warning', icon: Clock },
            'confirmed': { label: 'Confirmée', color: 'info', icon: CheckCircle },
            'in_progress': { label: 'En cours', color: 'primary', icon: PlayCircle },
            'completed': { label: 'Terminée', color: 'success', icon: CheckCircle },
            'cancelled': { label: 'Annulée', color: 'error', icon: XCircle }
        };

        const badge = badges[status] || { label: status, color: 'gray', icon: AlertCircle };
        const Icon = badge.icon;

        return (
            <span className={`status-badge ${badge.color}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            'pending': { label: 'En attente', color: 'warning' },
            'partial': { label: 'Partiel', color: 'info' },
            'paid': { label: 'Payé', color: 'success' },
            'refunded': { label: 'Remboursé', color: 'error' }
        };

        const badge = badges[status] || { label: status, color: 'gray' };

        return (
            <span className={`payment-badge ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredBookings = bookings.filter(booking =>
        booking.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car_plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusFilters = [
        { id: 'all', label: 'Toutes', count: stats.total },
        { id: 'pending', label: 'En attente', count: stats.pending },
        { id: 'confirmed', label: 'Confirmées', count: stats.confirmed },
        { id: 'in_progress', label: 'En cours', count: stats.in_progress },
        { id: 'completed', label: 'Terminées', count: stats.completed },
        { id: 'cancelled', label: 'Annulées', count: stats.cancelled }
    ];

    return (
        <div className="bookings-tab">
            {/* Stats Cards */}
            <div className="stats-grid-bookings">
                <div className="stat-card-booking active">
                    <div className="stat-icon-wrapper primary">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Réservations Actives</span>
                        <span className="stat-value">{stats.confirmed + stats.in_progress}</span>
                    </div>
                </div>

                <div className="stat-card-booking pending">
                    <div className="stat-icon-wrapper warning">
                        <Clock size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">En Attente</span>
                        <span className="stat-value">{stats.pending}</span>
                    </div>
                </div>

                <div className="stat-card-booking revenue">
                    <div className="stat-icon-wrapper success">
                        <CreditCard size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">CA du Mois</span>
                        <span className="stat-value">{stats.revenue_month.toLocaleString('fr-FR')} DH</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="status-filters">
                    {statusFilters.map(filter => (
                        <button
                            key={filter.id}
                            className={`filter-btn ${filterStatus === filter.id ? 'active' : ''}`}
                            onClick={() => setFilterStatus(filter.id)}
                        >
                            {filter.label}
                            <span className="count-badge">{filter.count}</span>
                        </button>
                    ))}
                </div>

                <div className="search-filter-row">
                    <div className="search-bar-bookings">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par client, voiture, plaque..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button className="btn-primary">
                        <Plus size={18} />
                        Nouvelle Réservation
                    </button>
                </div>
            </div>

            {error && (
                <ErrorMessage
                    message={error}
                    onDismiss={() => setError(null)}
                    retry={fetchBookings}
                    retryLabel="Réessayer"
                />
            )}

            {loading ? (
                <LoadingSpinner message="Chargement des réservations..." />
            ) : filteredBookings.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title={searchTerm ? 'Aucune réservation trouvée' : 'Aucune réservation'}
                    message={searchTerm
                        ? 'Aucune réservation ne correspond à votre recherche.'
                        : 'Aucune réservation n\'a encore été créée.'}
                    actionLabel="Créer une réservation"
                    onAction={() => console.log('Create booking')}
                />
            ) : (
                <div className="table-container">
                    <table className="modern-table bookings-table">
                        <thead>
                            <tr>
                                <th><User size={14} /> Client</th>
                                <th><Car size={14} /> Véhicule</th>
                                <th><Calendar size={14} /> Dates</th>
                                <th>Durée</th>
                                <th>Statut</th>
                                <th>Paiement</th>
                                <th>Montant</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>
                                        <div className="client-cell-booking">
                                            <div className="client-avatar-small">
                                                {booking.client_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="client-info-booking">
                                                <span className="client-name">{booking.client_name}</span>
                                                <span className="client-phone">{booking.client_phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="car-cell-booking">
                                            <span className="car-name">{booking.car_brand} {booking.car_model}</span>
                                            <span className="car-plate">{booking.car_plate}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="dates-cell">
                                            <span className="date-from">{formatDate(booking.start_date)}</span>
                                            <span className="date-separator">→</span>
                                            <span className="date-to">{formatDate(booking.end_date)}</span>
                                        </div>
                                    </td>
                                    <td className="text-center font-medium">
                                        {booking.days_count} jour{booking.days_count > 1 ? 's' : ''}
                                    </td>
                                    <td>{getStatusBadge(booking.status)}</td>
                                    <td>{getPaymentStatusBadge(booking.payment_status)}</td>
                                    <td className="font-bold">
                                        {Number(booking.total_price).toLocaleString('fr-FR')} DH
                                    </td>
                                    <td>
                                        <div className="actions-cell-booking">
                                            <select
                                                className="status-selector"
                                                value={booking.status}
                                                onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                            >
                                                <option value="pending">En attente</option>
                                                <option value="confirmed">Confirmer</option>
                                                <option value="in_progress">Démarrer</option>
                                                <option value="completed">Terminer</option>
                                                <option value="cancelled">Annuler</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredBookings.length > 0 && (
                <div className="table-footer-bookings">
                    <p className="text-muted">
                        {filteredBookings.length} réservation{filteredBookings.length > 1 ? 's' : ''} affichée{filteredBookings.length > 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
};

export default BookingsTab;
