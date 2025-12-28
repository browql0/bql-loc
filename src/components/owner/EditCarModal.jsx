import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Car, Hash, Gauge, Calendar, CreditCard, Users, Settings, Fuel, Activity, Upload, Image as ImageIcon, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import './AddCarModal.css';

const EditCarModal = ({ isOpen, onClose, carData, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        plate: '',
        mileage: '',
        type: '',
        transmission: '',
        fuelType: '',
        seats: '',
        pricePerDay: '',
        maintenanceDate: '',
        papiersEndDate: '',
    });

    const [carPhoto, setCarPhoto] = useState(null);

    useEffect(() => {
        if (carData) {
            setFormData({
                brand: carData.brand || '',
                model: carData.model || '',
                plate: carData.plate || '',
                mileage: carData.mileage || '',
                type: carData.type || '', // Assumes these fields exist or we handle them gracefully
                transmission: carData.transmission || '',
                fuelType: carData.fuel_type || '', // DB column is usually fuel_type
                seats: carData.seats || '',
                pricePerDay: carData.price_per_day || '',
                maintenanceDate: carData.maintenance_date || '', // hypothetical column
                papiersEndDate: carData.papiers_end_date || '', // hypothetical column
            });
            if (carData.image_url) {
                setCarPhoto(carData.image_url);
            }
        }
    }, [carData]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCarPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        try {
            const updates = {
                brand: formData.brand,
                model: formData.model,
                plate: formData.plate,
                price_per_day: parseFloat(formData.pricePerDay),
                mileage: parseInt(formData.mileage) || 0,
                // We attempt to update these fields. If they don't exist in schema, error unless we handle it.
                // Assuming schema is flexible or we accept risk as per AddCarModal.
                fuel_type: formData.fuelType,
                // type: formData.type, // If columns don't exist, these will fail
                // transmission: formData.transmission,
                // seats: formData.seats,
            };

            const { error } = await supabase
                .from('cars')
                .update(updates)
                .eq('id', carData.id);

            if (error) throw error;

            alert('Véhicule modifié avec succès !');
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error('Error updating car:', error);
            alert('Erreur: ' + error.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-premium car-modal animate-pop-in" onClick={e => e.stopPropagation()}>
                <button className="close-btn-absolute" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-split-layout">
                    {/* Left Side: Form */}
                    <div className="modal-form-side">
                        <div className="modal-side-header">
                            <div className="badge-tag car-badge">Édition • Étape {currentStep}/3</div>
                            <h2>Modifier Véhicule</h2>

                            {/* Progress Indicator */}
                            <div className="stepper-ui">
                                <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>
                                    <div className="step-number">1</div>
                                    <span className="step-label">Général</span>
                                </div>
                                <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                                <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
                                    <div className="step-number">2</div>
                                    <span className="step-label">Fiche</span>
                                </div>
                                <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                                <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
                                    <div className="step-number">3</div>
                                    <span className="step-label">Validation</span>
                                </div>
                            </div>
                        </div>

                        <div className="premium-form-wrapper">
                            <div className="premium-form scrollable-form">
                                <div className="form-sections">
                                    {/* Step 1: Basic Info */}
                                    {currentStep === 1 && (
                                        <div className="form-section step-fade-in">
                                            <h4 className="section-title">Informations Générales</h4>
                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <label>Marque</label>
                                                    <div className="premium-input-wrapper">
                                                        <Car size={18} />
                                                        <input
                                                            type="text"
                                                            name="brand"
                                                            placeholder="ex: Mercedes-Benz"
                                                            value={formData.brand}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>Modèle</label>
                                                    <div className="premium-input-wrapper">
                                                        <Settings size={18} />
                                                        <input
                                                            type="text"
                                                            name="model"
                                                            placeholder="ex: Classe C"
                                                            value={formData.model}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <label>Immatriculation</label>
                                                    <div className="premium-input-wrapper">
                                                        <Hash size={18} />
                                                        <input
                                                            type="text"
                                                            name="plate"
                                                            placeholder="12345-A-10"
                                                            value={formData.plate}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>Kilométrage (KM)</label>
                                                    <div className="premium-input-wrapper">
                                                        <Gauge size={18} />
                                                        <input
                                                            type="number"
                                                            name="mileage"
                                                            placeholder="0"
                                                            value={formData.mileage}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 2: Technical Specs */}
                                    {currentStep === 2 && (
                                        <div className="form-section step-fade-in">
                                            <h4 className="section-title">Spécifications Techniques</h4>
                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <label>Type de véhicule</label>
                                                    <div className="premium-input-wrapper">
                                                        <Activity size={18} />
                                                        <select name="type" value={formData.type} onChange={handleInputChange}>
                                                            <option value="">Sélectionner</option>
                                                            <option value="Citadine">Citadine</option>
                                                            <option value="SUV">SUV</option>
                                                            <option value="Berline">Berline</option>
                                                            <option value="4x4">4x4 / Pick-up</option>
                                                            <option value="Luxe">Luxe / Sport</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>Transmission</label>
                                                    <div className="premium-input-wrapper">
                                                        <Settings size={18} />
                                                        <select name="transmission" value={formData.transmission} onChange={handleInputChange}>
                                                            <option value="">Sélectionner</option>
                                                            <option value="Manuelle">Manuelle</option>
                                                            <option value="Automatique">Automatique</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <label>Carburant</label>
                                                    <div className="premium-input-wrapper">
                                                        <Fuel size={18} />
                                                        <select name="fuelType" value={formData.fuelType} onChange={handleInputChange}>
                                                            <option value="">Sélectionner</option>
                                                            <option value="Diesel">Diesel</option>
                                                            <option value="Essence">Essence</option>
                                                            <option value="Hybride">Hybride</option>
                                                            <option value="Électrique">Électrique</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>Nombre de places</label>
                                                    <div className="premium-input-wrapper">
                                                        <Users size={18} />
                                                        <input
                                                            type="number"
                                                            name="seats"
                                                            placeholder="5"
                                                            value={formData.seats}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Pricing, Dates & Media */}
                                    {currentStep === 3 && (
                                        <div className="form-section step-fade-in">
                                            <h4 className="section-title">Tarification & Média</h4>
                                            <div className="premium-input-group">
                                                <label>Prix Location (DH / Jour)</label>
                                                <div className="premium-input-wrapper">
                                                    <CreditCard size={18} />
                                                    <input
                                                        type="number"
                                                        name="pricePerDay"
                                                        placeholder="ex: 400"
                                                        value={formData.pricePerDay}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="premium-input-group">
                                                    <label>Maintenance</label>
                                                    <div className="premium-input-wrapper">
                                                        <Calendar size={18} />
                                                        <input
                                                            type="date"
                                                            name="maintenanceDate"
                                                            value={formData.maintenanceDate}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="premium-input-group">
                                                    <label>Fin Papiers</label>
                                                    <div className="premium-input-wrapper">
                                                        <Calendar size={18} />
                                                        <input
                                                            type="date"
                                                            name="papiersEndDate"
                                                            value={formData.papiersEndDate}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="premium-file-drop full-width" style={{ marginTop: '0.5rem' }}>
                                                <label>Photo du Véhicule</label>
                                                <div className="drop-zone car-drop-zone small" onClick={() => document.getElementById('edit-car-photo-input').click()}>
                                                    <input
                                                        id="edit-car-photo-input"
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={handlePhotoChange}
                                                    />
                                                    {carPhoto ? (
                                                        <div className="file-preview-filled">
                                                            <img src={carPhoto} alt="Car preview" />
                                                            <div className="replace-overlay"><Upload size={14} /></div>
                                                        </div>
                                                    ) : (
                                                        <div className="drop-zone-content">
                                                            <ImageIcon size={20} />
                                                            <span>Mettre à jour photo</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer-premium">
                                {currentStep === 1 ? (
                                    <button type="button" className="btn-cancel" onClick={onClose}>Fermer</button>
                                ) : (
                                    <button type="button" className="btn-cancel" onClick={prevStep}>
                                        <ChevronLeft size={18} /> Retour
                                    </button>
                                )}

                                {currentStep < 3 ? (
                                    <button type="button" className="btn-confirm-premium" onClick={nextStep}>
                                        Suivant <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleSubmit} className="btn-confirm-premium car-confirm">
                                        Sauvegarder <CheckCircle size={18} />
                                        <div className="btn-shine"></div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Live Vehicle Preview Card */}
                    <div className="modal-preview-side car-preview-bg">
                        <div className="preview-container">
                            <div className="preview-label">Aperçu du Véhicule</div>

                            <div className="vehicle-passport-preview">
                                <div className="passport-header">
                                    <div className="logo-placeholder">BQL</div>
                                    <div className="status-indicator-min available">En cours</div>
                                </div>

                                <div className="passport-image-wrap">
                                    {carPhoto ? (
                                        <img src={carPhoto} alt="" />
                                    ) : (
                                        <div className="empty-car-svg">
                                            <Car size={50} />
                                        </div>
                                    )}
                                </div>

                                <div className="passport-details">
                                    <div className="v-brand">{formData.brand || '---'}</div>
                                    <h3 className="v-model">{formData.model || 'VÉHICULE'}</h3>

                                    <div className="v-plate-fancy">
                                        <div className="plate-inner">
                                            <span className="plate-txt">{formData.plate || '00 | X | 0000'}</span>
                                        </div>
                                    </div>

                                    <div className="v-specs-grid">
                                        <div className="v-spec">
                                            <Gauge size={12} />
                                            <span>{formData.mileage || '0'} KM</span>
                                        </div>
                                        <div className="v-spec">
                                            <Fuel size={12} />
                                            <span>{formData.fuelType || 'Fuel'}</span>
                                        </div>
                                        <div className="v-spec">
                                            <Settings size={12} />
                                            <span>{formData.transmission || 'Trans'}</span>
                                        </div>
                                        <div className="v-spec">
                                            <Activity size={12} />
                                            <span>{formData.type || 'Type'}</span>
                                        </div>
                                        <div className="v-spec">
                                            <Users size={12} />
                                            <span>{formData.seats || '5'} PL</span>
                                        </div>
                                    </div>

                                    <div className="v-price-section">
                                        <span className="price-label">Tarif</span>
                                        <div className="price-val">
                                            {formData.pricePerDay || '0'} <span className="currency">DH</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditCarModal;
