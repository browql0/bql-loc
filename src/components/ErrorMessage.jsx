import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss, retry, retryLabel = 'Réessayer' }) => {
    return (
        <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            marginBottom: '1.5rem'
        }}>
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
                <p style={{
                    margin: 0,
                    color: '#ef4444',
                    fontSize: '0.95rem',
                    fontWeight: 500
                }}>
                    {message || 'Une erreur est survenue'}
                </p>
                {retry && (
                    <button
                        onClick={retry}
                        style={{
                            marginTop: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                    >
                        {retryLabel}
                    </button>
                )}
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                    }}
                    aria-label="Fermer"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;

