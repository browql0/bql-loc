import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import './MinimalistFooter.css';

const MinimalistFooter = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mini-footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-brand animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="footer-logo">BQL RENT</h2>
                        <p className="footer-tagline">
                            La plateforme de gestion complète pour votre agence de location.
                        </p>
                    </div>

                    <div className="footer-links-simple animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <a href="#services">Services</a>
                        <a href="#about">À propos</a>
                        <a href="#contact">Contact</a>
                    </div>

                    <div className="footer-social animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="social-links">
                            <a href="https://facebook.com" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="https://twitter.com" aria-label="Twitter"><Twitter size={20} /></a>
                            <a href="https://instagram.com" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="https://linkedin.com" aria-label="LinkedIn"><Linkedin size={20} /></a>
                            <a href="mailto:contact@bqlrent.com" aria-label="Email"><Mail size={20} /></a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="copyright">
                        © {currentYear} BQL Rent. Tous droits réservés.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default MinimalistFooter;
