import React, { useState, useEffect } from 'react';

import { Command, Instagram, Twitter, Facebook } from 'lucide-react';
import './MinimalistHeader.css';

const MinimalistHeader = ({ navigate }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen]);

    const navLinks = [
        { name: 'Accueil', href: '#home' },
        { name: 'Services', href: '#services' },
        { name: 'À Propos', href: '#about' },
        { name: 'Contact', href: '#contact' },
    ];

    return (
        <header className={`mini-header ${isScrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-is-open' : ''}`}>
            <div className="header-container">
                <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="logo-icon">
                        <Command size={24} />
                    </div>
                    <span className="logo-text">BQL</span>
                </div>

                <nav className="desktop-nav">
                    {navLinks.map((link) => (
                        <a key={link.name} href={link.href}>
                            {link.name}
                        </a>
                    ))}
                </nav>

                <div className="header-actions">
                    <button className="btn-primary desktop-only" onClick={() => navigate('register')}>Commencer</button>

                    {/* Custom Burger Icon - Refined structure */}
                    <button
                        className={`burger-btn ${isMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Menu"
                    >
                        <div className="burger-inner">
                            <span className="burger-line line-1"></span>
                            <span className="burger-line line-2"></span>
                            <span className="burger-line line-3"></span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Top-Down Mobile Menu */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    <nav className="mobile-nav">
                        {navLinks.map((link, index) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                style={{ transitionDelay: isMenuOpen ? `${index * 0.1}s` : '0s' }}
                            >
                                {link.name}
                            </a>
                        ))}
                    </nav>

                    <div className="mobile-menu-footer">
                        <button className="btn-primary full-width" onClick={() => { navigate('register'); setIsMenuOpen(false); }}>Commencer</button>
                        <div className="mobile-socials">
                            <Instagram size={22} />
                            <Twitter size={22} />
                            <Facebook size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop blur - Refined active state */}
            <div
                className={`menu-backdrop ${isMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
            ></div>
        </header>
    );
};

export default MinimalistHeader;