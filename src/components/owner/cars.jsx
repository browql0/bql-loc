import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus,
    Search,
    Settings,
    MapPin,
    Gauge,
    Fuel,
    Users as UsersIcon,
    ChevronRight,
    Filter,
    Car as CarIcon
} from 'lucide-react';
import './cars.css';
import AddCarModal from './AddCarModal';
import EditCarModal from './EditCarModal';
import ErrorMessage from '../ErrorMessage';
import EmptyState from '../EmptyState';
import LoadingSpinner from '../LoadingSpinner';

const CarsTab = ({ agencyId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCar, setEditingCar] = useState(null);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCars = async () => {
        try {
            setLoading(true);
            // If agencyId is not yet available, we might want to wait or return
            // But usually the parent passes it when ready or we fetch user's cars
            // For robustness, let's fetch based on the implicit agency of the user if prop is missing,
            // or better yet, wait for prop. 
            // Actually, we can just query 'cars' and rely on RLS if we set it up properly?
            // "c_agency_manage" using "get_my_agency()" does that!
            // So simplistic query is enough:

            const { data, error } = await supabase
                .from('cars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCars(data || []);
        } catch (error) {
            const errorMessage = error?.message || 'Erreur lors du chargement de la flotte.';
            setError(errorMessage);
            setCars([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []); // Fetch on mount. RLS handles the filtering.

    const filteredCars = cars.filter(car =>
        (car.brand + ' ' + car.model).toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.plate.toLowerCase().includes(searchTerm.toLowerCase())
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
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    fetchCars();
                }}
            />
            <EditCarModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                carData={editingCar}
                onSuccess={fetchCars}
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
                {loading ? (
                    <div style={{ color: 'white', padding: '20px' }}>Chargement de la flotte...</div>
                ) : filteredCars.length === 0 ? (
                    <div style={{ color: 'white', padding: '20px' }}>Aucun véhicule trouvé.</div>
                ) : (
                    filteredCars.map((car) => (
                        <div key={car.id} className="car-card">
                            <div className="car-image">
                                <img src={car.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400'} alt={car.model} />
                                <div className="car-badge" data-status={car.status}>{car.status}</div>
                                <div className="car-price-tag">{car.price_per_day} DH<span>/jour</span></div>
                            </div>

                            <div className="car-info">
                                <div className="car-header">
                                    <div>
                                        <h3>{car.brand} {car.model}</h3>
                                        <span className="plate-number">{car.plate}</span>
                                    </div>
                                    <button className="settings-btn" onClick={() => {
                                        setEditingCar(car);
                                        setIsEditModalOpen(true);
                                    }}><Settings size={18} /></button>
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
                                        <span>5 pers.</span>
                                    </div>
                                </div>

                                <div className="car-footer">
                                    <button className="btn-details">
                                        Voir détails <ChevronRight size={16} />
                                    </button>
                                    <button className="btn-delete-car" onClick={async () => {
                                        if (window.confirm('Supprimer ce véhicule ?')) {
                                            await supabase.from('cars').delete().eq('id', car.id);
                                            fetchCars();
                                        }
                                    }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CarsTab;
