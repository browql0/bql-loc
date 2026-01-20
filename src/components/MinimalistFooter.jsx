import React, { useState } from 'react';
import { Instagram, Linkedin, Mail, Phone, Clock, ShieldCheck, ChevronDown } from 'lucide-react';
import './MinimalistFooter.css';

const MinimalistFooter = () => {
    const currentYear = new Date().getFullYear();
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (section) => {
        if (window.innerWidth <= 768) {
            setOpenSection(openSection === section ? null : section);
        }
    };

    return (
        <footer className="mini-footer">
            <div className="footer-glow"></div>
            <div className="footer-container">
                <div className="footer-top">
                    <div className="footer-col brand-col">
                        <div className="footer-logo">
                            <img src="/tete.svg" alt="BQL Rent Logo" className="logo-img-small" />
                            <span className="logo-text">BQL Rent</span>
                        </div>
                        <p className="footer-desc">
                            L'excellence de la gestion locative automobile au Maroc. Une plateforme pensée pour l'efficacité, la sécurité et la croissance de votre entreprise.
                        </p>
                        <div className="trust-badge">
                            <ShieldCheck size={16} />
                            <span>100% Sécurisé & Certifié</span>
                        </div>
                    </div>

                    <nav className={`footer-col links-col ${openSection === 'produit' ? 'is-open' : ''}`} aria-label="Navigation Produit">
                        <h4 onClick={() => toggleSection('produit')}>
                            Produit
                            <ChevronDown className="mobile-chevron" size={16} />
                        </h4>
                        <ul className="footer-links-list">
                            <li><a href="#services">Fonctionnalités</a></li>
                            <li><a href="#pricing">Tarifs</a></li>
                            <li><a href="#demo">Démo</a></li>
                        </ul>
                    </nav>

                    <nav className={`footer-col links-col ${openSection === 'entreprise' ? 'is-open' : ''}`} aria-label="Navigation Entreprise">
                        <h4 onClick={() => toggleSection('entreprise')}>
                            Entreprise
                            <ChevronDown className="mobile-chevron" size={16} />
                        </h4>
                        <ul className="footer-links-list">
                            <li><a href="#about">À propos</a></li>
                            <li><a href="#contact">Contact</a></li>
                            <li><a href="#careers">Carrières</a></li>
                        </ul>
                    </nav>

                    <div className={`footer-col support-col ${openSection === 'support' ? 'is-open' : ''}`}>
                        <h4 onClick={() => toggleSection('support')}>
                            Contact Rapide
                            <ChevronDown className="mobile-chevron" size={16} />
                        </h4>
                        <ul className="support-list">
                            <li>
                                <Phone size={18} />
                                <div>
                                    <span className="support-label">Téléphone</span>
                                    <a href="tel:+212500000000">+212 500-000000</a>
                                </div>
                            </li>
                            <li>
                                <Mail size={18} />
                                <div>
                                    <span className="support-label">Email</span>
                                    <a href="mailto:support@bqlrent.com">support@bqlrent.com</a>
                                </div>
                            </li>
                            <li>
                                <Clock size={18} />
                                <div>
                                    <span className="support-label">Disponibilité</span>
                                    <span>Lun - Ven, 9h - 18h</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="bottom-left">
                        <div className="copyright">
                            © {currentYear} BQL Rent. Développé avec excellence au Maroc.
                        </div>
                        <nav className="legal-nav" aria-label="Navigation Légale">
                            <a href="/privacy">Confidentialité</a>
                            <a href="/terms">CGU</a>
                            <a href="/legal">Mentions légales</a>
                        </nav>
                    </div>
                    <div className="social-links">
                        <a href="https://instagram.com" aria-label="Instagram" className="social-chip"><Instagram size={18} /></a>
                        <a href="https://linkedin.com" aria-label="LinkedIn" className="social-chip"><Linkedin size={18} /></a>
                        <a href="mailto:contact@bqlrent.com" aria-label="Email" className="social-chip"><Mail size={18} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default MinimalistFooter;
