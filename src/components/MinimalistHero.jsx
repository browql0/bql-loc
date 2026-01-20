import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import './MinimalistHero.css';

const MinimalistHero = () => {
    const navigate = useNavigate();

    return (
        <section className="mini-hero" id="home">
            <div className="hero-background">
                <div className="mesh-gradient-1"></div>
                <div className="mesh-gradient-2"></div>
            </div>

            <div className="hero-container">
                <div className="hero-content">
                    <div className="badge animate-fade-in">
                        <span className="badge-dot"></span>
                        Plateforme N°1 pour les agences
                    </div>

                    <h1 className="hero-title animate-title">
                        Gérez votre flotte <br />
                        <span className="text-gradient">simplement.</span>
                    </h1>

                    <p className="hero-subtitle animate-fade-in-up">
                        La solution tout-en-un pour les agences de location.
                        Digitalisez vos opérations, sécurisez vos véhicules et augmentez votre rentabilité dès aujourd'hui.
                    </p>

                    <div className="hero-actions animate-fade-in-up">
                        <button
                            className="btn-hero-primary"
                            onClick={() => navigate('/register')}
                            aria-label="Commencer gratuitement"
                        >
                            Commencer maintenant <ArrowRight size={18} />
                        </button>
                        <button
                            className="btn-hero-secondary"
                            onClick={() => {
                                const contactSection = document.getElementById('contact');
                                if (contactSection) {
                                    contactSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            aria-label="Contactez-nous directement"
                        >
                            Contactez-nous
                        </button>
                    </div>

                    <div className="hero-trust animate-fade-in-up">
                        <div className="trust-item">
                            <CheckCircle2 size={16} className="trust-icon" />
                            <span>Installation instantanée</span>
                        </div>
                        <div className="trust-item">
                            <CheckCircle2 size={16} className="trust-icon" />
                            <span>14 jours offerts</span>
                        </div>
                        <div className="trust-item">
                            <CheckCircle2 size={16} className="trust-icon" />
                            <span>Support 24/7</span>
                        </div>
                    </div>
                </div>

                <div className="hero-stats-floating animate-fade-in-up">
                    <div className="floating-stat stat-1">
                        <span className="stat-val">100+</span>
                        <span className="stat-lbl">Agences</span>
                    </div>
                    <div className="floating-stat stat-2">
                        <span className="stat-val">5k+</span>
                        <span className="stat-lbl">Véhicules</span>
                    </div>
                    <div className="floating-stat stat-3">
                        <span className="stat-val">24/7</span>
                        <span className="stat-lbl">Support</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MinimalistHero;
