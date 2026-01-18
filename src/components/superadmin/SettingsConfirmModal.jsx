import React from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import './SettingsConfirmModal.css';

const SettingsConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    setting,
    newValue,
    isSubmitting
}) => {
    if (!isOpen || !setting) return null;

    const formatValue = (value, dataType) => {
        if (dataType === 'boolean') {
            return value ? 'Activé' : 'Désactivé';
        }
        if (typeof value === 'string' && value === '') {
            return '(vide)';
        }
        return String(value);
    };

    const currentValue = setting.value;
    const willEnable = setting.data_type === 'boolean' && newValue === true;
    const willDisable = setting.data_type === 'boolean' && newValue === false;

    // Specific warnings based on setting key
    const getWarningMessage = () => {
        switch (setting.key) {
            case 'maintenance_mode':
                return willEnable
                    ? "L'activation du mode maintenance bloquera l'accès à tous les utilisateurs non-SuperAdmin."
                    : "La désactivation du mode maintenance restaurera l'accès public à la plateforme.";
            case 'allow_registrations':
                return willDisable
                    ? "La désactivation des inscriptions empêchera les nouvelles créations de compte."
                    : "L'activation des inscriptions permettra à de nouveaux utilisateurs de s'inscrire.";
            case 'session_timeout':
                return "La modification du timeout de session affectera toutes les sessions utilisateur actives.";
            case 'force_2fa':
                return willEnable
                    ? "L'activation du 2FA obligatoire forcera tous les utilisateurs à configurer l'authentification à deux facteurs."
                    : "La désactivation du 2FA obligatoire rendra l'authentification à deux facteurs optionnelle.";
            default:
                return "Cette modification affectera le comportement global du système.";
        }
    };

    return (
        <div className="settings-confirm-overlay" onClick={onClose}>
            <div
                className="settings-confirm-modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
            >
                {/* Header */}
                <div className="confirm-modal-header">
                    <div className="confirm-icon-wrapper warning">
                        <AlertTriangle size={24} />
                    </div>
                    <button
                        className="confirm-close-btn"
                        onClick={onClose}
                        aria-label="Fermer"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="confirm-modal-content">
                    <h2 id="confirm-modal-title">Confirmer la modification</h2>
                    <p className="confirm-setting-name">{setting.label}</p>

                    <div className="confirm-change-preview">
                        <div className="change-item old">
                            <span className="change-label">Valeur actuelle</span>
                            <span className="change-value">{formatValue(currentValue, setting.data_type)}</span>
                        </div>
                        <div className="change-arrow">→</div>
                        <div className="change-item new">
                            <span className="change-label">Nouvelle valeur</span>
                            <span className="change-value">{formatValue(newValue, setting.data_type)}</span>
                        </div>
                    </div>

                    <div className="confirm-warning">
                        <AlertTriangle size={16} />
                        <p>{getWarningMessage()}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="confirm-modal-actions">
                    <button
                        className="confirm-btn cancel"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Annuler
                    </button>
                    <button
                        className="confirm-btn submit"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="btn-spinner"></div>
                                <span>Application...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                <span>Confirmer</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsConfirmModal;
