import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Twitter, Facebook, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        agencyName: '',
        subject: 'Demande d\'information',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSubmitStatus(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (loading) return;

        // Validate
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setSubmitStatus('error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            setSubmitStatus('error');
            return;
        }

        setLoading(true);
        setSubmitStatus(null);

        try {
            // Store contact message in Supabase (you may need to create a contact_messages table)
            // For now, we'll use a simple approach - store in a table or send email
            // Option 1: Store in database (requires contact_messages table)
            const { error } = await supabase
                .from('contact_messages')
                .insert([{
                    name: formData.name.trim().substring(0, 100),
                    email: formData.email.trim().substring(0, 255),
                    agency_name: formData.agencyName.trim().substring(0, 100) || null,
                    subject: formData.subject.substring(0, 100),
                    message: formData.message.trim().substring(0, 2000)
                }])
                .select()
                .single();

            if (error) {
                // If table doesn't exist, fall back to email link
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    // Fallback: Open email client
                    const subject = encodeURIComponent(`Contact: ${formData.subject}`);
                    const body = encodeURIComponent(
                        `Nom: ${formData.name}\n` +
                        `Email: ${formData.email}\n` +
                        `Agence: ${formData.agencyName || 'N/A'}\n\n` +
                        `Message:\n${formData.message}`
                    );
                    window.location.href = `mailto:bqlrent@hotmail.com?subject=${subject}&body=${body}`;
                    setSubmitStatus('success');
                    setFormData({ name: '', email: '', agencyName: '', subject: 'Demande d\'information', message: '' });
                    setLoading(false);
                    return;
                }
                throw error;
            }

            setSubmitStatus('success');
            setFormData({ name: '', email: '', agencyName: '', subject: 'Demande d\'information', message: '' });
            
            // Reset success message after 5 seconds
            setTimeout(() => setSubmitStatus(null), 5000);
        } catch (error) {
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="contact-section" id="contact">
            <div className="contact-container">
                <div className="contact-card">
                    {/* Left Side: Visual & Info */}
                    <div className="contact-visual">
                        <div className="visual-content">
                            <span className="contact-badge">Parlons ensemble</span>
                            <h2 className="visual-title">Prêt à transformer votre agence ?</h2>
                            <p className="visual-description">
                                Rejoignez plus de 10 agences qui optimisent déjà leur rentabilité avec BQL Rent.
                            </p>

                            <div className="contact-methods">
                                <div className="method-item animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    <div className="method-icon">
                                        <Mail size={20} />
                                    </div>
                                    <div className="method-text">
                                        <span>Email</span>
                                        <a href="mailto:contact@bqlrent.com">bqlrent@hotmail.com</a>
                                    </div>
                                </div>
                                <div className="method-item animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                    <div className="method-icon">
                                        <Phone size={20} />
                                    </div>
                                    <div className="method-text">
                                        <span>Téléphone</span>
                                        <a href="tel:+212600918920">+212 600 918 920</a>
                                    </div>
                                </div>
                                <div className="method-item animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                    <div className="method-icon">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="method-text">
                                        <span>Adresse</span>
                                        <p>Tanger, Maroc</p>
                                    </div>
                                </div>
                            </div>

                            <div className="contact-social">
                                <span>Suivez-nous</span>
                                <div className="social-icons">
                                    <a href="#"><Instagram size={18} /></a>
                                    <a href="#"><Twitter size={18} /></a>
                                    <a href="#"><Facebook size={18} /></a>
                                </div>
                            </div>
                        </div>

                        {/* Decorative element */}
                        <div className="visual-decoration"></div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="contact-form-wrapper">
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <h3 className="form-title">Envoyez-nous un message</h3>
                            
                            {submitStatus === 'success' && (
                                <div className="contact-status-message success" role="alert">
                                    <CheckCircle2 size={18} />
                                    <span>Message envoyé avec succès ! Nous vous répondrons sous 24h.</span>
                                </div>
                            )}
                            
                            {submitStatus === 'error' && (
                                <div className="contact-status-message error" role="alert">
                                    <AlertCircle size={18} />
                                    <span>Erreur lors de l'envoi. Veuillez vérifier vos informations et réessayer.</span>
                                </div>
                            )}

                            <div className="form-grid">
                                <div className="form-group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                    <label htmlFor="contact-name">Nom complet</label>
                                    <input 
                                        id="contact-name"
                                        type="text" 
                                        name="name"
                                        placeholder="Jean Dupont" 
                                        value={formData.name}
                                        onChange={handleChange}
                                        required 
                                        maxLength={100}
                                        aria-required="true"
                                    />
                                </div>
                                <div className="form-group animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                                    <label htmlFor="contact-email">Email professionnel</label>
                                    <input 
                                        id="contact-email"
                                        type="email" 
                                        name="email"
                                        placeholder="jean@votreagence.com" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        required 
                                        maxLength={255}
                                        aria-required="true"
                                    />
                                </div>
                                <div className="form-group animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                    <label htmlFor="contact-agency">Nom de l'agence</label>
                                    <input 
                                        id="contact-agency"
                                        type="text" 
                                        name="agencyName"
                                        placeholder="Luxe Rent Paris" 
                                        value={formData.agencyName}
                                        onChange={handleChange}
                                        maxLength={100}
                                    />
                                </div>
                                <div className="form-group full-width animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                                    <label htmlFor="contact-subject">Sujet</label>
                                    <select 
                                        id="contact-subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        aria-label="Sujet du message"
                                    >
                                        <option value="Demande d'information">Demande d'information</option>
                                        <option value="Démonstration produit">Démonstration produit</option>
                                        <option value="Support technique">Support technique</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div className="form-group full-width animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                                    <label htmlFor="contact-message">Votre message</label>
                                    <textarea 
                                        id="contact-message"
                                        name="message"
                                        placeholder="Comment pouvons-nous vous aider ?" 
                                        rows="4" 
                                        value={formData.message}
                                        onChange={handleChange}
                                        required 
                                        maxLength={2000}
                                        aria-required="true"
                                    ></textarea>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="contact-submit-btn" 
                                disabled={loading}
                                aria-label="Envoyer le message"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="spinner-icon" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        Envoyer la demande
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                            <p className="form-note">
                                Nous vous répondrons sous 24h ouvrées.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
