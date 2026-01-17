import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, Mail, Phone, CheckCircle } from 'lucide-react';
import '../owner/AddStaffModal.css';

const EditClientModal = ({ isOpen, onClose, clientData, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        setError(null);
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Le nom est requis');
            return false;
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Email invalide');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            if (!clientData?.id) throw new Error('Client introuvable');

            const { error: updateError } = await supabase
                .from('clients')
                .update({
                    name: formData.name.trim(),
                    email: formData.email.trim() || null,
                    phone: formData.phone.trim() || null
                })
                .eq('id', clientData.id);

            if (updateError) throw updateError;

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Une erreur est survenue');
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

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        margin: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

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
                                        maxLength={100}
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
                                        maxLength={255}
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
                                        maxLength={20}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-premium" style={{ marginTop: '20px' }}>
                            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="btn-confirm-premium" 
                                onClick={handleSubmit} 
                                disabled={loading}
                            >
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

