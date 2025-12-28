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
    User
} from 'lucide-react';
import './AgenciesTab.css';

import AddAgencyModal from './AddAgencyModal';
import EditAgencyModal from './EditAgencyModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import SuccessModal from './SuccessModal';
import { Pencil } from 'lucide-react';

const AgenciesTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [agencies, setAgencies] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [currentAgency, setCurrentAgency] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAgencies = async () => {
        setLoading(true);
        try {
            // Fetch agencies with their owner info
            // Profiles joined by agency_id where role is owner
            const { data, error } = await supabase
                .from('agencies')
                .select(`
                    *,
                    profiles!inner (
                        full_name,
                        email,
                        phone,
                        role
                    )
                `)
                .eq('profiles.role', 'owner')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data for UI
            const formatted = data.map(agency => ({
                id: agency.id,
                name: agency.name,
                owner: agency.profiles?.[0]?.full_name || 'N/A',
                email: agency.profiles?.[0]?.email || 'N/A',
                phone: agency.profiles?.[0]?.phone || '',
                status: 'active', // TODO: Add status column to agencies table if needed
                revenue: '0 MAD', // Placeholder
                cars: 0, // Placeholder
                created_at: agency.created_at
            }));

            setAgencies(formatted);
        } catch (error) {
            console.error('Error fetching agencies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgencies();
    }, []);

    const filteredAgencies = agencies.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        if (status === 'active') {
            return <span className="status-badge active"><CheckCircle2 size={12} /> Actif</span>;
        }
        return <span className="status-badge pending"><Shield size={12} /> En attente</span>;
    };

    const handleDeleteClick = (agency) => {
        setCurrentAgency(agency);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!currentAgency) return;
        setActionLoading(true);
        try {
            const { data, error } = await supabase.rpc('delete_agency', { agency_id_input: currentAgency.id });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            setIsDeleteModalOpen(false);
            setSuccessMessage(`L'agence "${currentAgency.name}" a été supprimée.`);
            setIsSuccessModalOpen(true);
            fetchAgencies();
        } catch (error) {
            console.error('Error deleting agency:', error);
            alert('Erreur: ' + error.message);
        } finally {
            setActionLoading(false);
            setCurrentAgency(null);
        }
    };

    const handleEditClick = (agency) => {
        setCurrentAgency(agency);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setSuccessMessage('Les informations de l\'agence ont été mises à jour.');
        setIsSuccessModalOpen(true);
        fetchAgencies();
    };

    const handleAddSuccess = () => {
        setSuccessMessage('La nouvelle agence a été créée avec succès.');
        setIsSuccessModalOpen(true);
        fetchAgencies();
    };

    return (
        <div className="agencies-tab">
            <div className="tab-header-row">
                <div className="header-info">
                    <h2>Gestion des Agences</h2>
                    <p>Supervisez et modérez les agences partenaires.</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar-tab">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher une agence..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary-black" onClick={() => setIsModalOpen(true)}>
                        <Building2 size={16} />
                        <span>Nouvelle Agence</span>
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
                onSuccess={handleEditSuccess}
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

            <div className="table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Agence</th>
                            <th>Propriétaire</th>
                            <th>Statut</th>
                            <th>Flotte</th>
                            <th>Revenu (Est.)</th>
                            <th>Date Création</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAgencies.map((agency) => (
                            <tr key={agency.id}>
                                <td>
                                    <div className="agency-cell">
                                        <div className="agency-icon">
                                            <Building2 size={16} />
                                        </div>
                                        <span>{agency.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="owner-cell">
                                        <div className="owner-avatar">
                                            <User size={14} />
                                        </div>
                                        <div className="owner-info">
                                            <span className="owner-name">{agency.owner}</span>
                                            <span className="owner-email">{agency.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{getStatusBadge(agency.status)}</td>
                                <td className="font-mono">{agency.cars} vhc.</td>
                                <td className="font-mono font-bold">{agency.revenue}</td>
                                <td className="text-muted">{new Date(agency.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="actions-cell">
                                        <button
                                            className="icon-action-btn delete-btn"
                                            onClick={() => handleDeleteClick(agency)}
                                            title="Supprimer l'agence"
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            className="icon-action-btn edit-btn"
                                            onClick={() => handleEditClick(agency)}
                                            title="Modifier l'agence"
                                        >
                                            <Pencil size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredAgencies.length === 0 && (
                    <div className="empty-state">
                        <p>Aucune agence trouvée.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgenciesTab;
