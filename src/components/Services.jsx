import React from 'react';
import { Calendar, FileText, Users, TrendingUp } from 'lucide-react';
import './Services.css';

const Services = () => {
    const services = [
        {
            icon: <Calendar size={32} />,
            title: "Suivi des Véhicules",
            description: "Trackez en temps réel l'état de votre flotte : disponibilité, dates de location, retours programmés et historique complet."
        },
        {
            icon: <FileText size={32} />,
            title: "Documents Digitaux",
            description: "Fini les papiers ! Gérez tous vos contrats, assurances et documents administratifs en version numérique sécurisée."
        },
        {
            icon: <Users size={32} />,
            title: "Gestion Client & Staff",
            description: "Accédez instantanément aux informations et documents de vos clients et de votre équipe. Tout centralisé, tout simplifié."
        },
        {
            icon: <TrendingUp size={32} />,
            title: "Suivi des Revenus",
            description: "Dashboard complet pour tracker vos gains, analyser vos performances et optimiser votre rentabilité en temps réel."
        }
    ];

    return (
        <section className="services-section" id="services">
            <div className="services-container">
                <div className="services-header">
                    <h2 className="section-title">Nos Services</h2>
                    <p className="section-subtitle">
                        Une plateforme complète pour simplifier la gestion de votre agence
                    </p>
                </div>

                <div className="services-grid">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="service-card animate-fade-in-up"
                            style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                        >
                            <div className="service-icon">
                                {service.icon}
                            </div>
                            <h3 className="service-title">{service.title}</h3>
                            <p className="service-description">{service.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
