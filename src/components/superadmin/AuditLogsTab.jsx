import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Shield,
    Search,
    Filter,
    Download,
    Clock,
    User,
    Database,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import './AuditLogsTab.css';
import ErrorMessage from '../ErrorMessage';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';

const AuditLogsTab = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTable, setFilterTable] = useState('');
    const [filterAction, setFilterAction] = useState('');

    const fetchAuditLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_audit_logs', {
                limit_count: 100,
                offset_count: 0,
                filter_table: filterTable || null,
                filter_action: filterAction || null
            });

            if (rpcError) throw rpcError;

            setLogs(data || []);
        } catch (err) {
            const errorMessage = err?.message || 'Erreur lors du chargement des logs d\'audit.';
            setError(errorMessage);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [filterTable, filterAction]);

    const getActionBadge = (action) => {
        const badges = {
            'INSERT': { label: 'Création', color: 'green', icon: CheckCircle },
            'UPDATE': { label: 'Modification', color: 'blue', icon: AlertCircle },
            'DELETE': { label: 'Suppression', color: 'red', icon: AlertCircle }
        };
        const badge = badges[action] || { label: action, color: 'gray', icon: Shield };
        const Icon = badge.icon;
        return (
            <span className={`action-badge ${badge.color}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    const getRoleBadge = (role) => {
        const colors = {
            'superadmin': 'purple',
            'owner': 'blue',
            'staff': 'orange'
        };
        return <span className={`role-badge ${colors[role] || 'gray'}`}>{role || 'N/A'}</span>;
    };

    const filteredLogs = logs.filter(log =>
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportCSV = () => {
        const headers = ['Date', 'Utilisateur', 'Rôle', 'Action', 'Table', 'ID Record'];
        const rows = filteredLogs.map(log => [
            new Date(log.created_at).toLocaleString('fr-FR'),
            log.user_email || 'N/A',
            log.user_role || 'N/A',
            log.action,
            log.table_name,
            log.record_id || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="audit-logs-tab">
            <div className="tab-header-row">
                <div className="header-info">
                    <h2>
                        <Shield size={24} />
                        Logs d'Audit
                    </h2>
                    <p>Traçabilité complète des actions sensibles dans le système</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export" onClick={exportCSV} disabled={filteredLogs.length === 0}>
                        <Download size={16} />
                        <span>Exporter CSV</span>
                    </button>
                </div>
            </div>

            {error && (
                <ErrorMessage
                    message={error}
                    onDismiss={() => setError(null)}
                    retry={fetchAuditLogs}
                    retryLabel="Réessayer"
                />
            )}

            <div className="filters-row">
                <div className="search-bar-tab">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par email ou table..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="filter-select"
                    value={filterTable}
                    onChange={(e) => setFilterTable(e.target.value)}
                >
                    <option value="">Toutes les tables</option>
                    <option value="agencies">Agences</option>
                    <option value="profiles">Profils</option>
                    <option value="cars">Voitures</option>
                    <option value="clients">Clients</option>
                    <option value="bookings">Réservations</option>
                </select>

                <select
                    className="filter-select"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                >
                    <option value="">Toutes les actions</option>
                    <option value="INSERT">Créations</option>
                    <option value="UPDATE">Modifications</option>
                    <option value="DELETE">Suppressions</option>
                </select>
            </div>

            {loading ? (
                <LoadingSpinner message="Chargement des logs d'audit..." />
            ) : filteredLogs.length === 0 ? (
                <EmptyState
                    icon={Shield}
                    title="Aucun log trouvé"
                    message="Aucune action n'a été enregistrée avec ces filtres."
                />
            ) : (
                <div className="table-container">
                    <table className="modern-table audit-table">
                        <thead>
                            <tr>
                                <th><Clock size={14} /> Date & Heure</th>
                                <th><User size={14} /> Utilisateur</th>
                                <th><Shield size={14} /> Rôle</th>
                                <th><Database size={14} /> Action</th>
                                <th>Table</th>
                                <th>ID Record</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="font-mono text-sm">
                                        {new Date(log.created_at).toLocaleString('fr-FR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-small">
                                                {log.user_email?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span>{log.user_email || 'Utilisateur supprimé'}</span>
                                        </div>
                                    </td>
                                    <td>{getRoleBadge(log.user_role)}</td>
                                    <td>{getActionBadge(log.action)}</td>
                                    <td className="font-mono">{log.table_name}</td>
                                    <td className="font-mono text-muted text-sm">
                                        {log.record_id?.substring(0, 8).toUpperCase() || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredLogs.length > 0 && (
                <div className="table-footer">
                    <p className="text-muted">
                        {filteredLogs.length} log{filteredLogs.length > 1 ? 's' : ''} affiché{filteredLogs.length > 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AuditLogsTab;
