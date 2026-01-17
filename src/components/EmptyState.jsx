import React from 'react';

const EmptyState = ({ 
    icon: Icon, 
    title, 
    message, 
    actionLabel, 
    onAction,
    iconSize = 48,
    iconColor = '#64748b'
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#94a3b8'
        }}>
            {Icon && (
                <div style={{
                    marginBottom: '1.5rem',
                    opacity: 0.6
                }}>
                    <Icon size={iconSize} style={{ color: iconColor }} />
                </div>
            )}
            {title && (
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem 0',
                    color: 'white'
                }}>
                    {title}
                </h3>
            )}
            {message && (
                <p style={{
                    fontSize: '0.95rem',
                    margin: '0 0 1.5rem 0',
                    maxWidth: '400px'
                }}>
                    {message}
                </p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

