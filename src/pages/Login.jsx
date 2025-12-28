import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Mail, Lock, ArrowRight, ArrowLeft,
    Command, Zap, X, LayoutDashboard,
    FileText, Activity, Shield
} from 'lucide-react';
import './Login.css';

const Login = ({ navigate }) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

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
                navigate('pending-approval');
                return;
            }

            if (role === 'owner') {
                navigate('owner/dashboard');
            } else if (role === 'superadmin') {
                navigate('/superadmin/dashboard');
            } else if (role === 'staff') {
                navigate('/staff/dashboard');
            } else {
                // Unknown role, redirect to pending approval
                navigate('pending-approval');
            }

        } catch (err) {
            setError(err.message);
            alert('Login failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToRegister = (e) => {
        e.preventDefault();
        navigate('register');
    };

    // Temporary helper to create superadmin
    const createSuperAdmin = async () => {
        const email = prompt("Enter Superadmin Email:");
        const password = prompt("Enter Superadmin Password:");
        if (!email || !password) return;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'superadmin',
                        full_name: 'Super Admin'
                    }
                }
            });
            if (error) throw error;
            alert('Superadmin created! Check your email to confirm if confirmation is enabled.');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <div className="register-page-v74 login-portal-ui mode-light">


            {/* Site Atmosphere Alignment */}
            <div className="site-aura">
                <div className="aura-orb orb-indigo"></div>
                <div className="aura-orb orb-rose"></div>
                <div className="aura-grain"></div>
            </div>

            <div className="layout-portal">
                <div className="ultimate-card theme-light">
                    {/* Visual Side: The Obsidian Vault */}
                    <div className="vault-side">
                        <div className="vault-header">
                            <div className="portal-logo" onClick={() => navigate('home')}>
                                <div className="logo-box"><Command size={20} /></div>
                                <span style={{ color: 'white' }}>BQL RENT SYSTEMS</span>
                            </div>
                        </div>

                        <div className="vault-content">
                            <div className="v-tag animate-fade-in">
                                <Zap size={12} />
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>ACCÈS AGENT CERTIFIÉ</span>
                            </div>

                            <h1 className="v-main-title animate-title">
                                Pilotez votre <br />
                                propre <span>empire.</span>
                            </h1>

                            <p className="v-description animate-fade-in">
                                Retrouvez votre écosystème de gestion de flotte et vos indicateurs de performance.
                            </p>

                            <div className="v-perk-list">
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.4s' }}>
                                    <div className="perk-icon-wrap"><Shield size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Session Sécurisée</strong>
                                        <span>Tous vos données sont sécurisées.</span>
                                    </div>
                                </div>
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.6s' }}>
                                    <div className="perk-icon-wrap"><LayoutDashboard size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Live Dashboard</strong>
                                        <span>Données synchronisées en temps réel.</span>
                                    </div>
                                </div>
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.8s' }}>
                                    <div className="perk-icon-wrap"><FileText size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Documents Centralisés</strong>
                                        <span>Tous vos contrats à portée de main.</span>
                                    </div>
                                </div>
                            </div>
                        </div>



                        <div className="mesh-gradient"></div>
                    </div>

                    {/* Form Side: The Pearl Studio */}
                    <div className="studio-side">
                        {/* Mobile Brand Header (Visible only on mobile) */}
                        <div className="mobile-brand-header">
                            <div className="logo-box-mobile"><Command size={18} /></div>
                            <span>BQL RENT SYSTEMS</span>
                        </div>

                        <div className="studio-header">
                            <div className="f-progress">
                                <span className="p-bar"></span>
                                <span className="p-bar active"></span>
                            </div>
                            <h2 className="f-main-title">Identification</h2>
                            <p className="f-main-subtitle">Entrez vos accès pour ouvrir le portail</p>
                        </div>

                        <form className="studio-form" onSubmit={handleLogin}>
                            <div className="s-field-group">
                                <label>VOTRE EMAIL</label>
                                <div className="s-input-wrap">
                                    <Mail size={18} className="s-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="direction@votre-agence.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="s-glow"></div>
                                </div>
                            </div>

                            <div className="s-field-group">
                                <div className="label-row">
                                    <label>MOT DE PASSE</label>
                                    <a href="#" className="f-forgot">Oublié ?</a>
                                </div>
                                <div className="s-input-wrap">
                                    <Lock size={18} className="s-icon" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="s-glow"></div>
                                </div>
                            </div>

                            <div className="s-options-row">
                                <label className="s-checkbox-container">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />
                                    <span className="s-checkmark"></span>
                                    <span className="s-checkbox-label">Rester connecté</span>
                                </label>
                            </div>

                            <button type="submit" className="s-submit-btn">
                                <span>OUVRIR LA SESSION</span>
                                <ArrowRight size={20} className="s-arrow" />
                            </button>
                        </form>

                        <div className="studio-footer">
                            <p>PAS ENCORE D'ESPACE ? <a href="#" onClick={handleNavigateToRegister}>CRÉER UN COMPTE</a></p>
                        </div>

                        <button className="s-close-btn" onClick={() => navigate('home')}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Login;

