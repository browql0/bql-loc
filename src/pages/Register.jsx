import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import {
    User, Mail, Building2, Lock, ArrowRight, ArrowLeft,
    Command, Zap, Shield, Sparkles, X, LayoutDashboard,
    FileText, Activity, Phone, ChevronDown, Search,
    Eye, EyeOff
} from 'lucide-react';
import './Register.css';
import './PhoneInput.css';
import './RegisterFooter.css';

const Register = () => {
    const navigate = useNavigate();

    const [notification, setNotification] = useState(null);
    const [phonePrefix, setPhonePrefix] = useState('+212'); // Default Morocco
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
    const [prefixSearch, setPrefixSearch] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        agencyName: '',
        password: ''
    });

    // Countries with phone codes and validation
    const countries = [
        { code: '+212', country: 'Maroc', flag: '🇲🇦', length: 10, pattern: /^0[5-7]\d{8}$/ },
        { code: '+33', country: 'France', flag: '🇫🇷', length: 10, pattern: /^0[1-9]\d{8}$/ }
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validatePhoneNumber = (number) => {
        const cleaned = number.replace(/\D/g, '');
        const country = countries.find(c => c.code === phonePrefix);

        if (!cleaned) {
            setPhoneError('Le numéro de téléphone est requis');
            return false;
        }

        if (country && !country.pattern.test(cleaned)) {
            setPhoneError(`Format invalide pour ${country.country} (${country.length} chiffres attendus)`);
            return false;
        }

        setPhoneError('');
        return true;
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setPhoneNumber(value);
        if (value) {
            validatePhoneNumber(value);
        } else {
            setPhoneError('');
        }
    };

    const selectPrefix = (code) => {
        setPhonePrefix(code);
        setShowPrefixDropdown(false);
        setPrefixSearch('');
        if (phoneNumber) {
            validatePhoneNumber(phoneNumber);
        }
    };

    const filteredCountries = countries.filter(c =>
        c.country.toLowerCase().includes(prefixSearch.toLowerCase()) ||
        c.code.includes(prefixSearch)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return; // Prevent double submission

        setNotification(null);

        // Validate phone
        if (!validatePhoneNumber(phoneNumber)) {
            return;
        }

        // Validate other fields
        if (!formData.name.trim()) {
            setNotification({
                message: 'Le nom est requis',
                type: 'error'
            });
            return;
        }

        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            setNotification({
                message: 'Email invalide',
                type: 'error'
            });
            return;
        }

        if (!formData.agencyName.trim()) {
            setNotification({
                message: 'Le nom de l\'agence est requis',
                type: 'error'
            });
            return;
        }

        if (formData.password.length < 6) {
            setNotification({
                message: 'Le mot de passe doit contenir au moins 6 caractères',
                type: 'error'
            });
            return;
        }

        setIsSubmitting(true);
        const fullPhone = phonePrefix + phoneNumber.replace(/\D/g, '');

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name.trim().substring(0, 100),
                        agency_name: formData.agencyName.trim().substring(0, 100),
                        phone: fullPhone.substring(0, 20)
                    }
                }
            });

            if (data.user) {
                // Call the secure RPC function to create agency and profile
                const { error: rpcError } = await supabase.rpc('create_agency_and_admin', {
                    agency_name_input: formData.agencyName.trim().substring(0, 100),
                    owner_name_input: formData.name.trim().substring(0, 100),
                    owner_email_input: formData.email.trim().substring(0, 255),
                    owner_phone_input: fullPhone.substring(0, 20)
                });

                if (rpcError) {
                    throw new Error(rpcError.message || 'Erreur lors de la création du compte');
                }
            }

            if (error) throw error;

            setNotification({
                message: "Compte créé avec succès ! En attente d'approbation...",
                type: 'success'
            });

            setTimeout(() => {
                navigate('/pending-approval');
            }, 1500);

        } catch (error) {
            setNotification({
                message: 'Erreur : ' + (error.message || 'Une erreur est survenue'),
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-page-v74">
            {/* Notification Popup */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {notification.type === 'success' ? <Zap size={20} /> : <X size={20} />}
                    <span>{notification.message}</span>
                </div>
            )}

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
                                <span style={{ color: 'white' }}>BQL RENT SYSTEMS</span>
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
                        {/* boutton retour
                        <div className="vault-footer">
                            <button className="v-exit" onClick={() => navigate('home')}>
                                <ArrowLeft size={14} />
                                <span>QUITTER LE PORTAIL</span>
                            </button>
                        </div>
                        */}
                        {/* Immersive mesh light effect */}
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
                                        placeholder="Identité complète..."
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
                                        placeholder="Email professionnel..."
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
                                        placeholder="Raison sociale..."
                                        value={formData.agencyName}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="s-glow"></div>
                                </div>
                            </div>

                            <div className="s-field-group">
                                <label>TÉLÉPHONE PROFESSIONNEL</label>
                                <div className="phone-input-container">
                                    <div className="prefix-selector-wrapper">
                                        <div
                                            className="prefix-selector"
                                            onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                                        >
                                            <span className="selected-prefix">
                                                {countries.find(c => c.code === phonePrefix)?.flag} {phonePrefix}
                                            </span>
                                            <ChevronDown size={16} className={`dropdown-arrow ${showPrefixDropdown ? 'open' : ''}`} />
                                        </div>

                                        {showPrefixDropdown && (
                                            <div className="prefix-dropdown">
                                                <div className="dropdown-search">
                                                    <Search size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder="Rechercher un pays..."
                                                        value={prefixSearch}
                                                        onChange={(e) => setPrefixSearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="countries-list">
                                                    {filteredCountries.map((country) => (
                                                        <div
                                                            key={country.code}
                                                            className={`country-option ${country.code === phonePrefix ? 'selected' : ''}`}
                                                            onClick={() => selectPrefix(country.code)}
                                                        >
                                                            <span className="country-flag">{country.flag}</span>
                                                            <span className="country-name">{country.country}</span>
                                                            <span className="country-code">{country.code}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="s-input-wrap phone-input-wrap">
                                        <Phone size={18} className="s-icon" />
                                        <input
                                            type="tel"
                                            placeholder="Numéro de mobile..."
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            required
                                        />
                                        <div className="s-glow"></div>
                                    </div>
                                </div>
                                {phoneError && <div className="phone-error">{phoneError}</div>}
                            </div>

                            <div className="s-field-group">
                                <label>MOT DE PASSE MAÎTRE</label>
                                <div className="s-input-wrap password-wrap">
                                    <Lock size={18} className="s-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="••••••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <div className="s-glow"></div>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="terms-checkbox-wrapper">
                                <label className="terms-label">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.termsAccepted || false}
                                        onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                                    />
                                    <span className="checkmark">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </span>
                                    <span className="terms-text">J'accepte les <a href="#">Conditions Générales</a></span>
                                </label>
                            </div>

                            <button type="submit" className="s-submit-btn" disabled={isSubmitting}>
                                <span>{isSubmitting ? 'CRÉATION EN COURS...' : 'CRÉER MON ESPACE AGENT'}</span>
                                {!isSubmitting && <ArrowRight size={20} className="s-arrow" />}
                            </button>
                        </form>

                        <div className="studio-footer">
                            <p>DÉJÀ ENREGISTRÉ ? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>SE CONNECTER</a></p>
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
