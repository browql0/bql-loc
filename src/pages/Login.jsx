import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Mail, Lock, ArrowRight, Command, Zap,
    Activity, LayoutDashboard, X, Eye, EyeOff
} from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (loading) return; // Prevent double submission

        setLoading(true);
        setError(null);

        try {
            const emailTrimmed = formData.email.trim();

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: emailTrimmed,
                password: formData.password,
            });

            if (authError) throw authError;

            // Role-based redirection
            let role = data.user?.user_metadata?.role;

            // If no role in metadata, try to fetch from profiles table
            if (!role) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profile) {
                    role = profile.role;
                }
            }

            // Check if user has a role assigned
            if (!role) {
                navigate('/pending-approval');
                return;
            }

            // Redirect based on role
            switch (role) {
                case 'owner':
                    navigate('/owner/dashboard');
                    break;
                case 'superadmin':
                    navigate('/superadmin/dashboard');
                    break;
                case 'staff':
                    navigate('/staff/dashboard');
                    break;
                default:
                    navigate('/pending-approval');
            }

        } catch (err) {
            // User-friendly error messages
            let errorMessage = 'Erreur de connexion. Vérifiez vos identifiants.';
            if (err.message?.includes('Invalid login credentials')) {
                errorMessage = 'Email ou mot de passe incorrect';
            } else if (err.message?.includes('Email not confirmed')) {
                errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-premium">
            {/* Error Notification */}
            {error && (
                <div className="error-notification" role="alert" aria-live="assertive">
                    <X size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Site Atmosphere */}
            <div className="site-aura">
                <div className="aura-orb orb-indigo"></div>
                <div className="aura-orb orb-rose"></div>
                <div className="aura-grain"></div>
            </div>

            <div className="layout-portal">
                <div className="ultimate-card">
                    {/* Vault Side (Dark Side) */}
                    <div className="vault-side">
                        <div className="vault-header">
                            <div className="portal-logo" onClick={() => navigate('/')}>
                                <div className="logo-box"><Command size={20} /></div>
                                <span style={{ color: 'white' }}>BQL RENT SYSTEMS</span>
                            </div>
                        </div>

                        <div className="vault-content">
                            <div className="v-tag animate-fade-in">
                                <Zap size={12} />
                                <span>ACCÈS AGENTS CERTIFIÉS</span>
                            </div>

                            <h1 className="v-main-title animate-title">
                                Connectez-vous à<br />
                                votre <span>tableau de bord.</span>
                            </h1>

                            <p className="v-description animate-fade-in">
                                Accédez à votre espace de gestion et pilotez votre flotte en temps réel avec des outils professionnels.
                            </p>

                            <div className="v-perk-list">
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.4s' }}>
                                    <div className="perk-icon-wrap"><Activity size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Gestion en Temps Réel</strong>
                                        <span>Suivez l'état de votre flotte instantanément.</span>
                                    </div>
                                </div>
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.6s' }}>
                                    <div className="perk-icon-wrap"><LayoutDashboard size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Analytics Avancés</strong>
                                        <span>Tableaux de bord et rapports détaillés.</span>
                                    </div>
                                </div>
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.8s' }}>
                                    <div className="perk-icon-wrap"><Lock size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Sécurité Maximale</strong>
                                        <span>Protection des données sensibles.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Immersive mesh light effect */}
                        <div className="mesh-gradient"></div>
                    </div>

                    {/* Studio Side (Form Side) */}
                    <div className="studio-side">
                        {/* Mobile Brand Header */}
                        <div className="mobile-brand-header">
                            <div className="logo-box-mobile"><Command size={18} /></div>
                            <span>BQL RENT SYSTEMS</span>
                        </div>

                        <div className="login-content-center-wrapper">
                            <div className="studio-header">
                                <div className="f-progress">
                                    <span className="p-bar"></span>
                                    <span className="p-bar active"></span>
                                </div>
                                <h2 className="f-main-title">Connexion Sécurisée</h2>
                                <p className="f-main-subtitle">Identifiez-vous avec vos identifiants</p>
                            </div>

                            <form className="studio-form" onSubmit={handleLogin}>
                                <div className="s-field-group">
                                    <label htmlFor="email-input">ADRESSE EMAIL</label>
                                    <div className="s-input-wrap">
                                        <Mail size={18} className="s-icon" />
                                        <input
                                            id="email-input"
                                            type="email"
                                            name="email"
                                            placeholder="votre@email.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            autoComplete="email"
                                        />
                                        <div className="s-glow"></div>
                                    </div>
                                </div>

                                <div className="s-field-group">
                                    <label htmlFor="password-input">MOT DE PASSE</label>
                                    <div className="s-input-wrap password-wrap">
                                        <Lock size={18} className="s-icon" />
                                        <input
                                            id="password-input"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="••••••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <div className="s-glow"></div>
                                    </div>
                                </div>

                                {/* Remember Me Checkbox */}
                                <div className="terms-checkbox-wrapper">
                                    <label className="terms-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.rememberMe || false}
                                            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                        />
                                        <span className="checkmark">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                        <span className="terms-text">Se souvenir de moi</span>
                                    </label>
                                </div>

                                <button type="submit" className="s-submit-btn" disabled={loading}>
                                    <span>{loading ? 'CONNEXION EN COURS...' : 'SE CONNECTER'}</span>
                                    {!loading && <ArrowRight size={20} className="s-arrow" />}
                                </button>
                            </form>

                            <div className="studio-footer">
                                <p>PAS ENCORE DE COMPTE ? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>S'INSCRIRE</a></p>
                            </div>
                        </div>

                        {/* Floating close button */}
                        <button className="s-close-btn" onClick={() => navigate('/')}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
