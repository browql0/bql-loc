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
        return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return null;
    }

    return children;
};

export default ProtectedRoute;

