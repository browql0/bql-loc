import React, { useState } from 'react';
import {
    Plus,
    Search,
    Settings,
    MapPin,
    Gauge,
    Fuel,
    Users as UsersIcon,
    ChevronRight,
    Filter
} from 'lucide-react';
import './cars.css';
import AddCarModal from './AddCarModal';

const CarsTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const cars = [
        {
            id: 1,
            name: 'Mercedes-Benz G-Class',
            brand: 'Mercedes',
            plate: '12345-A-10',
            status: 'Disponible',
            price: '2500 DH',
            image: 'https://images.unsplash.com/photo-1520031484130-467b5299773f?auto=format&fit=crop&q=80&w=400',
            specs: { km: '15,000 km', fuel: 'Diesel', seats: 5 }
        },
        {
            id: 2,
            name: 'Range Rover Sport',
            brand: 'Land Rover',
            plate: '67890-B-10',
            status: 'Louée',
            price: '1800 DH',
            image: 'https://images.unsplash.com/photo-1606148684497-8740f9f3883a?auto=format&fit=crop&q=80&w=400',
            specs: { km: '22,400 km', fuel: 'Diesel', seats: 5 }
        },
        {
            id: 3,
            name: 'Volkswagen Golf 8',
            brand: 'VW',
            plate: '54321-C-06',
            status: 'Disponible',
            price: '600 DH',
            image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&q=80&w=400',
            specs: { km: '8,200 km', fuel: 'Essence', seats: 5 }
        },
    ];

    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.plate.includes(searchTerm)
    );

    return (
        <div className="cars-tab">
            <div className="tab-header">
                <div className="header-info">
                    <h2>Flotte Automobile</h2>
                    <p>Gérez vos véhicules, leurs tarifs et leurs disponibilités.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} />
                    <span>Ajouter Véhicule</span>
                </button>
            </div>

            <AddCarModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            <div className="tab-actions">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par modèle ou plaque..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-filter">
                    <Filter size={18} />
                    <span>Filtres</span>
                </button>
            </div>

            <div className="cars-grid">
                {filteredCars.map((car) => (
                    <div key={car.id} className="car-card">
                        <div className="car-image">
                            <img src={car.image} alt={car.name} />
                            <div className="car-badge" data-status={car.status}>{car.status}</div>
                            <div className="car-price-tag">{car.price}<span>/jour</span></div>
                        </div>

                        <div className="car-info">
                            <div className="car-header">
                                <div>
                                    <h3>{car.name}</h3>
                                    <span className="plate-number">{car.plate}</span>
                                </div>
                                <button className="settings-btn"><Settings size={18} /></button>
                            </div>

                            <div className="car-specs">
                                <div className="spec-item">
                                    <Gauge size={16} />
                                    <span>{car.specs.km}</span>
                                </div>
                                <div className="spec-item">
                                    <Fuel size={16} />
                                    <span>{car.specs.fuel}</span>
                                </div>
                                <div className="spec-item">
                                    <UsersIcon size={16} />
                                    <span>{car.specs.seats} pers.</span>
                                </div>
                            </div>

                            <div className="car-footer">
                                <button className="btn-details">
                                    Voir détails <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarsTab;
