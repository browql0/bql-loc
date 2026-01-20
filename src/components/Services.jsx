import React, { useState } from 'react';
import { Calendar, FileText, Users, TrendingUp, ChevronRight, CheckCircle2 } from 'lucide-react';
import './Services.css';

const Services = () => {
    const [expandedCard, setExpandedCard] = useState(null);

    const services = [
        {
            icon: <Calendar size={28} />,
            title: "Suivi des Véhicules",
            description: "Contrôle total sur votre flotte en temps réel.",
            details: [
                "Disponibilité instantanée",
                "Gestion des entretiens",
                "Historique des trajets",
                "Alertes retours"
            ],
            color: "var(--accent-primary)"
        },
        {
            icon: <FileText size={28} />,
            title: "Documents Digitaux",
            description: "Dématérialisation complète de vos processus administratifs.",
            details: [
                "Contrats numériques",
                "Gestion des assurances",
                "Facturation automatisée",
                "Signature électronique"
            ],
            color: "var(--accent-primary)"
        },
        {
            icon: <Users size={28} />,
            title: "Gestion Client & Staff",
            description: "Centralisez les interactions avec vos collaborateurs et clients.",
            details: [
                "Fiches clients détaillées",
                "Planning des équipes",
                "Gestion des accès",
                "Suivi des performances"
            ],
            color: "var(--accent-primary)"
        },
        {
            icon: <TrendingUp size={28} />,
            title: "Suivi des Revenus",
            description: "Analysez la croissance et la rentabilité de votre agence.",
            details: [
                "Tableaux de bord financiers",
                "Rapports mensuels",
                "Prévisions de revenus",
                "Analyse des dépenses"
            ],
            color: "var(--accent-primary)"
        }
    ];

    const toggleCard = (index) => {
        setExpandedCard(expandedCard === index ? null : index);
    };

    return (
        <section className="services-section" id="services">
            <div className="services-container">
                <div className="services-header">
                    <span className="services-badge">Expertise & Innovation</span>
                    <h2 className="services-title-custom">Nos Services</h2>
                    <p className="section-subtitle">
                        Une plateforme ingénieuse conçue pour propulser la gestion de votre agence vers l'excellence.
                    </p>
                </div>

                <div className="services-grid">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className={`service-card ${expandedCard === index ? 'is-expanded' : ''} animate-fade-in-up`}
                            style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                            onClick={() => toggleCard(index)}
                        >
                            <div className="service-card-inner">
                                <div className="service-icon-wrapper">
                                    <div className="service-icon">
                                        {service.icon}
                                    </div>
                                    <div className="service-icon-bg"></div>
                                </div>

                                <div className="service-content">
                                    <h3 className="service-title">{service.title}</h3>
                                    <p className="service-description">{service.description}</p>

                                    <div className="service-details-container">
                                        <ul className="service-details-list">
                                            {service.details.map((detail, idx) => (
                                                <li key={idx} className="service-detail-item">
                                                    <CheckCircle2 size={14} className="detail-icon" />
                                                    <span>{detail}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="service-card-footer">
                                    <button
                                        className="service-learn-more"
                                        aria-expanded={expandedCard === index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCard(index);
                                        }}
                                    >
                                        <span>{expandedCard === index ? 'Voir moins' : 'En savoir plus'}</span>
                                        <ChevronRight size={16} className={`arrow-icon ${expandedCard === index ? 'is-rotated' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="card-glass-glow"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
