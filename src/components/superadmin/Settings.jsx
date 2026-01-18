import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Settings as SettingsIcon,
    Save,
    Bell,
    Shield,
    Database,
    Globe,
    Lock,
    AlertCircle,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Mail,
    Users,
    Key,
    Clock,
    Zap,
    Server,
    Webhook,
    Sliders,
    RotateCcw,
    ChevronRight
} from 'lucide-react';
import SettingsConfirmModal from './SettingsConfirmModal';
import './Settings.css';

const Settings = () => {
    // State Management
    const [activeTab, setActiveTab] = useState('system');
    const [settings, setSettings] = useState([]);
    const [originalSettings, setOriginalSettings] = useState({});
    const [pendingChanges, setPendingChanges] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
    const [error, setError] = useState(null);

    // Prevent double submit
    const saveLockRef = useRef(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        setting: null,
        newValue: null
    });
    const [confirmSubmitting, setConfirmSubmitting] = useState(false);

    // Tab configuration with icons
    const tabs = useMemo(() => [
        { id: 'system', label: 'Système', icon: Database, color: 'blue' },
        { id: 'security', label: 'Sécurité', icon: Shield, color: 'orange' },
        { id: 'notifications', label: 'Notifications', icon: Bell, color: 'purple' },
        { id: 'integrations', label: 'Intégrations', icon: Globe, color: 'green' }
    ], []);

    // Icon mapping for settings
    const settingIcons = {
        site_name: Globe,
        site_email: Mail,
        max_agencies: Users,
        allow_registrations: Users,
        maintenance_mode: Lock,
        session_timeout: Clock,
        force_2fa: Key,
        password_min_length: Lock,
        email_notifications: Bell,
        notify_new_agency: Bell,
        notify_new_user: Bell,
        api_rate_limit: Zap,
        webhook_url: Webhook,
        external_api_key: Key
    };

    // Load settings from backend
    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('get_all_settings');

            if (rpcError) throw rpcError;

            if (data && Array.isArray(data)) {
                setSettings(data);
                // Store original values for dirty checking
                const originals = {};
                data.forEach(s => {
                    originals[s.key] = s.value;
                });
                setOriginalSettings(originals);
                setPendingChanges({});
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setError(err.message || 'Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Parse JSONB value to proper type
    const parseValue = (value, dataType) => {
        if (value === null || value === undefined) return '';

        try {
            // Value is already parsed from JSONB
            if (dataType === 'boolean') {
                return value === true || value === 'true';
            }
            if (dataType === 'number') {
                return typeof value === 'number' ? value : parseInt(value, 10) || 0;
            }
            // String types
            return String(value).replace(/^"|"$/g, '');
        } catch {
            return value;
        }
    };

    // Check if there are unsaved changes
    const hasChanges = useMemo(() => {
        return Object.keys(pendingChanges).length > 0;
    }, [pendingChanges]);

    // Get settings for current tab
    const currentTabSettings = useMemo(() => {
        return settings.filter(s => s.category === activeTab);
    }, [settings, activeTab]);

    // Stats for header
    const stats = useMemo(() => {
        const total = settings.length;
        const critical = settings.filter(s => s.is_critical).length;
        const sensitive = settings.filter(s => s.is_sensitive).length;
        return { total, critical, sensitive };
    }, [settings]);

    // Handle value change
    const handleChange = (key, value, setting) => {
        // If critical setting, show confirmation modal
        if (setting.is_critical) {
            setConfirmModal({
                isOpen: true,
                setting: { ...setting, value: parseValue(originalSettings[key] ?? setting.value, setting.data_type) },
                newValue: value
            });
            return;
        }

        // Apply change immediately for non-critical
        applyChange(key, value, setting.data_type);
    };

    // Apply change to pending changes
    const applyChange = (key, value, dataType) => {
        // Convert to proper JSONB format
        let jsonValue;
        if (dataType === 'boolean') {
            jsonValue = value;
        } else if (dataType === 'number') {
            jsonValue = parseInt(value, 10) || 0;
        } else {
            jsonValue = String(value);
        }

        // Check if different from original
        const originalValue = originalSettings[key];
        if (JSON.stringify(jsonValue) === JSON.stringify(originalValue)) {
            // Remove from pending if reverted to original
            const newPending = { ...pendingChanges };
            delete newPending[key];
            setPendingChanges(newPending);
        } else {
            setPendingChanges(prev => ({
                ...prev,
                [key]: jsonValue
            }));
        }

        // Update local display
        setSettings(prev => prev.map(s =>
            s.key === key ? { ...s, value: jsonValue } : s
        ));
    };

    // Handle confirmation modal confirm
    const handleConfirmChange = async () => {
        if (!confirmModal.setting) return;

        setConfirmSubmitting(true);

        try {
            const key = confirmModal.setting.key;
            const value = confirmModal.newValue;

            // Save critical setting immediately
            const { data, error: rpcError } = await supabase.rpc('update_setting', {
                p_key: key,
                p_value: JSON.stringify(value)
            });

            if (rpcError) throw rpcError;
            if (!data?.success) throw new Error(data?.error || 'Erreur de mise à jour');

            // Update local state
            setSettings(prev => prev.map(s =>
                s.key === key ? { ...s, value: value } : s
            ));
            setOriginalSettings(prev => ({
                ...prev,
                [key]: value
            }));

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error updating critical setting:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setConfirmSubmitting(false);
            setConfirmModal({ isOpen: false, setting: null, newValue: null });
        }
    };

    // Save all pending changes
    const handleSaveAll = async () => {
        if (!hasChanges || saveLockRef.current) return;

        saveLockRef.current = true;
        setSaving(true);
        setSaveStatus(null);

        try {
            const settingsToUpdate = Object.entries(pendingChanges).map(([key, value]) => ({
                key,
                value
            }));

            const { data, error: rpcError } = await supabase.rpc('update_settings_batch', {
                p_settings: settingsToUpdate
            });

            if (rpcError) throw rpcError;
            if (!data?.success && data?.errors?.length > 0) {
                throw new Error(data.errors[0]?.error || 'Erreur de mise à jour');
            }

            // Update original values
            setOriginalSettings(prev => ({
                ...prev,
                ...pendingChanges
            }));
            setPendingChanges({});
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setSaving(false);
            saveLockRef.current = false;
        }
    };

    // Render toggle switch
    const renderToggle = (setting) => {
        const value = parseValue(
            pendingChanges[setting.key] ?? setting.value,
            setting.data_type
        );
        const isOn = value === true;

        return (
            <button
                className={`settings-toggle ${isOn ? 'on' : 'off'}`}
                onClick={() => handleChange(setting.key, !isOn, setting)}
                aria-pressed={isOn}
                aria-label={setting.label}
            >
                <span className="toggle-track">
                    <span className="toggle-thumb"></span>
                </span>
                <span className="toggle-label">{isOn ? 'Activé' : 'Désactivé'}</span>
            </button>
        );
    };

    // Render input field based on data type
    const renderInput = (setting) => {
        const value = parseValue(
            pendingChanges[setting.key] ?? setting.value,
            setting.data_type
        );
        const Icon = settingIcons[setting.key] || SettingsIcon;
        const validation = setting.validation_rules || {};

        if (setting.data_type === 'boolean') {
            return renderToggle(setting);
        }

        return (
            <div className="settings-input-wrapper">
                <div className="input-icon">
                    <Icon size={18} />
                </div>
                <input
                    type={setting.data_type === 'number' ? 'number' : setting.data_type === 'email' ? 'email' : 'text'}
                    value={setting.is_sensitive && value === '********' ? '' : value}
                    onChange={(e) => handleChange(setting.key, e.target.value, setting)}
                    placeholder={setting.is_sensitive ? '••••••••' : ''}
                    min={validation.min}
                    max={validation.max}
                    maxLength={validation.maxLength}
                    required={validation.required}
                    className="settings-input"
                    aria-label={setting.label}
                />
            </div>
        );
    };

    // Get tab icon color class
    const getTabColorClass = (tabId) => {
        const tab = tabs.find(t => t.id === tabId);
        return tab?.color || 'blue';
    };

    // Loading state
    if (loading) {
        return (
            <div className="settings-tab">
                <div className="settings-loading">
                    <Loader2 size={32} className="spin" />
                    <p>Chargement des paramètres...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && settings.length === 0) {
        return (
            <div className="settings-tab">
                <div className="settings-error">
                    <AlertCircle size={32} />
                    <p>{error}</p>
                    <button onClick={loadSettings} className="retry-btn">
                        <RefreshCw size={18} />
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-tab">
            {/* Header - Matches UsersTab */}
            <header className="settings-header-modern">
                <div className="header-content">
                    <h1>Paramètres Globaux</h1>
                    <p className="header-subtitle">Configuration et gestion de la plateforme</p>
                </div>
                <div className="header-stats">
                    <div className="stat-pill">
                        <Sliders size={14} />
                        <span>{stats.total} Paramètres</span>
                    </div>
                    <div className="stat-pill warning">
                        <Shield size={14} />
                        <span>{stats.critical} Critiques</span>
                    </div>
                    {hasChanges && (
                        <div className="stat-pill danger pulse">
                            <AlertCircle size={14} />
                            <span>{Object.keys(pendingChanges).length} non sauvegardé(s)</span>
                        </div>
                    )}
                </div>
            </header>

            {/* KPI Cards - Quick Stats */}
            <div className="kpi-grid-modern">
                {tabs.map(tab => {
                    const tabSettings = settings.filter(s => s.category === tab.id);
                    const Icon = tab.icon;
                    return (
                        <div
                            key={tab.id}
                            className={`kpi-card-modern ${tab.color} ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <div className="kpi-icon-modern">
                                <Icon size={20} />
                            </div>
                            <div className="kpi-content-modern">
                                <span className="kpi-label-modern">{tab.label}</span>
                                <span className="kpi-value-modern">{tabSettings.length}</span>
                            </div>
                            <ChevronRight size={16} className="kpi-arrow" />
                        </div>
                    );
                })}
            </div>

            {/* Save Status Toast */}
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



            {/* Content Panel */}
            <div className="settings-content-card">
                <div className="content-header">
                    <div className="content-title-row">
                        <h2>{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <span className="content-badge">{currentTabSettings.length} paramètres</span>
                    </div>
                    <p className="content-description">
                        {activeTab === 'system' && 'Configuration générale du système et de la plateforme.'}
                        {activeTab === 'security' && 'Paramètres de sécurité et de contrôle d\'accès.'}
                        {activeTab === 'notifications' && 'Gestion des alertes et notifications.'}
                        {activeTab === 'integrations' && 'Connexions API et intégrations externes.'}
                    </p>
                </div>

                {/* Settings Form */}
                <div
                    className="settings-form"
                    role="tabpanel"
                    id={`panel-${activeTab}`}
                    aria-labelledby={activeTab}
                >
                    {currentTabSettings.length === 0 ? (
                        <div className="settings-empty">
                            <Server size={32} />
                            <p>Aucun paramètre dans cette catégorie</p>
                        </div>
                    ) : (
                        currentTabSettings.map(setting => (
                            <div
                                key={setting.key}
                                className={`form-group-modern ${setting.is_critical ? 'critical' : ''} ${pendingChanges[setting.key] !== undefined ? 'changed' : ''}`}
                            >
                                <div className="form-group-left">
                                    <div className="form-label-row">
                                        <label htmlFor={setting.key}>
                                            {setting.label}
                                        </label>
                                        {setting.is_critical && (
                                            <span className="critical-badge" title="Paramètre critique">
                                                <Shield size={12} />
                                                Critique
                                            </span>
                                        )}
                                        {setting.is_sensitive && (
                                            <span className="sensitive-badge" title="Valeur sensible">
                                                <Lock size={12} />
                                            </span>
                                        )}
                                    </div>
                                    {setting.description && (
                                        <p className="form-description">{setting.description}</p>
                                    )}
                                </div>
                                <div className="form-group-right">
                                    {renderInput(setting)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Save Actions Footer */}
                <div className="settings-footer">
                    <button
                        className="btn-reset"
                        onClick={loadSettings}
                        disabled={saving}
                    >
                        <RotateCcw size={16} />
                        <span>Réinitialiser</span>
                    </button>
                    <button
                        className={`btn-save-modern ${saving ? 'saving' : ''} ${!hasChanges ? 'disabled' : ''}`}
                        onClick={handleSaveAll}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="spin" />
                                <span>Sauvegarde...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Sauvegarder les modifications</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <SettingsConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, setting: null, newValue: null })}
                onConfirm={handleConfirmChange}
                setting={confirmModal.setting}
                newValue={confirmModal.newValue}
                isSubmitting={confirmSubmitting}
            />
        </div>
    );
};

export default Settings;
