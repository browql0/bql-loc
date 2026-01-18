import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Building2,
    Search,
    MoreVertical,
    Trash2,
    Shield,
    CheckCircle2,
    XCircle,
    User,
    Pencil,
    Satellite,
    Zap,
    BarChart3,
    Wallet,
    Car,
    Clock,
    Settings,
    Cpu
} from 'lucide-react';
import './AgenciesTab.css';
import AddAgencyModal from './AddAgencyModal';
import EditAgencyModal from './EditAgencyModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import SuccessModal from './SuccessModal';
import AgencyDetailDrawer from './AgencyDetailDrawer';
import ErrorMessage from '../ErrorMessage';
import EmptyState from '../EmptyState';
import LoadingSpinner from '../LoadingSpinner';
import ErrorModal from './ErrorModal';
import PremiumSelect from '../owner/PremiumSelect';
import { ShieldAlert } from 'lucide-react';

const AgenciesTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [agencies, setAgencies] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentAgency, setCurrentAgency] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null); // Per-row loading state
    const [detailAgencyId, setDetailAgencyId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [statusConfirmData, setStatusConfirmData] = useState(null); // For status toggle confirmation

    // Advanced Navigation State
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [sortConfig, setSortConfig] = useState({ column: 'created_at', direction: 'DESC' });

    // Explicitly ensure modal is closed on mount to prevent automatic opening
    useEffect(() => {
        setIsAddModalOpen(false);
    }, []);

    const protocolOptions = [
        { value: 'all', label: 'ALL_PROTOCOLS' },
        { value: 'active', label: 'PROTOCOL_ACTIVE' },
        { value: 'suspended', label: 'PROTOCOL_SUSPENDED' },
        { value: 'pending', label: 'PROTOCOL_PENDING' }
    ];

    const fetchAgencies = async () => {
        setLoading(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_agencies_enterprise', {
                search_term: searchTerm.trim(),
                status_filter: statusFilter === 'all' ? null : statusFilter,
                limit_val: pageSize,
                offset_val: page * pageSize,
                sort_column: sortConfig.column,
                sort_direction: sortConfig.direction
            });

            if (rpcError) throw rpcError;
            setAgencies(data || []);
            setTotalItems(data?.[0]?.total_count || 0);
        } catch (err) {
            setError(err.message || 'Erreur lors du chargement des agences.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAgencies();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, page, sortConfig]);

    const handleSort = (column) => {
        setSortConfig(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'ASC' ? 'DESC' : 'ASC'
        }));
        setPage(0); // Reset to first page on sort
    };

    const getStatusBadge = (status) => {
        const configs = {
            active: { label: 'Actif', class: 'active' },
            suspended: { label: 'Suspendu', class: 'suspended' },
            pending: { label: 'En attente', class: 'pending' }
        };
        const config = configs[status] || configs.pending;
        return (
            <span className={`status-badge-modern ${config.class}`}>
                <span className="status-dot"></span>
                {config.label}
            </span>
        );
    };

    const handleStatusToggle = async (agencyId, currentStatus) => {
        // Prevent double-clicks
        if (actionLoadingId === agencyId) return;

        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        setActionLoadingId(agencyId);

        try {
            const { error, data } = await supabase.rpc('set_agency_status', {
                agency_id_input: agencyId,
                new_status: newStatus
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.error || 'Erreur inconnue');

            // Optimistic update for better UX, then refetch
            setAgencies(prev => prev.map(a =>
                a.id === agencyId ? { ...a, status: newStatus } : a
            ));
            fetchAgencies();
        } catch (err) {
            setErrorMessage(err.message || 'Erreur lors du changement de statut.');
            setIsErrorModalOpen(true);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!currentAgency) return;
        setActionLoading(true);
        try {
            const { error } = await supabase.rpc('soft_delete_agency_enterprise', {
                agency_id_input: currentAgency.id
            });
            if (error) throw error;

            setIsDeleteModalOpen(false);
            setSuccessMessage(`L'agence "${currentAgency.name}" a été archivée avec succès.`);
            setIsSuccessModalOpen(true);
            fetchAgencies();
        } catch (err) {
            setErrorMessage(err.message);
            setIsErrorModalOpen(true);
        } finally {
            setActionLoading(false);
            setCurrentAgency(null);
        }
    };

    const handleEditClick = (agency) => {
        setCurrentAgency(agency);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (agency) => {
        setCurrentAgency(agency);
        setIsDeleteModalOpen(true);
    };

    const handleAddSuccess = () => {
        // Redundant as AddAgencyModal now shows success state and delay
        fetchAgencies();
    };

    const renderMobileCards = () => (
        <div className="mobile-cards-modern">
            {agencies.map((agency) => (
                <div key={agency.id} className="agency-card-modern">
                    <div className="card-header-modern">
                        <div className="card-header-left">
                            <div className="agency-avatar-modern">
                                <Building2 size={20} />
                            </div>
                            <div className="agency-info">
                                <h4>{agency.name}</h4>
                                <span className="agency-id-sub">ID: {agency.id.slice(0, 8)}</span>
                            </div>
                        </div>
                        {getStatusBadge(agency.status)}
                    </div>

                    <div className="card-stats-row">
                        <div className="stat-item-modern">
                            <span className="stat-label-m">Flotte</span>
                            <span className="stat-value-m">{agency.cars_count}</span>
                        </div>
                        <div className="stat-item-modern">
                            <span className="stat-label-m">Revenus Est.</span>
                            <span className="stat-value-m">{Number(agency.revenue_est || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mobile-actions-row">
                        <button
                            className="action-btn-new edit"
                            onClick={() => handleEditClick(agency)}
                            disabled={actionLoadingId === agency.id}
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            className={`action-btn-new ${agency.status === 'active' ? 'suspend' : 'activate'}`}
                            onClick={() => handleStatusToggle(agency.id, agency.status)}
                            disabled={actionLoadingId === agency.id}
                        >
                            {actionLoadingId === agency.id ? (
                                <span className="spinner-icon" />
                            ) : agency.status === 'active' ? (
                                <XCircle size={18} />
                            ) : (
                                <Zap size={18} />
                            )}
                        </button>
                        <button
                            className="action-btn-new delete"
                            onClick={() => handleDeleteClick(agency)}
                            disabled={actionLoadingId === agency.id}
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            className="action-btn-new"
                            onClick={() => {
                                setDetailAgencyId(agency.id);
                                setIsDetailOpen(true);
                            }}
                        >
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDesktopTable = () => (
        <div className="agencies-table-card">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Agence</th>
                        <th>Opérateur</th>
                        <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Statut</th>
                        <th>Flotte</th>
                        <th>Revenus Est.</th>
                        <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>Date Création</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {agencies.map((agency) => (
                        <tr key={agency.id}>
                            <td>
                                <div
                                    className="agency-name-cell"
                                    onClick={() => {
                                        setDetailAgencyId(agency.id);
                                        setIsDetailOpen(true);
                                    }}
                                >
                                    <div className="agency-avatar-modern">
                                        <Building2 size={18} />
                                    </div>
                                    <div className="agency-info">
                                        <h4>{agency.name}</h4>
                                        <span className="agency-id-sub">#{agency.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="operator-info">
                                    <span className="operator-name">{agency.owner_name}</span>
                                    <span className="operator-email">{agency.owner_email}</span>
                                </div>
                            </td>
                            <td>{getStatusBadge(agency.status)}</td>
                            <td>
                                <span className="metric-cell-modern">{agency.cars_count}</span>
                            </td>
                            <td>
                                <span className="metric-cell-modern">{Number(agency.revenue_est || 0).toLocaleString()} DH</span>
                            </td>
                            <td>
                                <span className="text-sm text-gray-500">{new Date(agency.created_at).toLocaleDateString()}</span>
                            </td>
                            <td>
                                <div className="action-buttons-centered">
                                    <button
                                        className="action-btn-new edit"
                                        title="Modifier"
                                        onClick={() => handleEditClick(agency)}
                                        disabled={actionLoadingId === agency.id}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        className={`action-btn-new ${agency.status === 'active' ? 'suspend' : 'activate'}`}
                                        title={agency.status === 'active' ? 'Suspendre' : 'Activer'}
                                        onClick={() => handleStatusToggle(agency.id, agency.status)}
                                        disabled={actionLoadingId === agency.id}
                                    >
                                        {actionLoadingId === agency.id ? (
                                            <span className="spinner-icon" />
                                        ) : agency.status === 'active' ? (
                                            <XCircle size={18} />
                                        ) : (
                                            <Zap size={18} />
                                        )}
                                    </button>
                                    <button
                                        className="action-btn-new delete"
                                        title="Supprimer"
                                        onClick={() => handleDeleteClick(agency)}
                                        disabled={actionLoadingId === agency.id}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        className="action-btn-new details"
                                        title="Voir détails"
                                        onClick={() => {
                                            setDetailAgencyId(agency.id);
                                            setIsDetailOpen(true);
                                        }}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPagination = () => {
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages <= 1) return null;

        return (
            <div className="pagination-modern">
                <button
                    disabled={page === 0}
                    onClick={() => setPage(prev => prev - 1)}
                    className="page-btn-modern"
                >
                    Précédent
                </button>
                <div className="page-info-modern">
                    Page {page + 1} sur {totalPages} ({totalItems} Agences)
                </div>
                <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(prev => prev + 1)}
                    className="page-btn-modern"
                >
                    Suivant
                </button>
            </div>
        );
    };

    // --- Stats Fetching ---
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        fleet: 0,
        revenue: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const { data, error } = await supabase.rpc('get_dashboard_stats');
            if (!error && data) {
                setStats({
                    total: data.metrics.agencies.total,
                    active: data.metrics.agencies.active || 0, // Assuming this field exists or I'll use filtered length valid for small datasets, but better from RPC
                    fleet: data.metrics.cars.total,
                    revenue: data.metrics.revenue.total
                });
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="agencies-container">
            {/* Header Modern */}
            <header className="agencies-header-modern">
                <div className="header-content">
                    <h1>Gestion des Agences</h1>
                    <p className="header-subtitle">Administrez les partenaires et surveillez leur performance.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary-modern" onClick={() => setIsAddModalOpen(true)}>
                        <Cpu size={18} />
                        <span>Nouvelle Agence</span>
                    </button>
                </div>
            </header>

            {/* KPI Cards Section */}
            <div className="kpi-grid-modern">
                <div className="kpi-card-modern blue">
                    <div className="kpi-icon-modern">
                        <Building2 size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Total Agences</span>
                        <span className="kpi-value-modern">{stats.total}</span>
                    </div>
                </div>
                <div className="kpi-card-modern green">
                    <div className="kpi-icon-modern">
                        <Zap size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Agences Actives</span>
                        {/* Fallback estimation if 'active' isn't in RPC, but usually it is or we relate to total */}
                        <span className="kpi-value-modern">{agencies.filter(a => a.status === 'active').length} <span className="text-sm font-normal text-gray-400">/ page</span></span>
                    </div>
                </div>
                <div className="kpi-card-modern orange">
                    <div className="kpi-icon-modern">
                        <Car size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Flotte Totale</span>
                        <span className="kpi-value-modern">{stats.fleet}</span>
                    </div>
                </div>
                <div className="kpi-card-modern purple">
                    <div className="kpi-icon-modern">
                        <Wallet size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Revenus Est.</span>
                        <span className="kpi-value-modern">{(stats.revenue / 1000).toFixed(1)}k DH</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar-section">
                <div className="search-group">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher une agence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ width: '250px' }}>
                    <PremiumSelect
                        options={protocolOptions}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        icon={ShieldAlert}
                    />
                </div>
            </div>

            <AddAgencyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />

            <EditAgencyModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setCurrentAgency(null);
                }}
                onSuccess={() => {
                    setSuccessMessage('Agence mise à jour.');
                    setIsSuccessModalOpen(true);
                    fetchAgencies();
                }}
                agencyData={currentAgency}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setCurrentAgency(null);
                }}
                onConfirm={handleConfirmDelete}
                agencyName={currentAgency?.name}
                loading={actionLoading}
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                message={successMessage}
            />

            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                message={errorMessage}
            />

            <AgencyDetailDrawer
                isOpen={isDetailOpen}
                agencyId={detailAgencyId}
                onClose={() => {
                    setIsDetailOpen(false);
                    setDetailAgencyId(null);
                }}
                onEdit={(agencyData) => {
                    handleEditClick(agencyData);
                }}
            />

            {error && (
                <ErrorMessage
                    message={error}
                    onDismiss={() => setError(null)}
                    retry={fetchAgencies}
                    retryLabel="Réessayer"
                />
            )}

            {loading ? (
                <div className="loading-skeleton">
                    <LoadingSpinner />
                </div>
            ) : agencies.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title={searchTerm ? 'Aucune agence trouvée' : 'Aucune agence enregistrée'}
                    message={searchTerm
                        ? 'Aucune agence ne correspond à votre recherche.'
                        : 'Aucune agence n\'a encore été créée dans le système.'}
                    actionLabel="Créer une agence"
                    onAction={() => setIsAddModalOpen(true)}
                />
            ) : (
                <>
                    <div className="desktop-view-modern">
                        {renderDesktopTable()}
                    </div>
                    <div className="mobile-view-modern">
                        {renderMobileCards()}
                    </div>
                    {renderPagination()}
                </>
            )}
        </div>
    );
};

export default AgenciesTab;
