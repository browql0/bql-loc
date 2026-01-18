import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
    Sparkles
} from 'lucide-react';
import ErrorModal from './ErrorModal';
import LoadingSpinner from '../LoadingSpinner';
import './AddAgencyModal.css';

const AddAgencyModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        agencyName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsSuccess(false);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const validateField = (name, value) => {
        switch (name) {
            case 'agencyName':
                if (!value.trim()) return 'Le nom de l\'agence est requis';
                if (value.trim().length < 2) return 'Minimum 2 caractères';
                return '';
            case 'ownerName':
                if (!value.trim()) return 'Le nom du propriétaire est requis';
                return '';
            case 'ownerEmail':
                if (!value.trim()) return 'L\'email est requis';
                const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
                if (!emailRegex.test(value)) return 'Format d\'email invalide';
                return '';
            case 'password':
                if (!value) return 'Le mot de passe est requis';
                if (value.length < 8) return 'Minimum 8 caractères';
                return '';
            default:
                return '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || isSuccess) return;

        const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
        setTouched(allTouched);

        if (!validateForm()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('create_agency_with_owner', {
                agency_name_text: formData.agencyName.trim(),
                owner_name_text: formData.ownerName.trim(),
                owner_email_text: formData.ownerEmail.trim().toLowerCase(),
                owner_phone_text: formData.ownerPhone.trim(),
                owner_password_text: formData.password
            });

            if (error) throw error;
            if (!data || !data.success) throw new Error(data?.error || 'Erreur lors de la création');

            // Success Transition
            setIsSuccess(true);
            setLoading(false);

            if (onSuccess) onSuccess();

            // Wait 1.5s to show success state to user
            setTimeout(() => {
                setFormData({
                    agencyName: '',
                    ownerName: '',
                    ownerEmail: '',
                    ownerPhone: '',
                    password: ''
                });
                setErrors({});
                setTouched({});
                setIsSuccess(false);
                onClose();
            }, 1500);

        } catch (error) {
            setErrorMessage(error?.message || 'Erreur lors de l\'ajout de l\'agence.');
            setIsErrorModalOpen(true);
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content-premium animate-scale-up ${isSuccess ? 'success-pulse' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Nouvelle Agence</h2>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form-zen" noValidate>
                    <fieldset disabled={loading || isSuccess} style={{ border: 'none', padding: 0, margin: 0 }}>
                        <div className="modal-body-scroll">
                            <div className={`input-group-zen ${errors.agencyName && touched.agencyName ? 'has-error' : ''}`}>
                                <label>Nom de l'Agence</label>
                                <div className="input-wrapper-zen">
                                    <Building2 size={18} className="input-icon-zen" />
                                    <input
                                        type="text"
                                        name="agencyName"
                                        placeholder="Nom de l'agence"
                                        value={formData.agencyName}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        autoFocus
                                    />
                                </div>
                                {errors.agencyName && touched.agencyName && (
                                    <span className="field-error">{errors.agencyName}</span>
                                )}
                            </div>

                            <div className="separator-line">
                                <span>Informations Propriétaire</span>
                            </div>

                            <div className={`input-group-zen ${errors.ownerName && touched.ownerName ? 'has-error' : ''}`}>
                                <label>Nom complet</label>
                                <div className="input-wrapper-zen">
                                    <User size={18} className="input-icon-zen" />
                                    <input
                                        type="text"
                                        name="ownerName"
                                        placeholder="Nom du propriétaire"
                                        value={formData.ownerName}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                    />
                                </div>
                                {errors.ownerName && touched.ownerName && (
                                    <span className="field-error">{errors.ownerName}</span>
                                )}
                            </div>

                            <div className="row-zen">
                                <div className={`input-group-zen ${errors.ownerEmail && touched.ownerEmail ? 'has-error' : ''}`}>
                                    <label>Email professionnel</label>
                                    <div className="input-wrapper-zen">
                                        <Mail size={18} className="input-icon-zen" />
                                        <input
                                            type="email"
                                            name="ownerEmail"
                                            placeholder="Email"
                                            value={formData.ownerEmail}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                        />
                                    </div>
                                    {errors.ownerEmail && touched.ownerEmail && (
                                        <span className="field-error">{errors.ownerEmail}</span>
                                    )}
                                </div>
                                <div className={`input-group-zen ${errors.ownerPhone && touched.ownerPhone ? 'has-error' : ''}`}>
                                    <label>Téléphone</label>
                                    <div className="input-wrapper-zen">
                                        <Phone size={18} className="input-icon-zen" />
                                        <input
                                            type="tel"
                                            name="ownerPhone"
                                            placeholder="Téléphone"
                                            value={formData.ownerPhone}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                        />
                                    </div>
                                    {errors.ownerPhone && touched.ownerPhone && (
                                        <span className="field-error">{errors.ownerPhone}</span>
                                    )}
                                </div>
                            </div>

                            <div className={`input-group-zen ${errors.password && touched.password ? 'has-error' : ''}`}>
                                <label>Mot de passe initial</label>
                                <div className="input-wrapper-zen">
                                    <Lock size={18} className="input-icon-zen" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                    />
                                    <button
                                        type="button"
                                        className="pwd-toggle-zen"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading || isSuccess}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && touched.password && (
                                    <span className="field-error">{errors.password}</span>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <div className="modal-footer-zen">
                        <button
                            type="button"
                            className="btn-cancel-zen"
                            onClick={onClose}
                            disabled={loading || isSuccess}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className={`btn-submit-premium ${isSuccess ? 'btn-success' : ''}`}
                            disabled={loading || isSuccess}
                        >
                            {loading ? (
                                <LoadingSpinner size={18} message={null} color="#ffffff" />
                            ) : isSuccess ? (
                                <Sparkles size={18} className="animate-bounce" />
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            <span style={{ marginLeft: loading ? '8px' : '0' }}>
                                {loading ? 'Création...' : isSuccess ? 'Agence Créée !' : 'Créer le Compte'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>

            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                message={errorMessage}
                title="Erreur de Création"
            />
        </div>,
        document.body
    );
};

export default AddAgencyModal;
