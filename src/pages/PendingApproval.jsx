import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Command, Clock, Shield, ArrowLeft, LogOut, Sparkles, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import './PendingApproval.css';

const PendingApproval = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ type: '', message: '' });
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/');
        } catch (error) {
            // Silently handle logout errors, navigate anyway
        }
    };

    const handleRefresh = async () => {
        setIsChecking(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // First check user metadata for role
                let userRole = user.user_metadata?.role;

                // If no role in metadata, try to fetch from profiles table
                if (!userRole) {
                    try {
                        const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', user.id)
                            .maybeSingle();

                        // If we successfully got the profile, use that role
                        if (!error && profile) {
                            userRole = profile.role;
                        }
                    } catch (profileError) {
                        // Silently handle profile fetch errors (e.g., RLS issues)
                        // Will use metadata role if available
                    }
                }

                if (userRole) {
                    // Role has been assigned, show success modal then redirect
                    setModalContent({
                        type: 'success',
                        message: 'Votre compte a été activé ! Redirection en cours...'
                    });
                    setShowModal(true);

                    setTimeout(() => {
                        if (userRole === 'owner') {
                            navigate('/owner/dashboard');
                        } else if (userRole === 'superadmin') {
                            navigate('/superadmin/dashboard');
                        } else if (userRole === 'staff') {
                            navigate('/staff/dashboard');
                        }
                    }, 2000);
                } else {
                    setModalContent({
                        type: 'pending',
                        message: 'Votre compte est toujours en attente d\'approbation. Un administrateur doit vous attribuer un rôle.'
                    });
                    setShowModal(true);
                }
            }
        } catch (error) {
            setModalContent({
                type: 'error',
                message: error?.message || 'Erreur lors de la vérification du statut. Veuillez réessayer.'
            });
            setShowModal(true);
        } finally {
            setIsChecking(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <div className="pending-approval-page">
            {/* Site Atmosphere */}
            <div className="site-aura">
                <div className="aura-orb orb-amber"></div>
                <div className="aura-orb orb-gray"></div>
                <div className="aura-grain"></div>
            </div>

            <div className="pending-container">
                <div className="pending-card">
                    {/* Header */}
                    <div className="pending-header">
                        <div className="portal-logo" onClick={() => navigate('/')}>
                            <div className="logo-box"><Command size={20} /></div>
                            <span>BQL RENT SYSTEMS</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="pending-content">
                        <div className="pending-icon-wrap">
                            <Clock size={52} className="pending-icon" />
                            <div className="icon-pulse"></div>
                            <div className="icon-pulse pulse-2"></div>
                        </div>

                        <h1 className="pending-title">Compte en Attente d'Activation</h1>

                        <p className="pending-description">
                            Votre compte a été créé avec succès. Un administrateur doit maintenant
                            vous attribuer un rôle pour que vous puissiez accéder à la plateforme.
                        </p>

                        <div className="pending-info-box">
                            <Shield size={20} />
                            <div className="info-text">
                                <strong>Processus de Sécurité</strong>
                                <span>Cette étape garantit que seuls les utilisateurs autorisés accèdent au système.</span>
                            </div>
                        </div>

                        <div className="pending-steps">
                            <div className="step-item completed">
                                <div className="step-icon"><CheckCircle2 size={18} /></div>
                                <span>Compte créé</span>
                            </div>
                            <div className="step-divider"></div>
                            <div className="step-item pending">
                                <div className="step-icon"><Clock size={18} /></div>
                                <span>Attribution du rôle</span>
                            </div>
                            <div className="step-divider"></div>
                            <div className="step-item">
                                <div className="step-icon"><Shield size={18} /></div>
                                <span>Accès activé</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pending-actions">
                            <button
                                className="btn-refresh"
                                onClick={handleRefresh}
                                disabled={isChecking}
                            >
                                {isChecking ? (
                                    <>
                                        <Loader2 size={18} className="spin-icon" />
                                        <span>Vérification...</span>
                                    </>
                                ) : (
                                    'Vérifier le Statut'
                                )}
                            </button>
                            <button className="btn-logout" onClick={handleLogout}>
                                <LogOut size={18} />
                                <span>Se Déconnecter</span>
                            </button>
                        </div>

                        <div className="pending-footer-note">
                            <p>Vous recevrez un email dès que votre compte sera activé.</p>
                        </div>
                    </div>

                    {/* Back button */}
                    <button className="btn-back" onClick={() => navigate('/')}>
                        <ArrowLeft size={16} />
                        <span>Retour à l'Accueil</span>
                    </button>

                    {/* Mesh gradient effect */}
                    <div className="mesh-gradient"></div>
                </div>
            </div>

            {/* Status Modal */}
            {showModal && (
                <div className="status-modal-overlay" onClick={closeModal}>
                    <div className="status-modal" onClick={(e) => e.stopPropagation()}>
                        <div className={`modal-icon-wrap ${modalContent.type}`}>
                            {modalContent.type === 'success' && <CheckCircle2 size={48} />}
                            {modalContent.type === 'pending' && <Clock size={48} />}
                            {modalContent.type === 'error' && <XCircle size={48} />}
                        </div>

                        <h2 className="modal-title">
                            {modalContent.type === 'success' && 'Compte Activé !'}
                            {modalContent.type === 'pending' && 'Toujours en Attente'}
                            {modalContent.type === 'error' && 'Erreur'}
                        </h2>

                        <p className="modal-message">{modalContent.message}</p>

                        {modalContent.type !== 'success' && (
                            <button className="modal-close-btn" onClick={closeModal}>
                                Fermer
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingApproval;
