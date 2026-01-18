import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, userRole, loading } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
                return;
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                // User doesn't have required role
                if (!userRole) {
                    navigate('/pending-approval');
                } else {
                    // Redirect to appropriate dashboard
                    if (userRole === 'owner') {
                        navigate('/owner/dashboard');
                    } else if (userRole === 'staff') {
                        navigate('/staff/dashboard');
                    } else if (userRole === 'superadmin') {
                        navigate('/superadmin/dashboard');
                    } else {
                        navigate('/pending-approval');
                    }
                }
            }
        }
    }, [user, userRole, loading, allowedRoles, navigate]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid rgba(255, 255, 255, 0.1)',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Already redirecting in useEffect
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // CRITICAL: Don't return null - this would mount the protected component
        // and execute its code (including useEffect) before redirection
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <div>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                    }}>
                        🚫
                    </div>
                    <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Accès refusé</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                        Redirection en cours...
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;

