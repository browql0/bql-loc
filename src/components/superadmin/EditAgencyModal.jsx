import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X,
    User,
    Building2,
    Mail,
    Phone,
    CheckCircle,
    Sparkles
} from 'lucide-react';
import './AddAgencyModal.css'; // Reusing the same styles

const EditAgencyModal = ({ isOpen, onClose, onSuccess, agencyData }) => {
    const [formData, setFormData] = useState({
        agencyName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (agencyData) {
            setFormData({
                agencyName: agencyData.name || '',
                ownerName: agencyData.owner || '',
                ownerEmail: agencyData.email || '',
                ownerPhone: agencyData.phone || ''
            });
        }
    }, [agencyData, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('update_agency_details', {
                agency_id_input: agencyData.id,
                agency_name_text: formData.agencyName,
                owner_name_text: formData.ownerName,
                owner_email_text: formData.ownerEmail,
                owner_phone_text: formData.ownerPhone
            });

            if (error) throw error;

            if (!data || !data.success) {
                throw new Error(data?.error || 'Erreur inconnue lors de la mise à jour');
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            const errorMessage = error?.message || 'Erreur lors de la mise à jour de l\'agence.';
            alert(`Erreur: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay-zen" onClick={onClose}>
            <div className="modal-card-zen animate-scale-up" onClick={e => e.stopPropagation()}>

                <div className="modal-header-zen">
                    <div className="header-icon-zen">
                        <Sparkles size={20} />
                    </div>
                    <div className="header-text-zen">
                        <h2>Modifier l'Agence</h2>
                        <p>Mise à jour des informations</p>
                    </div>
                    <button className="close-btn-zen" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form-zen">
                    <div className="scroll-content-zen">

                        <div className="input-group-zen">
                            <label>Nom de l'Agence</label>
                            <div className="input-wrapper-zen">
                                <Building2 size={18} className="input-icon-zen" />
                                <input
                                    type="text"
                                    name="agencyName"
                                    placeholder="Nom de l'agence"
                                    value={formData.agencyName}
                                    onChange={handleInputChange}
                                    required
                                />
                                <div className="input-glow"></div>
                            </div>
                        </div>

                        <div className="separator-zen">
                            <span>Informations Propriétaire</span>
                        </div>

                        <div className="input-group-zen">
                            <label>Nom complet</label>
                            <div className="input-wrapper-zen">
                                <User size={18} className="input-icon-zen" />
                                <input
                                    type="text"
                                    name="ownerName"
                                    placeholder="Nom du propriétaire"
                                    value={formData.ownerName}
                                    onChange={handleInputChange}
                                    required
                                />
                                <div className="input-glow"></div>
                            </div>
                        </div>

                        <div className="row-zen">
                            <div className="input-group-zen">
                                <label>Email professionnel</label>
                                <div className="input-wrapper-zen">
                                    <Mail size={18} className="input-icon-zen" />
                                    <input
                                        type="email"
                                        name="ownerEmail"
                                        placeholder="Email"
                                        value={formData.ownerEmail}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <div className="input-glow"></div>
                                </div>
                            </div>
                            <div className="input-group-zen">
                                <label>Téléphone</label>
                                <div className="input-wrapper-zen">
                                    <Phone size={18} className="input-icon-zen" />
                                    <input
                                        type="tel"
                                        name="ownerPhone"
                                        placeholder="Téléphone"
                                        value={formData.ownerPhone}
                                        onChange={handleInputChange}
                                    />
                                    <div className="input-glow"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer-zen">
                        <button type="button" className="btn-cancel-zen" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-submit-zen" disabled={loading}>
                            {loading ? <span className="loader-dot"></span> : <CheckCircle size={18} />}
                            <span>{loading ? 'Mise à jour...' : 'Sauvegarder'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAgencyModal;
