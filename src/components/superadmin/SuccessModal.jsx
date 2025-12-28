import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, message, title = "Succès !" }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="success-modal-overlay" onClick={onClose}>
            <div className="success-modal-card animate-slide-in" onClick={e => e.stopPropagation()}>
                <div className="success-icon-container">
                    <CheckCircle size={32} />
                </div>
                <div className="success-content">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>
                <button className="success-close-btn" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
