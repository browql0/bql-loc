import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, User, Phone, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PremiumSelect from '../owner/PremiumSelect';
import './UserEditModal.css';

const ROLE_OPTIONS = [
    { value: 'staff', label: 'Staff' },
    { value: 'owner', label: 'Gérant (Owner)' },
    { value: 'superadmin', label: 'Superadmin' }
];

const UserEditModal = ({ isOpen, onClose, user, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        role: 'staff'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
                role: user.role || 'staff'
            });
        }
        setError(null);
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('update_user_profile_admin', {
                user_id_input: user.id,
                full_name_input: formData.full_name,
                phone_input: formData.phone,
                role_input: formData.role
            });

            if (rpcError) throw rpcError;
            if (data && !data.success) throw new Error(data.error);

            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error('Update Error:', err);
            setError(err.message || "Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className={`user-edit-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="user-edit-modal" onClick={e => e.stopPropagation()}>
                <div className="edit-header">
                    <h3>Modifier le profil</h3>
                    <button className="edit-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="edit-fields">
                        <div className="form-group">
                            <label><User size={14} /> Nom complet</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="ex: John Doe"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label><Phone size={14} /> Téléphone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="ex: 0600000000"
                            />
                        </div>

                        <div className="form-group-premium">
                            <label><Shield size={14} /> Rôle Système</label>
                            <PremiumSelect
                                options={ROLE_OPTIONS}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                icon={Shield}
                                placeholder="Choisir un rôle"
                            />
                            {user.role === 'superadmin' && (
                                <span className="warning-text">Note : Le rôle superadmin donne un accès total.</span>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="edit-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? <span className="loader-mini"></span> : (
                                <>
                                    <Save size={16} /> Enregistrer
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default UserEditModal;
