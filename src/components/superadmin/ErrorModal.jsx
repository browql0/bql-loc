import React from 'react';
import { ShieldAlert, X, AlertCircle } from 'lucide-react';
import './ErrorModal.css';

const ErrorModal = ({ isOpen, onClose, message, title = "Erreur Système" }) => {
    if (!isOpen) return null;

    return (
        <div className="error-modal-overlay" onClick={onClose}>
            <div className="error-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="error-header">
                    <div className="error-icon-bg">
                        <ShieldAlert size={24} />
                    </div>
                    <div className="error-title-group">
                        <h3>{title}</h3>
                        <span className="error-code">STATUS_CODE: PROTOCOL_FAILURE</span>
                    </div>
                    <button className="error-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="error-content">
                    <div className="error-indicator">
                        <AlertCircle size={16} />
                        <span>INTERRUPTION_DETECTED</span>
                    </div>
                    <p className="error-message">
                        {message || "Une erreur inconnue s'est produite lors de l'exécution du protocole."}
                    </p>
                </div>

                <div className="error-footer">
                    <div className="hud-line"></div>
                    <button className="btn-error-acknowledge" onClick={onClose}>
                        INITIALIZE_RECOVERY
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
