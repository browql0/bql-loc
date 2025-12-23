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
import './staff.css';

const StaffTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    const staffMembers = [
        { id: 1, name: 'Amine Alaoui', role: 'Gestionnaire', email: 'amine@bql.com', status: 'Actif', joins: '12 Jan 2024' },
        { id: 2, name: 'Siham Berrada', role: 'Agent Accueil', email: 'siham@bql.com', status: 'Actif', joins: '05 Mar 2024' },
        { id: 3, name: 'Yassine Karim', role: 'Chauffeur', email: 'yassine@bql.com', status: 'En Congé', joins: '20 Fév 2024' },
    ];

    const filteredStaff = staffMembers.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <select className="filter-select">
                        <option>Tous les rôles</option>
                        <option>Gestionnaire</option>
                        <option>Agent Accueil</option>
                        <option>Chauffeur</option>
                    </select>
                </div>
            </div>

            <div className="staff-grid">
                {filteredStaff.map((staff) => (
                    <div key={staff.id} className="staff-card">
                        <div className="card-top">
                            <div className="status-badge" data-status={staff.status}>{staff.status}</div>
                            <button className="more-btn"><MoreVertical size={16} /></button>
                        </div>

                        <div className="staff-main">
                            <div className="staff-avatar-large">
                                <User size={32} />
                            </div>
                            <h3>{staff.name}</h3>
                            <div className="staff-role-badge">{staff.role}</div>
                        </div>

                        <div className="staff-details">
                            <div className="detail-item">
                                <Mail size={14} />
                                <span>{staff.email}</span>
                            </div>
                            <div className="detail-item">
                                <Calendar size={14} />
                                <span>Inscrit le {staff.joins}</span>
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
                                <Edit2 size={16} />
                                <span>Modifier</span>
                            </button>
                            <button className="action-btn delete">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StaffTab;
