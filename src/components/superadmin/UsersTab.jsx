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
    UserCircle
} from 'lucide-react';
import './UsersTab.css';

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    email,
                    role,
                    created_at,
                    phone,
                    agencies (
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted = data.map(user => ({
                id: user.id,
                name: user.full_name || 'N/A',
                email: user.email,
                role: user.role,
                agency: user.agencies?.name || 'Système',
                phone: user.phone || 'N/A',
                created_at: user.created_at
            }));

            setUsers(formatted);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        switch (role) {
            case 'superadmin':
                return <span className="role-pill admin">Superadmin</span>;
            case 'owner':
                return <span className="role-pill owner">Gérant</span>;
            case 'staff':
                return <span className="role-pill staff">Staff</span>;
            default:
                return <span className="role-pill default">{role}</span>;
        }
    };

    return (
        <div className="users-tab">
            <div className="tab-header-row">
                <div className="header-info">
                    <h2>Gestion des Utilisateurs</h2>
                    <p>Gérez tous les comptes de l'écosystème BQL RENT.</p>
                </div>

                <div className="header-actions">
                    <div className="search-bar-tab">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-wrapper">
                        <Filter size={18} className="filter-icon" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="role-select"
                        >
                            <option value="all">Tous les rôles</option>
                            <option value="superadmin">Superadmin</option>
                            <option value="owner">Gérant (Owner)</option>
                            <option value="staff">Personnel (Staff)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="tab-loading">
                        <div className="loading-spinner"></div>
                        <span>Chargement des utilisateurs...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <UserCircle size={48} />
                        <p>Aucun utilisateur trouvé.</p>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Rôle</th>
                                <th>Agence / Entité</th>
                                <th>Contact</th>
                                <th>Inscription</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-mini">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="user-text">
                                                <span className="user-name">{user.name}</span>
                                                <span className="user-email">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td className="agency-td">
                                        <div className="agency-tag">
                                            <Building2 size={12} />
                                            {user.agency}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-info">
                                            <span className="phone-mini">{user.phone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={12} />
                                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </td>
                                    <td>
                                        <button className="icon-action-btn">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UsersTab;
