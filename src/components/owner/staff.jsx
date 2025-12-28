import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    ShieldCheck,
    User
} from 'lucide-react';
import AddStaffModal from './AddStaffModal';
import EditStaffModal from './EditStaffModal';
import PremiumSelect from './PremiumSelect';
import './staff.css';

const StaffTab = ({ agencyId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedStaffRole, setSelectedStaffRole] = useState('Tous les rôles');
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ? (Cela ne supprime pas encore le compte Auth, mais retire l\'accès au dashboard)')) return;

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            setStaffMembers(prev => prev.filter(member => member.id !== id));
        } catch (error) {
            console.error('Error deleting staff:', error);
            alert('Erreur lors de la suppression.');
        }
    };

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                // .eq('role', 'staff') // Optionally filter by role if needed
                .neq('role', 'owner'); // Exclude owner self if desired

            if (error) throw error;
            setStaffMembers(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const roleOptions = [
        { value: 'Tous les rôles', label: 'Tous les rôles' },
        { value: 'staff', label: 'Staff' },
        { value: 'Gestionnaire', label: 'Gestionnaire' },
        { value: 'Chauffeur', label: 'Chauffeur' },
    ];

    const filteredStaff = staffMembers.filter(staff => {
        const matchesSearch = (staff.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedStaffRole === 'Tous les rôles' || staff.role === selectedStaffRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="staff-tab">
            <div className="tab-header">
                <div className="header-info">
                    <h2>Gestion de l'Équipe</h2>
                    <p>Gérez les membres de votre équipe et leurs permissions.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    <span>Ajouter Staff</span>
                </button>
            </div>

            <AddStaffModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                agencyId={agencyId}
                onSuccess={fetchStaff}
            />
            <EditStaffModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                staffData={selectedStaff}
                onSuccess={fetchStaff}
            />

            <div className="tab-actions">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un membre par email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <PremiumSelect
                        options={roleOptions}
                        value={selectedStaffRole}
                        onChange={(e) => setSelectedStaffRole(e.target.value)}
                    />
                </div>
            </div>

            <div className="staff-grid">
                {loading ? <div style={{ color: 'white' }}>Chargement...</div> : filteredStaff.map((staff) => {
                    const initials = (staff.email || 'User').substring(0, 2).toUpperCase();

                    return (
                        <div key={staff.id} className="staff-card">
                            <div className="card-top">
                                <div className="status-badge" data-status="Actif">Actif</div>
                                <button className="more-btn"><MoreVertical size={18} /></button>
                            </div>

                            <div className="staff-main">
                                <div className="staff-avatar-wrapper">
                                    <div className="staff-avatar-large">
                                        <span className="avatar-initials">{initials}</span>
                                    </div>
                                </div>
                                <h3>{staff.email}</h3>
                                <div className="staff-role-badge">{staff.role}</div>
                            </div>

                            <div className="staff-details">
                                <div className="detail-item">
                                    <Mail size={18} />
                                    <span>{staff.email}</span>
                                </div>
                                <div className="detail-item">
                                    <Calendar size={18} />
                                    <span>Inscrit le {new Date(staff.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button
                                    className="action-btn edit"
                                    onClick={() => {
                                        setSelectedStaff(staff);
                                        setShowEditModal(true);
                                    }}
                                >
                                    <Edit2 size={18} />
                                    <span>Modifier</span>
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(staff.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StaffTab;
