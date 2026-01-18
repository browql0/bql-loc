import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 32, message = 'Chargement...', fullScreen = false, color = '#94a3b8' }) => {
    const spinner = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            color: color,
            padding: fullScreen ? '4rem 2rem' : '2rem'
        }}>
            <Loader2 size={size} className="spinner-icon" style={{
                animation: 'spin 1s linear infinite'
            }} />
            {message && <p style={{ margin: 0, fontSize: '0.95rem' }}>{message}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;

