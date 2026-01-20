import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Twitter, Facebook, ArrowRight, CheckCircle2, AlertCircle, Loader2, User, MessageSquare, Building2, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '', // Optional
        agencyName: '',
        subject: 'Demande d\'information',
        message: '',
        hp: '' // Honeypot field
    });

    const [loading, setLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
    const [touched, setTouched] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (submitStatus) setSubmitStatus(null);
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Honeypot check
        if (formData.hp) {
            console.warn('Bot detected');
            setSubmitStatus('success'); // Fake success for bots
            return;
        }

        if (loading) return;

        // 2. Client-side validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setSubmitStatus('error');
            return;
        }

        if (!validateEmail(formData.email.trim())) {
            setSubmitStatus('error');
            return;
        }

        setLoading(true);
        setSubmitStatus(null);

        try {
            // Option: Try to get User IP (optional, for tracking/security)
            // Note: In real production, this is often done server-side.

            const { error } = await supabase
                .from('contact_messages')
                .insert([{
                    name: formData.name.trim().substring(0, 100),
                    email: formData.email.trim().substring(0, 255),
                    phone: formData.phone.trim().substring(0, 20),
                    agency_name: formData.agencyName.trim().substring(0, 100) || null,
                    subject: formData.subject.substring(0, 100),
                    message: formData.message.trim().substring(0, 2000),
                    user_agent: navigator.userAgent.substring(0, 500)
                }]);

            if (error) throw error;

            setSubmitStatus('success');
            setFormData({
                name: '',
                email: '',
                phone: '',
                agencyName: '',
                subject: 'Demande d\'information',
                message: '',
                hp: ''
            });
            setTouched({});

            // Reset success message after 7 seconds
            setTimeout(() => setSubmitStatus(null), 7000);
        } catch (error) {
            console.error('Submission error:', error);
            setSubmitStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="contact-section" id="contact">
            {/* Background elements for depth */}
            <div className="contact-bg-glow" />

            <div className="contact-container">
                <header className="contact-header">
                    <span className="contact-badge">Contact</span>
                    <h2 className="contact-title">Parlons de votre projet</h2>
                    <p className="contact-subtitle">
                        Une solution sur mesure pour votre agence. Réponse garantie sous 24h.
                    </p>
                </header>

                <div className="contact-content-grid">
                    {/* Info Column */}
                    <div className="contact-info-column">
                        <div className="info-card glass-effect animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <h3 className="info-card-title">Nos coordonnées</h3>

                            <div className="info-links">
                                <a href="mailto:bqlrent@hotmail.com" className="info-link-item animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                    <div className="icon-box">
                                        <Mail />
                                    </div>
                                    <div className="info-details">
                                        <label>Email</label>
                                        <span>bqlrent@hotmail.com</span>
                                    </div>
                                    <ArrowRight className="item-arrow" />
                                </a>

                                <a href="tel:+212600918920" className="info-link-item animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                    <div className="icon-box">
                                        <Phone />
                                    </div>
                                    <div className="info-details">
                                        <label>Service Client</label>
                                        <span>+212 600 918 920</span>
                                    </div>
                                    <ArrowRight className="item-arrow" />
                                </a>

                                <div className="info-link-item non-clickable animate-fade-in" style={{ animationDelay: '0.4s' }}>
                                    <div className="icon-box">
                                        <MapPin />
                                    </div>
                                    <div className="info-details">
                                        <label>Localisation</label>
                                        <span>Tanger, Maroc</span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-footer animate-fade-in" style={{ animationDelay: '0.5s' }}>
                                <p>Disponible du Lundi au Vendredi, 9h — 18h</p>
                                <div className="social-mini">
                                    <Instagram className="social-icon" />
                                    <Twitter className="social-icon" />
                                    <Facebook className="social-icon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Column */}
                    <div className="contact-form-column">
                        <div className="form-card glass-effect animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            {submitStatus === 'success' ? (
                                <div className="submission-success">
                                    <div className="success-icon-wrapper">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h3>Message envoyé !</h3>
                                    <p>Merci pour votre confiance. Notre équipe vous contactera très rapidement.</p>
                                    <button
                                        onClick={() => setSubmitStatus(null)}
                                        className="btn-outline-small"
                                    >
                                        Envoyer un autre message
                                    </button>
                                </div>
                            ) : (
                                <form className="contact-form" onSubmit={handleSubmit}>
                                    {submitStatus === 'error' && (
                                        <div className="form-alert error">
                                            <AlertCircle size={18} />
                                            <span>Un problème est survenu. Veuillez réessayer.</span>
                                        </div>
                                    )}

                                    {/* Honeypot - Hidden from humans */}
                                    <div className="hp-field" aria-hidden="true">
                                        <input
                                            type="text"
                                            name="hp"
                                            autoComplete="off"
                                            value={formData.hp}
                                            onChange={handleChange}
                                            tabIndex="-1"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-field animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                            <label htmlFor="name"><User size={14} /> Nom complet</label>
                                            <input
                                                id="name"
                                                type="text"
                                                name="name"
                                                placeholder="Jean Dupont"
                                                value={formData.name}
                                                onChange={handleChange}
                                                onBlur={() => handleBlur('name')}
                                                required
                                                className={touched.name && !formData.name.trim() ? 'invalid' : ''}
                                            />
                                        </div>
                                        <div className="form-field animate-fade-in" style={{ animationDelay: '0.4s' }}>
                                            <label htmlFor="email"><Mail size={14} /> Email professionnel</label>
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                placeholder="jean@agence.com"
                                                inputMode="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={() => handleBlur('email')}
                                                required
                                                className={touched.email && !validateEmail(formData.email) ? 'invalid' : ''}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-field animate-fade-in" style={{ animationDelay: '0.5s' }}>
                                            <label htmlFor="phone"><Smartphone size={14} /> Téléphone (Optionnel)</label>
                                            <input
                                                id="phone"
                                                type="tel"
                                                name="phone"
                                                placeholder="+212 ..."
                                                inputMode="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-field animate-fade-in" style={{ animationDelay: '0.6s' }}>
                                            <label htmlFor="agencyName"><Building2 size={14} /> Nom de l'agence</label>
                                            <input
                                                id="agencyName"
                                                type="text"
                                                name="agencyName"
                                                placeholder="Luxe Rent"
                                                value={formData.agencyName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-field full-width animate-fade-in" style={{ animationDelay: '0.7s' }}>
                                        <label htmlFor="subject">Sujet</label>
                                        <div className="select-wrapper">
                                            <select
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                            >
                                                <option value="Demande d'information">Demande d'information</option>
                                                <option value="Démonstration produit">Démonstration produit</option>
                                                <option value="Partenariat">Partenariat</option>
                                                <option value="Support technique">Support technique</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-field full-width animate-fade-in" style={{ animationDelay: '0.8s' }}>
                                        <label htmlFor="message"><MessageSquare size={14} /> Votre message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            placeholder="Comment pouvons-nous vous aider ?"
                                            rows="4"
                                            value={formData.message}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('message')}
                                            required
                                            className={touched.message && !formData.message.trim() ? 'invalid' : ''}
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="form-submit-btn animate-fade-in"
                                        style={{ animationDelay: '0.9s' }}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="spinner-icon" />
                                                Traitement...
                                            </>
                                        ) : (
                                            <>
                                                Envoyer ma demande
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
