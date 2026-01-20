import React from 'react';
import { ShieldCheck, Users, TrendingUp, Zap } from 'lucide-react';
import './About.css';

const About = () => {
    return (
        <section className="about-section" id="about">
            <div className="about-background-effects">
                <div className="about-glow"></div>
            </div>

            <div className="about-container">
                <header className="about-header">
                    <span className="services-badge">L'Excellence Opérationnelle</span>
                    <h2 className="services-title-custom">Votre Partenaire Stratégique</h2>
                </header>

                <div className="about-grid">
                    <div className="about-info-col">
                        <div className="info-block">
                            <h3 className="block-label">Qui sommes-nous ?</h3>
                            <p className="block-text">
                                BQL Rent est née d'une vision : simplifier la complexité logistique des agences de location.
                                Nous fusionnons innovation technologique et expertise métier pour offrir une plateforme
                                d'élite, conçue pour durer.
                            </p>
                        </div>

                        <div className="info-block">
                            <h3 className="block-label">Pourquoi nous ?</h3>
                            <p className="block-text">
                                Propulser votre agence vers de nouveaux sommets d'efficacité. Nous éliminons les frictions
                                opérationnelles pour que votre seule priorité reste la satisfaction de vos clients.
                            </p>
                        </div>

                        <div className="values-stack">
                            <div className="value-mini-card">
                                <div className="value-icon-box">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="value-text-box">
                                    <h4>Sécurité Native</h4>
                                    <p>Protection de niveau bancaire pour vos données.</p>
                                </div>
                            </div>
                            <div className="value-mini-card">
                                <div className="value-icon-box">
                                    <Users size={18} />
                                </div>
                                <div className="value-text-box">
                                    <h4>Design Collaboratif</h4>
                                    <p>Fluidité optimale entre vos équipes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="about-stats-col">
                        <div className="stats-glass-grid">
                            <div className="stat-glass-card">
                                <div className="stat-card-inner">
                                    <div className="stat-icon-row">
                                        <TrendingUp size={20} className="stat-accent-icon" />
                                        <span className="stat-percentage">+30%</span>
                                    </div>
                                    <h4 className="stat-name">Productivité</h4>
                                    <p className="stat-subtext">Gain moyen constaté</p>
                                </div>
                            </div>

                            <div className="stat-glass-card">
                                <div className="stat-card-inner">
                                    <div className="stat-icon-row">
                                        <Zap size={20} className="stat-accent-icon" />
                                        <span className="stat-percentage">24/7</span>
                                    </div>
                                    <h4 className="stat-name">Support VIP</h4>
                                    <p className="stat-subtext">Accompagnement expert</p>
                                </div>
                            </div>

                            <div className="stat-glass-card primary-theme">
                                <div className="stat-card-inner">
                                    <h4 className="stat-name">100% Cloud</h4>
                                    <p className="stat-subtext">Accès universel sécurisé</p>
                                </div>
                            </div>

                            <div className="stat-glass-card outline-theme">
                                <div className="stat-card-inner">
                                    <h4 className="stat-name">Zéro Surprise</h4>
                                    <p className="stat-subtext">Tarification transparente</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
