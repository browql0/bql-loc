import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Shield,
    Search,
    Download,
    Clock,
    User,
    Database,
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Eye,
    ShieldAlert,
    Activity,
    Lock
} from 'lucide-react';
import './AuditLogsTab.css';
import ErrorMessage from '../ErrorMessage';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import AuditLogDetailDrawer from './AuditLogDetailDrawer';
import PremiumSelect from '../owner/PremiumSelect';

const ITEMS_PER_PAGE = 20;

const AuditLogsTab = () => {
    // Data State
    const [logs, setLogs] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        table: 'all',
        action: 'all',
        startDate: '',
        endDate: ''
    });
    const [page, setPage] = useState(1);

    // UI State
    const [selectedLog, setSelectedLog] = useState(null);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.search), 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Prepare params for V2 RPC
            const params = {
                search_query: debouncedSearch || '',
                filter_table: filters.table === 'all' ? null : filters.table,
                filter_action: filters.action === 'all' ? null : filters.action,
                start_date: filters.startDate ? new Date(filters.startDate).toISOString() : null,
                end_date: filters.endDate ? new Date(filters.endDate).toISOString() : null,
                page: page,
                page_size: ITEMS_PER_PAGE
            };

            const { data, error: rpcError } = await supabase.rpc('get_audit_logs_v2', params);

            if (rpcError) throw rpcError;

            // Handle response format from V2 { data: [], total_count: 0 }
            if (data) {
                setLogs(data.data || []);
                setTotalCount(data.total_count || 0);
            }
        } catch (err) {
            console.error(err);
            // Fallback for V1 if V2 not applied yet
            if (err.message?.includes('function get_audit_logs_v2') && err.message?.includes('does not exist')) {
                const { data: v1Data, error: v1Error } = await supabase.rpc('get_audit_logs');
                if (!v1Error) {
                    setLogs(v1Data || []);
                    setError("Le système Audit V2 n'est pas encore déployé. Affichage limité.");
                } else {
                    setError("Impossible de charger les logs. Veuillez vérifier la connexion.");
                }
            } else {
                setError(err.message || 'Erreur lors du chargement des logs.');
            }
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filters.table, filters.action, filters.startDate, filters.endDate, page]);

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to page 1 on filter change
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const getActionBadge = (action) => {
        const badgeConfig = {
            'INSERT': { label: 'Création', className: 'insert', icon: CheckCircle },
            'UPDATE': { label: 'Modification', className: 'update', icon: AlertCircle },
            'DELETE': { label: 'Suppression', className: 'delete', icon: AlertCircle }
        };

        const config = badgeConfig[action] || { label: action, className: 'neutral', icon: Shield };

        return (
            <span className={`status-badge-modern ${config.className}`}>
                <span className="status-dot"></span>
                {config.label}
            </span>
        );
    };

    const tableOptions = [
        { value: 'all', label: 'Toutes les tables' },
        { value: 'agencies', label: 'Agences' },
        { value: 'profiles', label: 'Utilisateurs' },
        { value: 'bookings', label: 'Réservations' },
        { value: 'cars', label: 'Véhicules' },
        { value: 'payments', label: 'Paiements' }
    ];

    const actionOptions = [
        { value: 'all', label: 'Toutes les actions' },
        { value: 'INSERT', label: 'Création (Insert)' },
        { value: 'UPDATE', label: 'Modification (Update)' },
        { value: 'DELETE', label: 'Suppression (Delete)' }
    ];

    return (
        <div className="audit-container">
            {/* Header Modern */}
            <header className="audit-header-modern">
                <div className="header-content">
                    <h1>Audit & Sécurité</h1>
                    <p className="header-subtitle">Traçabilité complète et immuable des actions système.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Download size={16} /> Exporter CSV
                    </button>
                </div>
            </header>

            {/* KPI Grid */}
            <div className="kpi-grid-modern">
                <div className="kpi-card-modern blue">
                    <div className="kpi-icon-modern">
                        <Activity size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Total Événements</span>
                        <span className="kpi-value-modern">{totalCount}</span>
                    </div>
                </div>
                <div className="kpi-card-modern purple">
                    <div className="kpi-icon-modern">
                        <Shield size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Sécurité</span>
                        <span className="kpi-value-modern">Active</span>
                    </div>
                </div>
                {/* Placeholders for layout balance */}
                <div className="kpi-card-modern green">
                    <div className="kpi-icon-modern">
                        <CheckCircle size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Système</span>
                        <span className="kpi-value-modern">Stable</span>
                    </div>
                </div>
                <div className="kpi-card-modern orange">
                    <div className="kpi-icon-modern">
                        <Lock size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Chiffrement</span>
                        <span className="kpi-value-modern">AES-256</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar-section">
                <div className="search-group">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher (Email, ID...)"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>

                <div className="filters-row-modern">
                    <div className="filter-select-wrapper">
                        <PremiumSelect
                            options={tableOptions}
                            value={filters.table}
                            onChange={(e) => handleFilterChange('table', e.target.value)}
                            icon={Database}
                        />
                    </div>
                    <div className="filter-select-wrapper">
                        <PremiumSelect
                            options={actionOptions}
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            icon={ShieldAlert}
                        />
                    </div>
                    <div className="date-range-modern">
                        <div className="input-with-icon">
                            <Calendar size={14} className="input-icon" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="premium-input date-input"
                            />
                        </div>
                        <span className="separator">-</span>
                        <div className="input-with-icon">
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="premium-input date-input"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <ErrorMessage
                    message={error}
                    onDismiss={() => setError(null)}
                />
            )}

            {/* CONTENT */}
            {loading ? (
                <div className="loading-skeleton">
                    <LoadingSpinner message="Chargement des logs sécurisés..." />
                </div>
            ) : logs.length === 0 ? (
                <EmptyState
                    icon={Shield}
                    title="Aucun log trouvé"
                    message="Aucune activité ne correspond à vos filtres."
                />
            ) : (
                <>
                    {/* DESKTOP TABLE */}
                    <div className="audit-table-card hidden-mobile">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Acteur</th>
                                    <th>Action</th>
                                    <th>Cible (Table : ID)</th>
                                    <th className="text-center">Détails</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div className="date-cell-modern">
                                                <Clock size={14} />
                                                {new Date(log.created_at).toLocaleString('fr-FR')}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="user-cell-modern">
                                                <div className="user-avatar-small">
                                                    {log.user_email?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="user-info-text">
                                                    <span className="user-email">{log.user_email}</span>
                                                    <span className="user-role">{log.user_role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getActionBadge(log.action)}</td>
                                        <td>
                                            <div className="target-cell-modern">
                                                {log.table_name} <span style={{ opacity: 0.5 }}>#</span>{log.record_id?.slice(0, 8)}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <button className="action-btn-modern" style={{ margin: '0 auto' }}>
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="mobile-cards-modern hidden-desktop">
                        {logs.map(log => (
                            <div key={log.id} className="audit-card-premium" onClick={() => setSelectedLog(log)}>
                                <div className="card-top-row">
                                    {getActionBadge(log.action)}
                                    <div className="card-time-group">
                                        <div className="time-pill">
                                            <span>{new Date(log.created_at).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <div className="time-pill">
                                            <span>{new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-user-row">
                                    <div className="user-avatar-premium">
                                        {log.user_email?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="user-email-premium">{log.user_email}</span>
                                </div>

                                <div className="card-footer-row">
                                    <div className="target-chip-premium">
                                        <span className="table-name">{log.table_name}</span>
                                        <span className="record-hash">#{log.record_id?.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAGINATION */}
                    <div className="pagination-modern">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="page-btn-modern"
                        >
                            Précédent
                        </button>
                        <span className="page-info-modern" style={{ fontSize: '13px', color: '#6B7280' }}>
                            Page {page} sur {totalPages || 1}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="page-btn-modern"
                        >
                            Suivant
                        </button>
                    </div>
                </>
            )}

            {/* DETAIL DRAWER */}
            {selectedLog && (
                <AuditLogDetailDrawer
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
};

export default AuditLogsTab;
