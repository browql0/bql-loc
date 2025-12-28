import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, agencyName, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="confirm-header">
                    <div className="warning-icon-bg">
                        <AlertTriangle size={24} />
                    </div>
                    <button className="confirm-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="confirm-content">
                    <h2>Supprimer l'agence ?</h2>
                    <p>
                        Êtes-vous sûr de vouloir supprimer <strong>{agencyName}</strong> ?
                        Cette action supprimera également les accès associés et est irréversible.
                    </p>
                </div>

                <div className="confirm-footer">
                    <button className="btn-secondary-light" onClick={onClose} disabled={loading}>
                        Annuler
                    </button>
                    <button className="btn-danger-solid" onClick={onConfirm} disabled={loading}>
                        {loading ? <span className="loader-dot"></span> : "Supprimer définitivement"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
