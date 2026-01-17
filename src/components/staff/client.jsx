import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Search,
    Edit2,
    User,
    Mail,
    Phone,
    Eye
} from 'lucide-react';
import './client.css';
import AddClientModal from './AddClientModal';
import EditClientModal from './EditClientModal';

const StaffClientsTab = ({ agencyId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            // Error is handled silently, loading state will show empty state
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    );

    const handleView = (client) => {
        setSelectedClient(client);
        // Could open a view modal or navigate to detail page
    };

    return (
        <div className="staff-clients-tab">
            <div className="tab-header">
                <div className="header-info">
                    <h2>Gestion Clients</h2>
                    <p>Consultez et gérez les clients de l'agence</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <User size={18} />
                    <span>Ajouter Client</span>
                </button>
            </div>

            <AddClientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchClients}
            />
            <EditClientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                clientData={selectedClient}
                onSuccess={fetchClients}
            />

            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <span>Chargement des clients...</span>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="empty-state">
                    <User size={48} />
                    <p>{searchTerm ? 'Aucun client trouvé' : 'Aucun client enregistré'}</p>
                    {!searchTerm && (
                        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                            Ajouter le premier client
                        </button>
                    )}
                </div>
            ) : (
                <div className="clients-grid">
                    {filteredClients.map(client => (
                        <div key={client.id} className="client-card">
                            <div className="client-header">
                                <div className="client-avatar">
                                    {client.name ? client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CL'}
                                </div>
                                <div className="client-actions">
                                    <button
                                        className="action-btn view"
                                        onClick={() => handleView(client)}
                                        title="Voir détails"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        className="action-btn edit"
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setIsEditModalOpen(true);
                                        }}
                                        title="Modifier"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="client-info">
                                <h3>{client.name || 'Sans nom'}</h3>
                                {client.email && (
                                    <div className="info-item">
                                        <Mail size={16} />
                                        <span>{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="info-item">
                                        <Phone size={16} />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StaffClientsTab;

