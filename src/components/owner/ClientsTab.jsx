import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    User,
    Mail,
    Phone,
    MoreVertical
} from 'lucide-react';
import './clients.css';
import AddClientModal from './AddClientModal';
import EditClientModal from './EditClientModal';

const ClientsTab = () => {
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
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce client ?")) return;
        try {
            await supabase.from('clients').delete().eq('id', id);
            fetchClients();
        } catch (error) {
            console.error(error);
        }
    };


    return (
        <div className="clients-tab" style={{ padding: '2rem' }}>
            <div className="tab-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-info">
                    <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gestion Clients</h2>
                    <p style={{ color: '#94a3b8' }}>Gérez votre base de clients.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    <Plus size={18} />
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

            <div className="search-bar" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem',
                maxWidth: '400px'
            }}>
                <Search size={18} color="#94a3b8" />
                <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                />
            </div>

            <div className="clients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {loading ? <div style={{ color: 'white' }}>Chargement...</div> : filteredClients.map(client => (
                    <div key={client.id} style={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#cbd5e1'
                                }}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'white', margin: 0 }}>{client.name}</h3>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Client</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => {
                                    setSelectedClient(client);
                                    setIsEditModalOpen(true);
                                }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(client.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {client.email && (
                                <div style={{ display: 'flex', gap: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                    <Mail size={16} color="#64748b" />
                                    {client.email}
                                </div>
                            )}
                            {client.phone && (
                                <div style={{ display: 'flex', gap: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                    <Phone size={16} color="#64748b" />
                                    {client.phone}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientsTab;
