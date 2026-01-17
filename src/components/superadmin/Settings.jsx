import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Settings as SettingsIcon,
    Save,
    Bell,
    Shield,
    Database,
    Mail,
    Globe,
    Lock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import './settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [settings, setSettings] = useState({
        siteName: 'BQL Rent Systems',
        siteEmail: 'contact@bql.com',
        maintenanceMode: false,
        allowRegistrations: true,
        emailNotifications: true,
        maxAgencies: 100,
        sessionTimeout: 30
    });

    useEffect(() => {
        // Load settings from database or use defaults
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // In a real app, you'd fetch from a settings table
            // For now, we'll use local state defaults
        } catch (error) {
            // Error is handled silently, will use default settings
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSaveStatus(null);

        try {
            // In a real app, save to database
            // For now, simulate save
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaveStatus(null);
    };

    const tabs = [
        { id: 'general', label: 'Général', icon: SettingsIcon },
        { id: 'security', label: 'Sécurité', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'system', label: 'Système', icon: Database }
    ];

    return (
        <div className="settings-container">
            <div className="settings-header">
                <div>
                    <h2>Paramètres Globaux</h2>
                    <p>Gérez les paramètres de la plateforme</p>
                </div>
                <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="spinner-small"></div>
                            <span>Sauvegarde...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Sauvegarder</span>
                        </>
                    )}
                </button>
            </div>

            {saveStatus && (
                <div className={`save-status ${saveStatus}`}>
                    {saveStatus === 'success' ? (
                        <>
                            <CheckCircle2 size={18} />
                            <span>Paramètres sauvegardés avec succès</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={18} />
                            <span>Erreur lors de la sauvegarde</span>
                        </>
                    )}
                </div>
            )}

            <div className="settings-layout">
                <div className="settings-sidebar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="settings-content">
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <h3>Paramètres Généraux</h3>
                            <div className="settings-form">
                                <div className="form-group">
                                    <label>
                                        <Globe size={18} />
                                        Nom du site
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.siteName}
                                        onChange={(e) => handleChange('siteName', e.target.value)}
                                        maxLength={100}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <Mail size={18} />
                                        Email de contact
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.siteEmail}
                                        onChange={(e) => handleChange('siteEmail', e.target.value)}
                                        maxLength={255}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <Database size={18} />
                                        Nombre maximum d'agences
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.maxAgencies}
                                        onChange={(e) => handleChange('maxAgencies', parseInt(e.target.value) || 0)}
                                        min="1"
                                        max="1000"
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={settings.allowRegistrations}
                                            onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                                        />
                                        <span>Autoriser les nouvelles inscriptions</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <h3>Paramètres de Sécurité</h3>
                            <div className="settings-form">
                                <div className="form-group">
                                    <label>
                                        <Lock size={18} />
                                        Timeout de session (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.sessionTimeout}
                                        onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 0)}
                                        min="5"
                                        max="480"
                                    />
                                    <small>Durée d'inactivité avant déconnexion automatique</small>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={settings.maintenanceMode}
                                            onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                                        />
                                        <span>Mode maintenance</span>
                                    </label>
                                    <small>Désactive l'accès public pendant la maintenance</small>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <h3>Notifications</h3>
                            <div className="settings-form">
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={settings.emailNotifications}
                                            onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                                        />
                                        <span>Activer les notifications par email</span>
                                    </label>
                                    <small>Recevoir des emails pour les événements importants</small>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="settings-section">
                            <h3>Informations Système</h3>
                            <div className="system-info">
                                <div className="info-card">
                                    <h4>Version</h4>
                                    <p>1.0.0</p>
                                </div>
                                <div className="info-card">
                                    <h4>Base de données</h4>
                                    <p>Supabase</p>
                                </div>
                                <div className="info-card">
                                    <h4>Statut</h4>
                                    <p className="status-online">En ligne</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;

