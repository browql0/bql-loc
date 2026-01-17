import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error in development
        if (import.meta.env.DEV) {
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} resetError={() => this.setState({ hasError: false, error: null })} />;
        }

        return this.props.children;
    }
}

const ErrorFallback = ({ error, resetError }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '2rem',
            color: 'white'
        }}>
            <div style={{
                maxWidth: '500px',
                textAlign: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '3rem 2rem'
            }}>
                <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Une erreur est survenue
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    {error?.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={resetError}
                        style={{
                            background: '#3b82f6',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500
                        }}
                    >
                        <RefreshCw size={18} />
                        Réessayer
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500
                        }}
                    >
                        <Home size={18} />
                        Accueil
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary;

