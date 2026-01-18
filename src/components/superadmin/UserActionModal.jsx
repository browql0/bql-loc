import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Trash2, X, Zap, Ban, AlertTriangle } from 'lucide-react';
import './UserActionModal.css';

const UserActionModal = ({ isOpen, onClose, onConfirm, userName, actionType, loading }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const getConfig = () => {
        switch (actionType) {
            case 'suspend':
                return {
                    title: "Suspendre l'utilisateur ?",
                    message: (
                        <>
                            Êtes-vous sûr de vouloir suspendre <strong>{userName}</strong> ?
                            L'utilisateur ne pourra plus se connecter jusqu'à réactivation.
                        </>
                    ),
                    icon: Ban,
                    confirmLabel: "Suspendre",
                    confirmClass: "btn-warning-solid",
                    iconClass: "warning-icon-bg"
                };
            case 'activate':
                return {
                    title: "Réactiver l'utilisateur ?",
                    message: (
                        <>
                            Confirmer la réactivation du compte de <strong>{userName}</strong> ?
                            L'accès sera rétabli immédiatement.
                        </>
                    ),
                    icon: Zap,
                    confirmLabel: "Réactiver",
                    confirmClass: "btn-success-solid",
                    iconClass: "success-icon-bg"
                };
            case 'delete':
                return {
                    title: "Supprimer l'utilisateur ?",
                    message: (
                        <>
                            Supprimer définitivement le compte de <strong>{userName}</strong> ?
                            Cette action est irréversible.
                        </>
                    ),
                    icon: Trash2,
                    confirmLabel: "Supprimer définitivement",
                    confirmClass: "btn-danger-solid",
                    iconClass: "danger-icon-bg"
                };
            default:
                return {
                    title: "Confirmer l'action",
                    message: "Êtes-vous sûr ?",
                    icon: AlertTriangle,
                    confirmLabel: "Confirmer",
                    confirmClass: "btn-primary-solid",
                    iconClass: "primary-icon-bg"
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return ReactDOM.createPortal(
        <div className="user-modal-overlay" onClick={onClose}>
            <div className="user-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header-row">
                    <div className={config.iconClass}>
                        <Icon size={24} />
                    </div>
                    <button className="user-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="user-modal-content">
                    <h2>{config.title}</h2>
                    <p>{config.message}</p>
                </div>

                <div className="user-modal-footer">
                    <button className="btn-secondary-light" onClick={onClose} disabled={loading}>
                        Annuler
                    </button>
                    <button className={config.confirmClass} onClick={onConfirm} disabled={loading}>
                        {loading ? <span className="loader-dot"></span> : config.confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserActionModal;
