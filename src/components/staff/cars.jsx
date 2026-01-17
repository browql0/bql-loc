import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Search,
    Settings,
    Gauge,
    Fuel,
    Users as UsersIcon,
    Eye,
    Calendar
} from 'lucide-react';
import './cars.css';

const StaffCarsTab = ({ agencyId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState(null);

    const fetchCars = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('cars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCars(data || []);
        } catch (error) {
            // Error is handled silently, loading state will show empty state
            setCars([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const filteredCars = cars.filter(car =>
        (car.brand + ' ' + car.model).toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return '#10b981';
            case 'rented':
                return '#f59e0b';
            case 'maintenance':
                return '#ef4444';
            default:
                return '#64748b';
        }
    };

    return (
        <div className="staff-cars-tab">
            <div className="tab-header">
                <div className="header-info">
                    <h2>Flotte Automobile</h2>
                    <p>Consultez les véhicules disponibles et leurs informations</p>
                </div>
            </div>

            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Rechercher par modèle ou plaque..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <span>Chargement de la flotte...</span>
                </div>
            ) : filteredCars.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={48} />
                    <p>{searchTerm ? 'Aucun véhicule trouvé' : 'Aucun véhicule enregistré'}</p>
                </div>
            ) : (
                <div className="cars-grid">
                    {filteredCars.map((car) => (
                        <div key={car.id} className="car-card">
                            <div className="car-image">
                                <img 
                                    src={car.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400'} 
                                    alt={`${car.brand} ${car.model}`}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x250?text=No+Image';
                                    }}
                                />
                                <div 
                                    className="car-badge" 
                                    style={{ 
                                        background: getStatusColor(car.status),
                                        color: 'white'
                                    }}
                                >
                                    {car.status || 'N/A'}
                                </div>
                                <div className="car-price-tag">
                                    {car.price_per_day || 0} MAD<span>/jour</span>
                                </div>
                            </div>

                            <div className="car-info">
                                <div className="car-header">
                                    <div>
                                        <h3>{car.brand} {car.model}</h3>
                                        <span className="plate-number">{car.plate || 'N/A'}</span>
                                    </div>
                                    <button 
                                        className="view-btn"
                                        onClick={() => setSelectedCar(car)}
                                        title="Voir détails"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>

                                <div className="car-specs">
                                    <div className="spec-item">
                                        <Gauge size={16} />
                                        <span>{car.mileage || '0'} km</span>
                                    </div>
                                    <div className="spec-item">
                                        <Fuel size={16} />
                                        <span>{car.fuel_type || 'N/A'}</span>
                                    </div>
                                    <div className="spec-item">
                                        <UsersIcon size={16} />
                                        <span>{car.seats || 5} pers.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedCar && (
                <div className="car-detail-modal" onClick={() => setSelectedCar(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedCar.brand} {selectedCar.model}</h3>
                            <button onClick={() => setSelectedCar(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <strong>Plaque:</strong>
                                    <span>{selectedCar.plate || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Kilométrage:</strong>
                                    <span>{selectedCar.mileage || '0'} km</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Carburant:</strong>
                                    <span>{selectedCar.fuel_type || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Places:</strong>
                                    <span>{selectedCar.seats || 5}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Prix/jour:</strong>
                                    <span>{selectedCar.price_per_day || 0} MAD</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Statut:</strong>
                                    <span style={{ color: getStatusColor(selectedCar.status) }}>
                                        {selectedCar.status || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffCarsTab;

