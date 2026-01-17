import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X,
    User,
    Building2,
    Mail,
    Phone,
    CheckCircle,
    Lock,
    Eye,
    EyeOff,
    Sparkles,
    Shield
} from 'lucide-react';
import './AddAgencyModal.css';

const AddAgencyModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        agencyName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
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
            const { data, error } = await supabase.rpc('create_agency_with_owner', {
                agency_name_text: formData.agencyName,
                owner_name_text: formData.ownerName,
                owner_email_text: formData.ownerEmail,
                owner_phone_text: formData.ownerPhone,
                owner_password_text: formData.password
            });

            if (error) throw error;

            if (!data || !data.success) {
                throw new Error(data?.error || 'Erreur inconnue lors de la création');
            }

            if (onSuccess) onSuccess();
            setFormData({
                agencyName: '',
                ownerName: '',
                ownerEmail: '',
                ownerPhone: '',
                password: ''
            });
            onClose();
        } catch (error) {
            const errorMessage = error?.message || 'Erreur lors de l\'ajout de l\'agence.';
            alert(`Erreur: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay-zen" onClick={onClose}>
            <div className="modal-card-zen animate-scale-up" onClick={e => e.stopPropagation()}>

                {/* Header Section */}
                <div className="modal-header-zen">
                    <div className="header-icon-zen">
                        <Sparkles size={20} />
                    </div>
                    <div className="header-text-zen">
                        <h2>Nouvelle Agence</h2>
                        <p>Configuration de l'espace partenaire</p>
                    </div>
                    <button className="close-btn-zen" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form-zen">
                    <div className="scroll-content-zen">

                        {/* Section 1: Agency */}
                        <div className="input-group-zen">
                            <label>Nom de l'Agence</label>
                            <div className="input-wrapper-zen">
                                <Building2 size={18} className="input-icon-zen" />
                                <input
                                    type="text"
                                    name="agencyName"
                                    placeholder="Luxe Cars Marrakech"
                                    value={formData.agencyName}
                                    onChange={handleInputChange}
                                    required
                                    autoFocus
                                />
                                <div className="input-glow"></div>
                            </div>
                        </div>

                        <div className="separator-zen">
                            <span>Informations Propriétaire</span>
                        </div>

                        {/* Section 2: Owner */}
                        <div className="input-group-zen">
                            <label>Nom complet</label>
                            <div className="input-wrapper-zen">
                                <User size={18} className="input-icon-zen" />
                                <input
                                    type="text"
                                    name="ownerName"
                                    placeholder="Karim Benjelloun"
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
                                        placeholder="contact@agence.com"
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
                                        placeholder="+212 6..."
                                        value={formData.ownerPhone}
                                        onChange={handleInputChange}
                                    />
                                    <div className="input-glow"></div>
                                </div>
                            </div>
                        </div>

                        <div className="input-group-zen">
                            <label>Mot de passe initial</label>
                            <div className="input-wrapper-zen">
                                <Lock size={18} className="input-icon-zen" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="pwd-toggle-zen"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <div className="input-glow"></div>
                            </div>
                        </div>

                    </div>

                    <div className="footer-zen">
                        <button type="button" className="btn-cancel-zen" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-submit-zen" disabled={loading}>
                            {loading ? <span className="loader-dot"></span> : <CheckCircle size={18} />}
                            <span>{loading ? 'Création...' : 'Créer le Compte'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAgencyModal;
