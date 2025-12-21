import React from 'react';
import { CheckCircle, Target, Zap } from 'lucide-react';
import './About.css';

const About = () => {
    return (
        <section className="about-section" id="about">
            <div className="about-container">
                <div className="about-content">
                    <div className="about-text">
                        <h2 className="section-title">À Propos de BQL Rent</h2>
                        <p className="about-intro">
                            Nous sommes la solution de gestion moderne conçue spécifiquement pour les agences de location de voiture.
                            Notre mission est de simplifier vos opérations quotidiennes et d'accélérer votre croissance.
                        </p>

                        <div className="about-features">
                            <div className="about-feature">
                                <CheckCircle size={24} />
                                <div>
                                    <h4>Simplicité</h4>
                                    <p>Interface intuitive, prise en main immédiate</p>
                                </div>
                            </div>
                            <div className="about-feature">
                                <Target size={24} />
                                <div>
                                    <h4>Performance</h4>
                                    <p>Optimisez vos opérations et augmentez vos revenus</p>
                                </div>
                            </div>
                            <div className="about-feature">
                                <Zap size={24} />
                                <div>
                                    <h4>Innovation</h4>
                                    <p>Technologies de pointe au service de votre agence</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="about-stats">
                        <div className="about-stat-card">
                            <div className="stat-value">5+</div>
                            <div className="stat-label">Années d'expérience</div>
                        </div>
                        <div className="about-stat-card">
                            <div className="stat-value">500+</div>
                            <div className="stat-label">Agences partenaires</div>
                        </div>
                        <div className="about-stat-card">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">Support disponible</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
