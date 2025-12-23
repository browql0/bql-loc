import React from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Twitter, Facebook, ArrowRight } from 'lucide-react';
import './Contact.css';

const Contact = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic
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
                            <div className="form-grid">
                                <div className="form-group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                    <label>Nom complet</label>
                                    <input type="text" placeholder="Jean Dupont" required />
                                </div>
                                <div className="form-group animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                                    <label>Email professionnel</label>
                                    <input type="email" placeholder="jean@votreagence.com" required />
                                </div>
                                <div className="form-group animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                    <label>Nom de l'agence</label>
                                    <input type="text" placeholder="Luxe Rent Paris" />
                                </div>
                                <div className="form-group full-width animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                                    <label>Sujet</label>
                                    <select>
                                        <option>Demande d'information</option>
                                        <option>Démonstration produit</option>
                                        <option>Support technique</option>
                                        <option>Autre</option>
                                    </select>
                                </div>
                                <div className="form-group full-width animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                                    <label>Votre message</label>
                                    <textarea placeholder="Comment pouvons-nous vous aider ?" rows="4" required></textarea>
                                </div>
                            </div>
                            <button type="submit" className="contact-submit-btn">
                                Envoyer la demande
                                <ArrowRight size={18} />
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
