import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {
    X,
    Clock,
    User,
    Shield,
    Database,
    FileJson,
    ArrowRight,
    Activity,
    Server
} from 'lucide-react';
import './AuditLogsTab.css'; // Uses the new premium styles we just added

const AuditLogDetailDrawer = ({ log, onClose }) => {
    // Animation state
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (log) {
            // Small delay to trigger CSS transition
            requestAnimationFrame(() => setAnimate(true));
        } else {
            setAnimate(false);
        }
    }, [log]);

    if (!log) return null;

    const { old, new: newData } = log.record_data || {};

    const handleClose = () => {
        setAnimate(false);
        setTimeout(onClose, 300); // Wait for transition
    };

    // Helper to format JSON values
    const formatValue = (val) => {
        if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val);
        }
        return String(val);
    };

    const getDiffKeys = () => {
        if (!old || !newData) return [];
        const oldKeys = Object.keys(old);
        const newKeys = Object.keys(newData);
        return Array.from(new Set([...oldKeys, ...newKeys]));
    };

    const diffKeys = getDiffKeys();

    return ReactDOM.createPortal(
        <div className={`audit-drawer-overlay ${animate ? 'active' : ''}`} onClick={handleClose}>
            <div className="audit-drawer-panel" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="drawer-header-modern">
                    <div className="header-identity">
                        <div className="header-icon-box">
                            <Activity size={24} />
                        </div>
                        <div className="header-text">
                            <h2>Détails de l'Événement</h2>
                            <span className="header-id-tag">EXT_REF: {log.id}</span>
                        </div>
                    </div>
                    <button className="close-btn-modern" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="drawer-content-scroll">

                    {/* Instrument Panel (Metadata) */}
                    <div className="instrument-panel">
                        <div className="instrument-row">
                            <div className="instrument-field">
                                <Clock size={16} />
                                <div className="field-content">
                                    <span className="f-label">Horodatage</span>
                                    <span className="f-value">{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                            <div className="instrument-field">
                                <Database size={16} />
                                <div className="field-content">
                                    <span className="f-label">Table Cible</span>
                                    <span className="f-value">{log.table_name.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="instrument-row">
                            <div className="instrument-field">
                                <User size={16} />
                                <div className="field-content">
                                    <span className="f-label">Acteur</span>
                                    <span className="f-value">{log.user_email || 'Système'}</span>
                                </div>
                            </div>
                            <div className="instrument-field">
                                <Shield size={16} />
                                <div className="field-content">
                                    <span className="f-label">Rôle</span>
                                    <span className="f-value">{log.user_role || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="instrument-field">
                            <Server size={16} />
                            <div className="field-content">
                                <span className="f-label">Record ID</span>
                                <span className="f-value font-mono">{log.record_id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Badge Large */}
                    <div style={{ marginBottom: '24px' }}>
                        <span className={`status-badge-modern ${log.action === 'INSERT' ? 'insert' : log.action === 'DELETE' ? 'delete' : 'update'}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                            Action: {log.action}
                        </span>
                    </div>

                    {/* Data Changes */}
                    <div>
                        <div className="diff-section-title">
                            <FileJson size={16} />
                            Données techniques
                        </div>

                        {log.action === 'UPDATE' && old && newData ? (
                            <div className="diff-viewer-modern">
                                <div className="diff-header-row">
                                    <div className="diff-col-title">Valeur Initiale</div>
                                    <div></div>
                                    <div className="diff-col-title">Nouvelle Valeur</div>
                                </div>
                                <div className="diff-body">
                                    {diffKeys.map(key => {
                                        const isChanged = JSON.stringify(old[key]) !== JSON.stringify(newData[key]);
                                        if (!isChanged) return null; // Show only changes or all? Usually changes focus.

                                        return (
                                            <div key={key} className="diff-line">
                                                <div className="diff-val old">
                                                    <span style={{ color: '#7F1D1D', fontWeight: 'bold', display: 'block', fontSize: '10px', marginBottom: '2px' }}>{key}</span>
                                                    {formatValue(old[key])}
                                                </div>
                                                <div className="diff-arrow">
                                                    <ArrowRight size={14} />
                                                </div>
                                                <div className="diff-val new">
                                                    <span style={{ color: '#14532D', fontWeight: 'bold', display: 'block', fontSize: '10px', marginBottom: '2px' }}>{key}</span>
                                                    {formatValue(newData[key])}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="json-block-modern">
                                <pre>{JSON.stringify(newData || old || {}, null, 2)}</pre>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="drawer-footer-modern">
                    <button className="btn-secondary" onClick={handleClose}>
                        Fermer le panneau
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AuditLogDetailDrawer;
