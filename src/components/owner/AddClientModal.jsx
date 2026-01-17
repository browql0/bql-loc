import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, Mail, Phone, CheckCircle } from 'lucide-react';
import './AddStaffModal.css'; // Reusing existing styles

const AddClientModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single();

            if (!profile?.agency_id) throw new Error("Agence introuvable");

            const { error } = await supabase.from('clients').insert({
                agency_id: profile.agency_id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            });

            if (error) throw error;

            if (onSuccess) onSuccess();
            setFormData({ name: '', email: '', phone: '' });
            onClose();
        } catch (error) {
            const errorMessage = error?.message || 'Erreur lors de l\'ajout du client.';
            alert(`Erreur: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-premium animate-pop-in" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <button className="close-btn-absolute" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-header-simple">
                    <h2>Nouveau Client</h2>
                    <p>Ajouter un client à votre base de données</p>
                </div>

                <div className="premium-form-wrapper">
                    <div className="premium-form">
                        <div className="form-section">
                            <div className="premium-input-group">
                                <label>Nom Complet</label>
                                <div className="premium-input-wrapper">
                                    <User size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="ex: Youssef Benali"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="premium-input-group">
                                <label>Email (Optionnel)</label>
                                <div className="premium-input-wrapper">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="client@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="premium-input-group">
                                <label>Téléphone (Optionnel)</label>
                                <div className="premium-input-wrapper">
                                    <Phone size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="06..."
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-premium" style={{ marginTop: '20px' }}>
                            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
                            <button type="button" className="btn-confirm-premium" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Ajout...' : 'Ajouter'} <CheckCircle size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddClientModal;
