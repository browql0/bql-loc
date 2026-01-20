import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './MinimalistHeader.css';

const MinimalistHeader = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [settings, setSettings] = useState({
        email: 'hello@bqlrent.com',
        social: []
    });

    // Load Dynamic Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase.rpc('get_all_settings');
                if (error) throw error;

                if (data && Array.isArray(data)) {
                    const mapped = { social: [] };
                    data.forEach(s => {
                        if (s.key === 'site_email') mapped.email = s.value;
                        if (['instagram_url', 'twitter_url', 'facebook_url'].includes(s.key)) {
                            const platform = s.key.split('_')[0];
                            mapped.social.push({ platform, url: s.value });
                        }
                    });
                    setSettings(prev => ({ ...prev, ...mapped }));
                }
            } catch (err) {
                console.error('Error fetching settings for header:', err);
            }
        };
        fetchSettings();
    }, []);

    // Scroll Handling 
    const handleScroll = useCallback(() => {
        setIsScrolled(window.scrollY > 20);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Intersection Observer for Active Section
    useEffect(() => {
        const sections = ['home', 'services', 'about', 'contact'];
        const observerOptions = { rootMargin: '-40% 0px -40% 0px', threshold: 0 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActiveSection(entry.target.id);
            });
        }, observerOptions);

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    // Body Scroll Lock
    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    const scrollToSection = (id) => {
        setIsMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
        }
    };

    const navItems = [
        { label: 'Accueil', id: 'home' },
        { label: 'Services', id: 'services' },
        { label: 'À Propos', id: 'about' },
        { label: 'Contact', id: 'contact' },
    ];

    // Magnetic Logo Effect
    const brandRef = React.useRef(null);
    const [logoStyle, setLogoStyle] = useState({});

    const handleMouseMove = (e) => {
        if (window.innerWidth < 1024) return;
        const rect = brandRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = (e.clientX - centerX) * 0.15;
        const distanceY = (e.clientY - centerY) * 0.15;
        setLogoStyle({ transform: `translate(${distanceX}px, ${distanceY}px)` });
    };

    const handleMouseLeave = () => {
        setLogoStyle({ transform: 'translate(0, 0)' });
    };

    return (
        <header
            className={`modern-header ${isScrolled ? 'is-scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`}
        >
            <div className="header-container">
                {/* Logo */}
                <div
                    ref={brandRef}
                    className="header-brand"
                    onClick={() => navigate('/')}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={logoStyle}
                    aria-label="BQL RENT - Accueil"
                >
                    <img src="/tete.png" alt="" className="header-logo" />
                    <span className="brand-name">BQL RENT</span>
                </div>

                {/* Desktop Nav */}
                <nav className="desktop-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Actions */}
                <div className="header-actions">
                    <button
                        className="cta-button desktop-only"
                        onClick={() => navigate('/register')}
                    >
                        Commencer
                    </button>

                    <button
                        className={`burger-toggle ${isMenuOpen ? 'is-active' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    >
                        <span className="burger-line"></span>
                        <span className="burger-line"></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? 'show' : ''}`}>
                <div className="mobile-menu-content">
                    <nav className="mobile-nav">
                        {navItems.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className="mobile-nav-link"
                                style={{ '--delay': `${index * 0.1}s` }}
                            >
                                <span className="link-index">0{index + 1}</span>
                                <span className="link-text">{item.label}</span>
                                <ArrowUpRight className="link-icon" size={24} />
                            </button>
                        ))}
                    </nav>

                    <div className="mobile-menu-footer">
                        <button
                            className="cta-button mobile-cta"
                            onClick={() => {
                                setIsMenuOpen(false);
                                navigate('/register');
                            }}
                        >
                            Nous contacter
                        </button>


                    </div>
                </div>
            </div>
        </header>
    );
};

export default MinimalistHeader;
