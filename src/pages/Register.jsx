import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Building2, Lock, ArrowRight, ArrowLeft,
    Command, Zap, Shield, Sparkles, X, LayoutDashboard,
    FileText, Activity
} from 'lucide-react';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        agencyName: '',
        password: ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Espace Agence en cours de création...");
        navigate('/');
    };

    return (
        <div className="register-page-v74">
            {/* Site Atmosphere Alignment */}
            <div className="site-aura">
                <div className="aura-orb orb-indigo"></div>
                <div className="aura-orb orb-rose"></div>
                <div className="aura-grain"></div>
            </div>

            <div className="layout-portal">
                <div className="ultimate-card">
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
                                <Zap size={12} />
                                <span>SOLUTIONS POUR AGENCES DE LOCATION</span>
                            </div>

                            <h1 className="v-main-title animate-title">
                                L'excellence au <br />
                                service de votre <span>flotte.</span>
                            </h1>

                            <p className="v-description animate-fade-in">
                                Déployez une infrastructure de gestion intelligente et maximisez la rentabilité de chaque véhicule.
                            </p>

                            <div className="v-perk-list">
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.4s' }}>
                                    <div className="perk-icon-wrap"><Activity size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Contrôle de Flotte</strong>
                                        <span>Suivi en temps réel et alertes de maintenance.</span>
                                    </div>
                                </div>
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.6s' }}>
                                    <div className="perk-icon-wrap"><FileText size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Automatisation Totale</strong>
                                        <span>Contrats et facturations générés en un clic.</span>
                                    </div>
                                </div>
                                <div className="perk-item animate-perk" style={{ animationDelay: '0.8s' }}>
                                    <div className="perk-icon-wrap"><LayoutDashboard size={18} /></div>
                                    <div className="perk-text">
                                        <strong>Intelligence Business</strong>
                                        <span>Analyses avancées pour booster vos revenus.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="vault-footer">
                            <button className="v-exit" onClick={() => navigate('/')}>
                                <ArrowLeft size={14} />
                                <span>QUITTER LE PORTAIL</span>
                            </button>
                        </div>

                        {/* Immersive mesh light effect */}
                        <div className="mesh-gradient"></div>
                    </div>

                    {/* Form Side: The Pearl Studio */}
                    <div className="studio-side">
                        <div className="studio-header">
                            <div className="f-progress">
                                <span className="p-bar active"></span>
                                <span className="p-bar"></span>
                            </div>
                            <h2 className="f-main-title">Initialiser le compte</h2>
                            <p className="f-main-subtitle">Vos identifiants de gestionnaire certifié</p>
                        </div>

                        <form className="studio-form" onSubmit={handleSubmit}>
                            <div className="s-field-group">
                                <label>IDENTITÉ COMPLÈTE</label>
                                <div className="s-input-wrap">
                                    <User size={18} className="s-icon" />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Ex: Marc Aurèle"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="s-glow"></div>
                                </div>
                            </div>

                            <div className="s-field-group">
                                <label>EMAIL DE L'AGENCE</label>
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
                                <label>NOM DE L'ENTREPRISE</label>
                                <div className="s-input-wrap">
                                    <Building2 size={18} className="s-icon" />
                                    <input
                                        type="text"
                                        name="agencyName"
                                        placeholder="Ex: Luxury Rent Paris"
                                        value={formData.agencyName}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="s-glow"></div>
                                </div>
                            </div>

                            <div className="s-field-group">
                                <label>MOT DE PASSE MAÎTRE</label>
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

                            <button type="submit" className="s-submit-btn">
                                <span>CRÉER MON ESPACE AGENT</span>
                                <ArrowRight size={20} className="s-arrow" />
                            </button>
                        </form>

                        <div className="studio-footer">
                            <p>DÉJÀ ENREGISTRÉ ? <a href="#" onClick={(e) => e.preventDefault()}>SE CONNECTER</a></p>
                        </div>

                        {/* Refined floating close button */}
                        <button className="s-close-btn" onClick={() => navigate('/')}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
