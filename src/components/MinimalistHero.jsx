import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import './MinimalistHero.css';

const MinimalistHero = () => {
    const navigate = useNavigate();

    return (
        <section className="mini-hero" id="home">
            <div className="hero-background">
                <div className="blur-circle circle-1"></div>
                <div className="blur-circle circle-2"></div>
            </div>

            <div className="hero-content">
                <div className="badge animate-fade-in">
                    <Zap size={16} />
                    <span>Plateforme N°1 pour les agences de location</span>
                </div>

                <h1 className="hero-title animate-title">
                    Gérez votre flotte <br />
                    <span>en toute simplicité.</span>
                </h1>

                <p className="hero-subtitle animate-fade-in-up">
                    La solution complète pour les agences de location de voiture.
                    Optimisez vos opérations, augmentez vos revenus et offrez une expérience client exceptionnelle.
                </p>

                <div className="hero-actions animate-fade-in-up">
                    <button 
                        className="btn-hero-primary" 
                        onClick={() => navigate('/register')}
                        aria-label="Créer un compte et démarrer"
                    >
                        Démarrer gratuitement <ArrowRight size={18} aria-hidden="true" />
                    </button>
                    <button 
                        className="btn-hero-secondary" 
                        onClick={() => {
                            const contactSection = document.getElementById('contact');
                            if (contactSection) {
                                contactSection.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        aria-label="Aller à la section contact"
                    >
                        Contactez-nous
                    </button>
                </div>

                <div className="hero-stats animate-fade-in-up">
                    <div className="stat-item">
                        <div className="stat-number">10+</div>
                        <div className="stat-label">Agences partenaires</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">100+</div>
                        <div className="stat-label">Véhicules gérés</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">99%</div>
                        <div className="stat-label">Satisfaction client</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MinimalistHero;
