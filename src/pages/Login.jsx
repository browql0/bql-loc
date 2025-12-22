import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail, Lock, ArrowRight, ArrowLeft,
    Command, Zap, X, LayoutDashboard,
    FileText, Activity
} from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(false);
    const [isThemeSwitching, setIsThemeSwitching] = useState(false);
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
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setIsThemeSwitching(true);

        // Simulation d'une décharge d'énergie avant le switch
        setTimeout(() => {
            setIsDark(!isDark);
            setTimeout(() => setIsThemeSwitching(false), 600);
        }, 300);
    };

    const handleNavigateToRegister = (e) => {
        e.preventDefault();
        navigate('/register');
    };

    return (
        <div className={`register-page-v74 login-portal-ui ${isDark ? 'mode-dark' : 'mode-light'} ${isThemeSwitching ? 'is-power-switching' : ''}`}>
            {/* Site Atmosphere Alignment */}
            <div className="site-aura">
                <div className="aura-orb orb-indigo"></div>
                <div className="aura-orb orb-rose"></div>
                <div className="aura-grain"></div>
            </div>

            <div className="layout-portal">
                <div className={`ultimate-card ${isDark ? 'theme-dark' : 'theme-light'}`}>
                    {/* Visual Side: The Obsidian Vault */}
                    <div className="vault-side">
                        <div className="vault-header">
                            <div className="portal-logo" onClick={() => navigate('/')}>
                                <div className="logo-box"><Command size={20} /></div>
                                <span>BQL RENT SYSTEMS</span>
                            </div>
                        </div>

                        <div className="vault-content">
                            <div className="v-tag animate-fade-in">
                                <Zap size={12} className={isDark ? 'flicker-zap' : ''} />
                                <span>ACCÈS AGENT CERTIFIÉ</span>
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
                                    <div className="perk-icon-wrap"><Activity size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Session Sécurisée</strong>
                                        <span>Cryptage de niveau militaire.</span>
                                    </div>
                                </div>
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.6s' }}>
                                    <div className="perk-icon-wrap"><LayoutDashboard size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Live Dashboard</strong>
                                        <span>Données synchronisées en temps réel.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="vault-footer">
                            <button className="v-exit" onClick={() => navigate('/')}>
                                <ArrowLeft size={14} />
                                <span>RETOUR ACCUEIL</span>
                            </button>
                        </div>

                        <div className="mesh-gradient"></div>
                    </div>

                    {/* Form Side: The Pearl Studio */}
                    <div className="studio-side">
                        <div className="studio-header">
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

