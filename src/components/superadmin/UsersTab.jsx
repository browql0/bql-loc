import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Search,
    User,
    Mail,
    Shield,
    Building2,
    Calendar,
    Filter,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    UserCircle,
    Crown,
    Users,
    Phone,
    Trash2,
    Ban,
    Zap,
    History,
    FileText,
    Pencil,
    XCircle
} from 'lucide-react';
import PremiumSelect from '../owner/PremiumSelect';
import ErrorMessage from '../ErrorMessage';
import EmptyState from '../EmptyState';
import LoadingSpinner from '../LoadingSpinner';
import UserActionModal from './UserActionModal';
import UserDetailDrawer from './UserDetailDrawer';
import UserEditModal from './UserEditModal';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';
import './UsersTab.css';

const UsersTab = () => {
    // Data State
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, superadmin: 0, owner: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination State
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [sortConfig, setSortConfig] = useState({ column: 'created_at', direction: 'DESC' });

    // UI/Action State
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Modals
    const [editModal, setEditModal] = useState({ isOpen: false, user: null });
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null, user: null });
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    // --- Data Fetching ---

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Using Enterprise RPC for pagination & filtering
            const { data, error: rpcError } = await supabase.rpc('get_users_enterprise', {
                search_term: searchTerm.trim(),
                status_filter: statusFilter === 'all' ? null : statusFilter,
                role_filter: roleFilter,
                limit_val: pageSize,
                offset_val: page * pageSize,
                sort_column: sortConfig.column,
                sort_direction: sortConfig.direction
            });

            if (rpcError) throw rpcError;

            // RPC return format: [{...user_fields, total_count}]
            setUsers(data || []);
            setTotalItems(data?.[0]?.total_count || 0);

            // Fetch generic stats (can be optimized later to specialized RPC)
            await fetchStats();

            setError(null);
        } catch (err) {
            console.error('Fetch Users Error:', err);
            setError(err.message || 'Erreur lors du chargement des utilisateurs.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        // Quick stats query (RLS protected)
        const { data, error } = await supabase
            .from('profiles')
            .select('role, status');

        if (!error && data) {
            setStats({
                total: data.length,
                active: data.filter(u => u.status === 'active' || !u.status).length, // fallback for legacy
                superadmin: data.filter(u => u.role === 'superadmin').length,
                owner: data.filter(u => u.role === 'owner').length
            });
        }
    };

    // Debounced Search & Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter, statusFilter, page, sortConfig]);

    // --- Actions ---

    const handleSort = (column) => {
        setSortConfig(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'ASC' ? 'DESC' : 'ASC'
        }));
        setPage(0); // Reset to first page
    };

    const handleActionClick = (user, type) => {
        setActionModal({ isOpen: true, type, user });
    };

    const confirmAction = async () => {
        const { type, user } = actionModal;
        if (!user || !type) return;

        setActionLoadingId(user.id);
        try {
            if (type === 'delete') {
                const { data, error } = await supabase.rpc('delete_user_admin', {
                    user_id_input: user.id
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error);

                setSuccessModal({
                    isOpen: true,
                    message: `Utilisateur supprimé définitivement.`
                });
            } else if (type === 'suspend' || type === 'activate') {
                const newStatus = type === 'suspend' ? 'suspended' : 'active';
                const { data, error } = await supabase.rpc('set_user_status', {
                    user_id_input: user.id,
                    new_status: newStatus
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error);

                setSuccessModal({
                    isOpen: true,
                    message: `Utilisateur ${type === 'suspend' ? 'suspendu' : 'réactivé'} avec succès.`
                });
            }

            fetchUsers();
            setActionModal({ isOpen: false, type: null, user: null });
        } catch (err) {
            setErrorModal({ isOpen: true, message: err.message });
        } finally {
            setActionLoadingId(null);
        }
    };

    // --- Render Helpers ---

    const getRoleBadge = (role) => {
        switch (role) {
            case 'superadmin': return <span className="role-pill admin">Superadmin</span>;
            case 'owner': return <span className="role-pill owner">Gérant</span>;
            case 'staff': return <span className="role-pill staff">Staff</span>;
            default: return <span className="role-pill default">{role}</span>;
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            active: { label: 'Actif', class: 'active' },
            suspended: { label: 'Suspendu', class: 'suspended' },
            blocked: { label: 'Bloqué', class: 'blocked' }
        };
        const c = config[status] || { label: 'Actif', class: 'active' }; // Default to active
        return (
            <span className={`status-badge-modern ${c.class}`}>
                <span className="status-dot"></span>
                {c.label}
            </span>
        );
    };

    const filterOptions = [
        { value: 'all', label: 'Tous les rôles' },
        { value: 'superadmin', label: 'Superadmins' },
        { value: 'owner', label: 'Gérants (Owners)' },
        { value: 'staff', label: 'Personnels (Staff)' }
    ];

    const statusOptions = [
        { value: 'all', label: 'Tous les statuts' },
        { value: 'active', label: 'Actifs' },
        { value: 'suspended', label: 'Suspendus' },
        { value: 'blocked', label: 'Bloqués' }
    ];

    // --- Views ---

    const renderDesktopTable = () => (
        <div className="users-table-card">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('full_name')} className="sortable-th">Utilisateur</th>
                        <th onClick={() => handleSort('role')} className="sortable-th">Rôle</th>
                        <th>Statut</th>
                        <th>Agence</th>
                        <th>Contact</th>
                        <th onClick={() => handleSort('created_at')} className="sortable-th">Inscription</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <div className="user-cell" onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}>
                                    <div className="user-avatar-mini">
                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="user-text">
                                        <span className="user-name">{user.full_name || 'Utilisateur'}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td>{getRoleBadge(user.role)}</td>
                            <td>{getStatusBadge(user.status)}</td>
                            <td>
                                {user.agency_name ? (
                                    <div className="agency-tag">
                                        <Building2 size={12} />
                                        {user.agency_name}
                                    </div>
                                ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td>
                                <span className="phone-mini">{user.phone || '-'}</span>
                            </td>
                            <td>
                                <div className="date-cell">
                                    <Calendar size={12} />
                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                </div>
                            </td>
                            <td>
                                <div className="action-buttons-centered">
                                    <button
                                        className="action-btn-new edit"
                                        title="Voir détails"
                                        onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {user.status === 'suspended' ? (
                                        <button
                                            className="action-btn-new activate"
                                            title="Réactiver"
                                            onClick={() => handleActionClick(user, 'activate')}
                                            disabled={actionLoadingId === user.id}
                                        >
                                            <Zap size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            className="action-btn-new suspend"
                                            title="Suspendre"
                                            onClick={() => handleActionClick(user, 'suspend')}
                                            disabled={actionLoadingId === user.id || user.role === 'superadmin'}
                                        >
                                            <Ban size={16} />
                                        </button>
                                    )}

                                    <button
                                        className="action-btn-new delete"
                                        title="Supprimer"
                                        onClick={() => handleActionClick(user, 'delete')}
                                        disabled={actionLoadingId === user.id || user.role === 'superadmin'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderMobileCards = () => (
        <div className="mobile-cards-modern">
            {users.map((user) => (
                <div key={user.id} className="user-card-modern">
                    <div className="card-header-modern">
                        <div className="card-header-left">
                            <div className="user-avatar-modern">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="user-info">
                                <h4>{user.full_name || 'Sans nom'}</h4>
                                <span className="user-email-sub">{user.email}</span>
                            </div>
                        </div>
                        {getStatusBadge(user.status)}
                    </div>

                    <div className="card-info-row">
                        <div className="info-col">
                            <span className="label"><Shield size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Rôle</span>
                            {getRoleBadge(user.role)}
                        </div>
                        <div className="info-col">
                            <span className="label"><Building2 size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Agence</span>
                            <span className="value">{user.agency_name || '-'}</span>
                        </div>
                    </div>

                    <div className="mobile-actions-row">
                        <button
                            className="action-btn-new"
                            onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}
                        >
                            <User size={18} />
                        </button>
                        {user.status === 'suspended' ? (
                            <button
                                className="action-btn-new activate"
                                onClick={() => handleActionClick(user, 'activate')}
                            >
                                <Zap size={18} />
                            </button>
                        ) : (
                            <button
                                className="action-btn-new suspend"
                                onClick={() => handleActionClick(user, 'suspend')}
                                disabled={user.role === 'superadmin'}
                            >
                                <Ban size={18} />
                            </button>
                        )}
                        <button
                            className="action-btn-new delete"
                            onClick={() => handleActionClick(user, 'delete')}
                            disabled={user.role === 'superadmin'}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
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
                    Page {page + 1} sur {totalPages} ({totalItems} Utilisateurs)
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

    return (
        <div className="users-tab">
            {/* Header */}
            <header className="users-header-modern">
                <div className="header-content">
                    <h1>Gestion des Utilisateurs</h1>
                    <p className="header-subtitle">Administrez l'ensemble des comptes de l'écosystème.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-pill">
                        <Users size={14} />
                        <span>{stats.total} Total</span>
                    </div>
                    <div className="stat-pill success">
                        <CheckCircle2 size={14} />
                        <span>{stats.active} Actifs</span>
                    </div>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="kpi-grid-modern">
                <div className="kpi-card-modern blue">
                    <div className="kpi-icon-modern">
                        <Users size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Utilisateurs</span>
                        <span className="kpi-value-modern">{stats.total}</span>
                    </div>
                </div>
                <div className="kpi-card-modern purple">
                    <div className="kpi-icon-modern">
                        <Crown size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Superadmins</span>
                        <span className="kpi-value-modern">{stats.superadmin}</span>
                    </div>
                </div>
                <div className="kpi-card-modern orange">
                    <div className="kpi-icon-modern">
                        <Shield size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Gérants</span>
                        <span className="kpi-value-modern">{stats.owner}</span>
                    </div>
                </div>
                <div className="kpi-card-modern green">
                    <div className="kpi-icon-modern">
                        <Zap size={20} />
                    </div>
                    <div className="kpi-content-modern">
                        <span className="kpi-label-modern">Comptes Actifs</span>
                        <span className="kpi-value-modern">{stats.active}</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar-section">
                <div className="search-group">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters-row">
                    <div style={{ width: '200px' }}>
                        <PremiumSelect
                            options={roleFilter === 'all' ? filterOptions : filterOptions} // Simplified binding
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            icon={Filter}
                        />
                    </div>
                    <div style={{ width: '200px' }}>
                        <PremiumSelect
                            options={statusOptions}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            icon={CheckCircle2}
                        />
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <ErrorMessage
                    message={error}
                    onDismiss={() => setError(null)}
                    retry={fetchUsers}
                />
            )}

            {/* Main Content */}
            {loading ? (
                <div className="loading-skeleton">
                    <LoadingSpinner message="Chargement des utilisateurs..." />
                </div>
            ) : users.length === 0 ? (
                <EmptyState
                    icon={UserCircle}
                    title={searchTerm ? 'Aucun résultat' : 'Aucun utilisateur'}
                    message={searchTerm
                        ? 'Essayez de modifier vos termes de recherche ou filtres.'
                        : 'La base de données des utilisateurs est vide.'}
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

            {/* Drawers & Modals */}
            <UserDetailDrawer
                isOpen={isDetailOpen}
                user={selectedUser}
                onClose={() => setIsDetailOpen(false)}
                onEdit={(u) => {
                    setIsDetailOpen(false); // Close detail drawer
                    setEditModal({ isOpen: true, user: u }); // Open edit modal
                }}
            />

            <UserEditModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ ...editModal, isOpen: false })}
                user={editModal.user}
                onSaveSuccess={() => {
                    fetchUsers();
                    setSuccessModal({ isOpen: true, message: 'Profil utilisateur mis à jour avec succès.' });
                }}
            />

            <UserActionModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal({ ...actionModal, isOpen: false })}
                onConfirm={confirmAction}
                userName={actionModal.user?.full_name}
                actionType={actionModal.type}
                loading={actionLoadingId !== null}
            />

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                message={successModal.message}
            />

            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                message={errorModal.message}
            />
        </div>
    );
};

export default UsersTab;
