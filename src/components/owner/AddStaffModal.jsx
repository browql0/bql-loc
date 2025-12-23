import React, { useState } from 'react';
import { X, User, Mail, Phone, Shield, Calendar, Camera, Hash, Upload, FileText, Image as ImageIcon, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import './AddStaffModal.css';

const AddStaffModal = ({ isOpen, onClose }) => {
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
                            <div className="badge-tag">Étape {currentStep} sur 2</div>
                            <h2>Nouveau Collaborateur</h2>

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
                                    {/* Step 1: Identity & Contact */}
                                    {currentStep === 1 && (
                                        <div className="form-section step-fade-in">
                                            <h4 className="section-title">Identité & Contact</h4>
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

                                            <div className="premium-input-group">
                                                <label>N° CIN</label>
                                                <div className="premium-input-wrapper">
                                                    <Hash size={18} />
                                                    <input
                                                        type="text"
                                                        name="cinNumber"
                                                        placeholder="ex: AB123456"
                                                        value={formData.cinNumber}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 2: Role & Photo */}
                                    {currentStep === 2 && (
                                        <div className="form-section step-fade-in">
                                            <h4 className="section-title">Documents & Poste</h4>
                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <label>Rôle Agence</label>
                                                    <div className="premium-input-wrapper">
                                                        <Shield size={18} />
                                                        <select name="role" value={formData.role} onChange={handleInputChange}>
                                                            <option value="">Sélectionner</option>
                                                            <option value="Gestionnaire">Gestionnaire</option>
                                                            <option value="Agent Accueil">Agent Accueil</option>
                                                            <option value="Chauffeur">Chauffeur</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>Date Entrée</label>
                                                    <div className="premium-input-wrapper">
                                                        <Calendar size={18} />
                                                        <input type="date" name="joins" value={formData.joins} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="premium-file-drop full-width" style={{ marginTop: '1rem' }}>
                                                <label>Photo du Staff</label>
                                                <div className="drop-zone small" onClick={() => document.getElementById('staff-photo-input').click()}>
                                                    <input
                                                        id="staff-photo-input"
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(e, 'staffPhoto')}
                                                    />
                                                    {previews.staffPhoto ? (
                                                        <div className="file-preview-filled">
                                                            <img src={previews.staffPhoto} alt="Staff preview" />
                                                            <div className="replace-overlay"><Upload size={14} /></div>
                                                        </div>
                                                    ) : (
                                                        <div className="drop-zone-content">
                                                            <Camera size={20} />
                                                            <span>Ajouter photo</span>
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
                                    <button type="submit" className="btn-confirm-premium">
                                        Valider <CheckCircle size={18} />
                                        <div className="btn-shine"></div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Live Preview Badge */}
                    <div className="modal-preview-side">
                        <div className="preview-container">
                            <div className="preview-label">Aperçu Professionnel</div>

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
                                    <h3 className="preview-name">{formData.name || 'Prénom Nom'}</h3>
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
                                        {formData.joins && (
                                            <div className="meta-item">
                                                <Calendar size={10} />
                                                <span>Depuis: {formData.joins}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card-bottom-design">
                                    <div className="bql-watermark">BQL RENT</div>
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

export default AddStaffModal;
