import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
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
import LoadingSpinner from '../LoadingSpinner';
import ErrorModal from './ErrorModal';
import './AddAgencyModal.css';

const EditAgencyModal = ({ isOpen, onClose, onSuccess, agencyData }) => {
    const [formData, setFormData] = useState({
        agencyName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: ''
    });
    const [initialData, setInitialData] = useState(null);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (agencyData && isOpen) {
            const newData = {
                agencyName: agencyData.name || '',
                ownerName: agencyData.owner_name || agencyData.full_name || agencyData.owner || '',
                ownerEmail: agencyData.owner_email || agencyData.email || '',
                ownerPhone: agencyData.owner_phone || agencyData.phone || ''
            };
            setFormData(newData);
            setInitialData(newData);
            setErrors({});
            setTouched({});

            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [agencyData, isOpen]);

    // Validation rules
    const validateField = (name, value) => {
        switch (name) {
            case 'agencyName':
                if (!value.trim()) return 'Le nom de l\'agence est requis';
                if (value.trim().length < 2) return 'Minimum 2 caractères';
                if (value.trim().length > 100) return 'Maximum 100 caractères';
                return '';
            case 'ownerName':
                if (!value.trim()) return 'Le nom du propriétaire est requis';
                if (value.trim().length < 2) return 'Minimum 2 caractères';
                return '';
            case 'ownerEmail':
                if (!value.trim()) return 'L\'email est requis';
                const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
                if (!emailRegex.test(value)) return 'Format d\'email invalide';
                return '';
            case 'ownerPhone':
                if (value && !/^(\+212|0)[5-7][0-9]{8}$/.test(value.replace(/\s/g, ''))) {
                    return 'Format téléphone invalide';
                }
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

    const isDirty = useMemo(() => {
        if (!initialData) return false;
        return Object.keys(formData).some(key => formData[key] !== initialData[key]);
    }, [formData, initialData]);

    if (!isOpen) return null;

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
        setTouched(allTouched);

        if (!validateForm()) return;
        if (!isDirty) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('update_agency_details', {
                agency_id_input: agencyData.id,
                agency_name_text: formData.agencyName.trim(),
                owner_name_text: formData.ownerName.trim(),
                owner_email_text: formData.ownerEmail.trim().toLowerCase(),
                owner_phone_text: formData.ownerPhone.trim()
            });

            if (error) throw error;
            if (!data || !data.success) throw new Error(data?.error || 'Erreur inconnue');

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            setErrorMessage(error?.message || 'Erreur lors de la mise à jour.');
            setIsErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-premium animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Modifier l'Agence</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Fermer">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form-zen" noValidate>
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
                    </div>

                    <div className="modal-footer-zen">
                        <button type="button" className="btn-cancel-zen" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-submit-premium" disabled={loading}>
                            {loading ? <LoadingSpinner size={18} message={null} color="#ffffff" /> : <CheckCircle size={18} />}
                            <span style={{ marginLeft: loading ? '8px' : '0' }}>{loading ? 'Mise à jour...' : 'Sauvegarder'}</span>
                        </button>
                    </div>
                </form>
            </div>

            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                message={errorMessage}
                title="Erreur de Mise à Jour"
            />
        </div>,
        document.body
    );
};

export default EditAgencyModal;
