import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, Mail, Phone, CheckCircle } from 'lucide-react';
import './AddStaffModal.css';

const EditClientModal = ({ isOpen, onClose, clientData, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (clientData) {
            setFormData({
                name: clientData.name || '',
                email: clientData.email || '',
                phone: clientData.phone || ''
            });
        }
    }, [clientData]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                })
                .eq('id', clientData.id);

            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            const errorMessage = error?.message || 'Erreur lors de la mise à jour du client.';
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
                    <h2>Modifier Client</h2>
                    <p>Mettre à jour les informations du client</p>
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
                                {loading ? 'Sauvegarde...' : 'Sauvegarder'} <CheckCircle size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditClientModal;
