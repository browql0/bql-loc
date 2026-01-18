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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [agencies, setAgencies] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentAgency, setCurrentAgency] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [detailAgencyId, setDetailAgencyId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Advanced Navigation State
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [sortConfig, setSortConfig] = useState({ column: 'created_at', direction: 'DESC' });

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
            active: { label: 'ACTIVE', class: 'active' },
            suspended: { label: 'SUSPENDED', class: 'suspended' },
            pending: { label: 'PENDING', class: 'pending' }
        };
        const config = configs[status] || configs.pending;
        return (
            <span className={`status-badge-aqueous ${config.class}`}>
                {config.label}
            </span>
        );
    };


    const handleStatusToggle = async (agencyId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            const { error } = await supabase.rpc('set_agency_status', {
                agency_id_input: agencyId,
                new_status: newStatus
            });
            if (error) throw error;
            fetchAgencies();
        } catch (err) {
            setErrorMessage(err.message);
            setIsErrorModalOpen(true);
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

    const handleAddSuccess = () => {
        setSuccessMessage('L\'agence a été créée avec succès.');
        setIsSuccessModalOpen(true);
        fetchAgencies();
    };
    const renderMobileCards = () => (
        <div className="ultima-mobile-stack">
            {agencies.map((agency) => (
                <div key={agency.id} className="ultima-ecosystem-card">
                    <div className="card-mesh-bg"></div>

                    <div className="card-top-hud">
                        <div
                            className="agency-identity-cluster clickable"
                            onClick={() => {
                                setDetailAgencyId(agency.id);
                                setIsDetailOpen(true);
                            }}
                        >
                            <div className="surgical-avatar neon-border">
                                <Building2 size={18} />
                            </div>
                            <div className="identity-text">
                                <h3>{agency.name}</h3>
                                <span className="technical-id">NODE: {agency.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="status-indicator-mini">
                            {getStatusBadge(agency.status)}
                        </div>
                    </div>

                    <div className="card-telemetry-horizon">
                        <div className="telemetry-module">
                            <label>FLOTTE</label>
                            <div className="t-main">
                                <span className="t-value">{agency.cars_count}</span>
                                <div className="t-gauge"><div className="t-fill" style={{ width: `${Math.min((agency.cars_count / 20) * 100, 100)}%` }}></div></div>
                            </div>
                        </div>
                        <div className="telemetry-module highlight">
                            <label>REVENU EST.</label>
                            <div className="t-main">
                                <span className="t-value">{Number(agency.revenue_est || 0).toLocaleString()}</span>
                                <span className="t-unit">MAD</span>
                            </div>
                        </div>
                    </div>

                    <div className="card-action-hud">
                        <div className="owner-mini-chip">
                            <div className="owner-initials">{agency.owner_name?.slice(0, 2).toUpperCase()}</div>
                            <span>{agency.owner_name}</span>
                        </div>
                        <div className="hud-actions">
                            <button className="hud-btn" onClick={() => handleEditClick(agency)}><Pencil size={18} /></button>
                            <button className="hud-btn delete" onClick={() => handleDeleteClick(agency)}><Trash2 size={18} /></button>
                            <button
                                className={`hud-btn pulse-glow ${agency.status === 'active' ? 'suspend' : 'activate'}`}
                                onClick={() => handleStatusToggle(agency.id, agency.status)}
                                title={agency.status === 'active' ? 'Suspend protocol' : 'Initialize protocol'}
                            >
                                {agency.status === 'active' ? <XCircle size={18} /> : <Zap size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDesktopTable = () => (
        <div className="ultima-table-hull">
            <table className="ultima-instrument-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')} className="sortable">
                            <Satellite size={10} className="h-icon" /> SYSTEM_NODE
                        </th>
                        <th><User size={10} className="h-icon" /> OPERATOR</th>
                        <th onClick={() => handleSort('status')} className="sortable">
                            <Zap size={10} className="h-icon" /> PROTOCOL
                        </th>
                        <th><BarChart3 size={10} className="h-icon" /> FLEET_LOAD</th>
                        <th><Wallet size={10} className="h-icon" /> FINANCIAL_EST</th>
                        <th onClick={() => handleSort('created_at')} className="sortable">
                            <Clock size={10} className="h-icon" /> TIMECODE
                        </th>
                        <th className="text-center"><Settings size={10} className="h-icon" /> COMMAND_ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {agencies.map((agency) => (
                        <tr key={agency.id} className="ultima-row">
                            <td>
                                <div
                                    className="ultima-cell-identity clickable"
                                    onClick={() => {
                                        setDetailAgencyId(agency.id);
                                        setIsDetailOpen(true);
                                    }}
                                >
                                    <div className="node-avatar">
                                        <Building2 size={14} />
                                    </div>
                                    <div className="node-info">
                                        <span className="n-name">{agency.name}</span>
                                        <span className="n-id">{agency.id.slice(0, 12).toUpperCase()}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="operator-cell">
                                    <span className="o-name">{agency.owner_name}</span>
                                    <span className="o-email">{agency.owner_email}</span>
                                </div>
                            </td>
                            <td>{getStatusBadge(agency.status)}</td>
                            <td>
                                <div className="load-instrument">
                                    <span className="l-val">{agency.cars_count}</span>
                                    <div className="l-gauge">
                                        <div className="l-fill" style={{ width: `${Math.min((agency.cars_count / 15) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </td>
                            <td className="financial-cell">
                                {Number(agency.revenue_est || 0).toLocaleString()} <span className="unit">MAD</span>
                            </td>
                            <td className="time-cell">{new Date(agency.created_at).toLocaleDateString()}</td>
                            <td className="text-center">
                                <div className="command-cluster-btns centered">
                                    <button className="c-btn edit" title="Edit System Configuration" onClick={() => handleEditClick(agency)}><Pencil size={18} /></button>
                                    <button
                                        className={`c-btn toggle ${agency.status === 'active' ? 'suspend' : 'activate'}`}
                                        title={agency.status === 'active' ? 'Suspend Protocol' : 'Re-initialize Protocol'}
                                        onClick={() => handleStatusToggle(agency.id, agency.status)}
                                    >
                                        {agency.status === 'active' ? <XCircle size={18} /> : <Zap size={18} />}
                                    </button>
                                    <button className="c-btn delete" title="Archive Node" onClick={() => handleDeleteClick(agency)}><Trash2 size={18} /></button>
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
            <div className="pagination-controller glass-panel">
                <button
                    disabled={page === 0}
                    onClick={() => setPage(prev => prev - 1)}
                    className="pagi-btn"
                >
                    Précédent
                </button>
                <div className="pagi-info">
                    Page <strong>{page + 1}</strong> sur {totalPages}
                    <span className="pagi-count">• {totalItems} Agences</span>
                </div>
                <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(prev => prev + 1)}
                    className="pagi-btn"
                >
                    Suivant
                </button>
            </div>
        );
    };

    return (
        <div className="ultima-agencies-hud">
            {/* 1. Command Horizon v2 with Mesh & Telemetry */}
            <div className="ultima-command-horizon">
                <div className="mesh-gradient-aura"></div>

                <div className="horizon-identity-hub">
                    <div className="hud-badge">ULTIMA CORE v3.0</div>
                    <h2>Command Horizon</h2>
                    <div className="live-telemetry-nodes">
                        <div className="t-node">
                            <span className="t-label">SYSTEM_NODES</span>
                            <span className="t-value">{totalItems}</span>
                        </div>
                        <div className="t-node">
                            <span className="t-label">ACTIVE_LINK</span>
                            <span className="t-value neon-glow">
                                {agencies.filter(a => a.status === 'active').length}
                            </span>
                        </div>
                        <div className="t-node hide-mobile">
                            <span className="t-label">LATENCY</span>
                            <span className="t-value">24ms</span>
                        </div>
                    </div>
                </div>

                <div className="horizon-tactical-actions">
                    <div className="hud-search-cluster">
                        <div className="hud-input-group">
                            <Search size={14} className="hud-icon" />
                            <input
                                type="text"
                                placeholder="PROBE SYSTEM BY ID / NAME..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <PremiumSelect
                            options={protocolOptions}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            icon={ShieldAlert}
                        />
                    </div>

                    <button className="hud-btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Cpu size={16} />
                        <span>INITIALIZE_NEW_PROTOCOL</span>
                    </button>
                </div>
            </div>

            <AddAgencyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
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
                <div className="enterprise-loading-shimmer">
                    {[1, 2, 3].map(i => <div key={i} className="shimmer-card glass-panel" />)}
                </div>
            ) : agencies.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title={searchTerm ? 'Aucune agence trouvée' : 'Aucune agence enregistrée'}
                    message={searchTerm
                        ? 'Aucune agence ne correspond à votre recherche.'
                        : 'Aucune agence n\'a encore été créée dans le système.'}
                    actionLabel="Créer une agence"
                    onAction={() => setIsModalOpen(true)}
                />
            ) : (
                <>
                    {/* Dual-Mode Display */}
                    <div className="agencies-desktop-view">
                        {renderDesktopTable()}
                    </div>
                    <div className="agencies-mobile-view">
                        {renderMobileCards()}
                    </div>
                    {renderPagination()}
                </>
            )}
        </div>
    );
};

export default AgenciesTab;
