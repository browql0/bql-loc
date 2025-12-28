import React, { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Shield, Calendar, Camera, Hash, Upload, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import PremiumSelect from './PremiumSelect';
import './AddStaffModal.css';

import { supabase } from '../../lib/supabase';

const EditStaffModal = ({ isOpen, onClose, staffData, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        joins: '',
        cinNumber: '',
    });

    const [previews, setPreviews] = useState({
        staffPhoto: null,
        cinDoc: null
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            // We can only update the profile row. We cannot update Auth email/metadata of another user easily.
            const updates = {
                role: 'staff', // Keep as staff for enum constraint
                // Assumed columns (see AddStaffModal)
                full_name: formData.name,
                phone: formData.phone,
                cin: formData.cinNumber,
                job_title: formData.role // Store the job title here if column exists
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', staffData.id);

            if (error) throw error;

            alert('Profil mis à jour avec succès !');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erreur: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (staffData) {
            setFormData({
                name: staffData.name || '',
                email: staffData.email || '',
                phone: staffData.phone || '',
                role: staffData.role || '',
                joins: staffData.joins || '',
                cinNumber: staffData.cinNumber || '',
            });
        }
    }, [staffData]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 2));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-premium animate-pop-in" onClick={e => e.stopPropagation()}>
                <button className="close-btn-absolute" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-split-layout">
                    {/* Left Side: Form */}
                    <div className="modal-form-side">
                        <div className="modal-side-header">
                            <div className="badge-tag">Mise à jour • Étape {currentStep}/2</div>
                            <h2>Édition Profil</h2>

                            <div className="stepper-ui">
                                <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>
                                    <div className="step-number">1</div>
                                </div>
                                <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                                <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
                                    <div className="step-number">2</div>
                                </div>
                            </div>
                        </div>

                        <div className="premium-form-wrapper">
                            <div className="premium-form scrollable-form">
                                <div className="form-sections">
                                    {/* Step 1: Personal Info */}
                                    {currentStep === 1 && (
                                        <div className="form-section step-fade-in">
                                            <h4 className="section-title">Infos Personnelles</h4>
                                            <div className="premium-input-group">
                                                <label>Nom et Prénom</label>
                                                <div className="premium-input-wrapper">
                                                    <User size={18} />
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        placeholder="ex: Amine Alaoui"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <label>Email Pro</label>
                                                    <div className="premium-input-wrapper">
                                                        <Mail size={18} />
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            placeholder="amine@bql.com"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>Téléphone</label>
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
                                        </div>
                                    )}

                                    {/* Step 2: Documents & Role */}
                                    {currentStep === 2 && (
                                        <div className="form-section step-fade-in">
                                            <h4 className="section-title">Documents & Attribution</h4>
                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <PremiumSelect
                                                        label="Rôle"
                                                        options={[
                                                            { value: 'Gestionnaire', label: 'Gestionnaire' },
                                                            { value: 'Agent Accueil', label: 'Agent Accueil' },
                                                            { value: 'Chauffeur', label: 'Chauffeur' }
                                                        ]}
                                                        value={formData.role}
                                                        onChange={handleInputChange}
                                                        icon={Shield}
                                                        placeholder="Sélectionner"
                                                    />
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>N° CIN</label>
                                                    <div className="premium-input-wrapper">
                                                        <Hash size={18} />
                                                        <input type="text" name="cinNumber" value={formData.cinNumber} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="premium-file-drop full-width" style={{ marginTop: '1rem' }}>
                                                <label>Changer la Photo</label>
                                                <div className="drop-zone small" onClick={() => document.getElementById('edit-staff-photo-input').click()}>
                                                    <input
                                                        id="edit-staff-photo-input"
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(e, 'staffPhoto')}
                                                    />
                                                    {previews.staffPhoto ? (
                                                        <div className="file-preview-filled">
                                                            <img src={previews.staffPhoto} alt="" />
                                                            <div className="replace-overlay"><Upload size={14} /></div>
                                                        </div>
                                                    ) : (
                                                        <div className="drop-zone-content">
                                                            <Camera size={20} />
                                                            <span>Mettre à jour photo</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer-premium">
                                {currentStep === 1 ? (
                                    <button type="button" className="btn-cancel" onClick={onClose}>Fermer</button>
                                ) : (
                                    <button type="button" className="btn-cancel" onClick={prevStep}>
                                        <ChevronLeft size={18} /> Retour
                                    </button>
                                )}

                                {currentStep < 2 ? (
                                    <button type="button" className="btn-confirm-premium" onClick={nextStep}>
                                        Suivant <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <button type="button" className="btn-confirm-premium" onClick={handleSubmit} disabled={loading}>
                                        {loading ? 'Sauvegarde...' : 'Sauvegarder'} <CheckCircle size={18} />
                                        <div className="btn-shine"></div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Live Preview Badge */}
                    <div className="modal-preview-side">
                        <div className="preview-container">
                            <div className="preview-label">Aperçu du Profil</div>

                            <div className="staff-id-card-preview">
                                <div className="card-top-design">
                                    <div className="chip"></div>
                                    <div className="contactless"></div>
                                </div>

                                <div className="card-avatar-section">
                                    <div className="avatar-preview-box">
                                        {previews.staffPhoto ? (
                                            <img src={previews.staffPhoto} className="card-photo" alt="" />
                                        ) : (
                                            formData.name ? (
                                                <span className="initials">{formData.name.charAt(0)}</span>
                                            ) : (
                                                <Camera size={24} className="placeholder-icon" />
                                            )
                                        )}
                                    </div>
                                    <div className="status-dot"></div>
                                </div>

                                <div className="card-info-section">
                                    <h3 className="preview-name">{formData.name || 'Staff Name'}</h3>
                                    <div className="preview-role-tag">{formData.role || 'POSTE'}</div>

                                    <div className="card-meta">
                                        <div className="meta-item">
                                            <span>CIN: {formData.cinNumber || '---'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Mail size={10} />
                                            <span>{formData.email || '---'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Phone size={10} />
                                            <span>{formData.phone || '---'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-bottom-design">
                                    <div className="bql-watermark">BQL RENT SYSTEMS</div>
                                    <div className="barcode-sim"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditStaffModal;
