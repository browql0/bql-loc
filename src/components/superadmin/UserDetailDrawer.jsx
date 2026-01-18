import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, User, Shield, Building2, Clock, History, Phone, PenSquare, Calendar, Activity, Fingerprint, Mail } from 'lucide-react';
import './UserDetailDrawer.css';

const UserDetailDrawer = ({ isOpen, user, onClose, onEdit }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getRoleLabel = (role) => {
        switch (role) {
            case 'superadmin': return 'Superadmin';
            case 'owner': return 'Gérant (Owner)';
            case 'staff': return 'Staff';
            default: return role;
        }
    };

    const getStatusBadge = (status) => {
        const s = status || 'active';
        const classes = {
            active: 'status-active',
            suspended: 'status-suspended',
            blocked: 'status-blocked'
        };
        const labels = {
            active: 'Compte Actif',
            suspended: 'Compte Suspendu',
            blocked: 'Compte Bloqué'
        };
        return (
            <div className={`status-badge-pro ${classes[s]}`}>
                <Activity size={12} />
                {labels[s]}
            </div>
        );
    };

    return ReactDOM.createPortal(
        <div className={`user-detail-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div className="user-detail-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header-pro">
                    <h2>Détails du compte</h2>
                    <button className="close-btn-pro" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="modal-content-pro">

                    {/* Hero Section */}
                    <div className="user-hero-section">
                        <div className="avatar-pro">
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-identity-pro">
                            <h3>{user?.full_name || 'Utilisateur'}</h3>
                            <p className="email">{user?.email}</p>
                        </div>
                        <div className="badge-row">
                            {getStatusBadge(user?.status)}
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="data-section">
                        <div className="section-label">
                            <User size={14} /> Informations Personnelles
                        </div>
                        <div className="instrument-panel">
                            <div className="instrument-field">
                                <div className="field-icon">
                                    <Fingerprint size={16} />
                                </div>
                                <div className="field-content">
                                    <span className="f-label">Nom complet</span>
                                    <span className="f-value">{user?.full_name || '-'}</span>
                                </div>
                            </div>
                            <div className="instrument-field">
                                <div className="field-icon">
                                    <Phone size={16} />
                                </div>
                                <div className="field-content">
                                    <span className="f-label">Téléphone</span>
                                    <span className="f-value">{user?.phone || 'Non renseigné'}</span>
                                </div>
                            </div>
                            <div className="instrument-field" style={{ gridColumn: 'span 2' }}>
                                <div className="field-icon">
                                    <Mail size={16} />
                                </div>
                                <div className="field-content">
                                    <span className="f-label">Email de connexion</span>
                                    <span className="f-value">{user?.email || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Access Info */}
                    <div className="data-section">
                        <div className="section-label">
                            <Shield size={14} /> Accès & Organisation
                        </div>
                        <div className="instrument-panel">
                            <div className="instrument-field">
                                <div className="field-icon">
                                    <Shield size={16} className="text-blue-500" />
                                </div>
                                <div className="field-content">
                                    <span className="f-label">Rôle Système</span>
                                    <span className="f-value">{getRoleLabel(user?.role)}</span>
                                </div>
                            </div>
                            <div className="instrument-field">
                                <div className="field-icon">
                                    <Building2 size={16} className="text-blue-500" />
                                </div>
                                <div className="field-content">
                                    <span className="f-label">Agence</span>
                                    <span className="f-value">{user?.agency_name || 'Aucune'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="data-section">
                        <div className="section-label">
                            <Clock size={14} /> Activité du compte
                        </div>
                        <div className="instrument-panel">
                            <div className="instrument-field">
                                <div className="field-icon">
                                    <Calendar size={16} />
                                </div>
                                <div className="field-content">
                                    <span className="f-label">Date d'inscription</span>
                                    <span className="f-value">
                                        {new Date(user?.created_at).toLocaleDateString('fr-FR', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="instrument-field">
                                <div className="field-icon">
                                    <History size={16} />
                                </div>
                                <div className="field-content">
                                    <span className="f-label">Dernière mise à jour</span>
                                    <span className="f-value">
                                        {user?.updated_at
                                            ? new Date(user?.updated_at).toLocaleDateString('fr-FR')
                                            : 'Jamais'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="modal-footer-pro">
                    <button className="btn-secondary-pro" onClick={onClose}>
                        Annuler
                    </button>
                    <button className="btn-primary-pro" onClick={() => onEdit && onEdit(user)}>
                        <PenSquare size={18} />
                        Modifier
                    </button>
                </div>

            </div>

            {/* Activity History Modal - REMOVED per request */}
        </div>,
        document.body
    );
};

export default UserDetailDrawer;
