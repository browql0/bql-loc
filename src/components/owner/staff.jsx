import React, { useState } from 'react';
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

const StaffTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedStaffRole, setSelectedStaffRole] = useState('Tous les rôles');

    const staffMembers = [
        { id: 1, name: 'Amine Alaoui', role: 'Gestionnaire', email: 'amine@bql.com', status: 'Actif', joins: '12 Jan 2024' },
        { id: 2, name: 'Siham Berrada', role: 'Agent Accueil', email: 'siham@bql.com', status: 'Actif', joins: '05 Mar 2024' },
        { id: 3, name: 'Yassine Karim', role: 'Chauffeur', email: 'yassine@bql.com', status: 'En Congé', joins: '20 Fév 2024' },
    ];

    const roleOptions = [
        { value: 'Tous les rôles', label: 'Tous les rôles' },
        { value: 'Gestionnaire', label: 'Gestionnaire' },
        { value: 'Agent Accueil', label: 'Agent Accueil' },
        { value: 'Chauffeur', label: 'Chauffeur' },
    ];

    const filteredStaff = staffMembers.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.role.toLowerCase().includes(searchTerm.toLowerCase());
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

            <AddStaffModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            <EditStaffModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                staffData={selectedStaff}
            />

            <div className="tab-actions">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un membre..."
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
                {filteredStaff.map((staff) => {
                    const initials = staff.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase();

                    return (
                        <div key={staff.id} className="staff-card">
                            <div className="card-top">
                                <div className="status-badge" data-status={staff.status}>{staff.status}</div>
                                <button className="more-btn"><MoreVertical size={18} /></button>
                            </div>

                            <div className="staff-main">
                                <div className="staff-avatar-wrapper">
                                    <div className="staff-avatar-large">
                                        <span className="avatar-initials">{initials}</span>
                                    </div>
                                </div>
                                <h3>{staff.name}</h3>
                                <div className="staff-role-badge">{staff.role}</div>
                            </div>

                            <div className="staff-details">
                                <div className="detail-item">
                                    <Mail size={18} />
                                    <span>{staff.email}</span>
                                </div>
                                <div className="detail-item">
                                    <Calendar size={18} />
                                    <span>Membre depuis {staff.joins}</span>
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
                                <button className="action-btn delete">
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
