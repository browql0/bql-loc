import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    X,
    Building2,
    User,
    Mail,
    Phone,
    Calendar,
    Activity,
    Car,
    Shield,
    CheckCircle2,
    XCircle,
    History,
    Pencil
} from 'lucide-react';
import './AgencyDetailDrawer.css';
import { supabase } from '../../lib/supabase';

const AgencyDetailDrawer = ({ isOpen, onClose, agencyId, onEdit }) => {
    const [agency, setAgency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [fleet, setFleet] = useState([]);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        if (isOpen && agencyId) {
            fetchAgencyDetails();
        }
    }, [isOpen, agencyId]);

    const fetchAgencyDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Basic Info
            const { data: agencyData, error: aError } = await supabase
                .from('agencies')
                .select('*')
                .eq('id', agencyId)
                .single();
            if (aError) throw aError;
            setAgency(agencyData);

            // 2. Fetch Users
            const { data: userData, error: uError } = await supabase
                .from('profiles')
                .select('*')
                .eq('agency_id', agencyId);
            if (uError) throw uError;
            setUsers(userData);

            // 3. Fetch Audit Logs
            const { data: logData } = await supabase
                .from('agency_audit_logs')
                .select('*, profiles:super_admin_id(full_name)')
                .eq('agency_id', agencyId)
                .order('created_at', { ascending: false })
                .limit(10);
            setAuditLogs(logData || []);

            // 4. Fetch Fleet (Cars)
            const { data: fleetData } = await supabase
                .from('cars')
                .select('*')
                .eq('agency_id', agencyId);
            setFleet(fleetData || []);

        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Use Portal to render modal at document.body level
    // This ensures the blur covers EVERYTHING including sidebar and header
    return ReactDOM.createPortal(
        <div className={`agency-detail-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div className="agency-detail-drawer glass-panel" onClick={e => e.stopPropagation()}>
                <header className="drawer-header">
                    <div className="header-identity">
                        <div className="agency-avatar">
                            <Building2 size={24} />
                        </div>
                        <div className="header-text">
                            <h2>{agency?.name || 'Chargement...'}</h2>
                            <span className="agency-id-tag">ID: {agencyId?.slice(0, 13).toUpperCase()}</span>
                        </div>
                    </div>
                    <button className="close-drawer-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="drawer-content">
                    {loading ? (
                        <div className="drawer-loading">
                            <Activity size={24} />
                            <span>CHARGEMENT DES DONNÉES...</span>
                        </div>
                    ) : (
                        <>
                            {/* Navigation Tabs - Now separate from header */}
                            <nav className="drawer-nav-system">
                                <button className={`drawer-nav-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>GÉNÉRAL</button>
                                <button className={`drawer-nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>ÉQUIPE</button>
                                <button className={`drawer-nav-item ${activeTab === 'fleet' ? 'active' : ''}`} onClick={() => setActiveTab('fleet')}>FLOTTE</button>
                                <button className={`drawer-nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>AUDIT</button>
                            </nav>

                            {activeTab === 'general' && (
                                <div className="animate-scale-up">
                                    <div className="metric-grid-drawer">
                                        <div className="aqueous-metric-card">
                                            <label>STATUT SYSTÈME</label>
                                            <div className="m-value">{agency?.status?.toUpperCase()}</div>
                                            <div className={`m-indicator ${agency?.status === 'active' ? 'pulse' : ''}`} style={{ background: agency?.status === 'active' ? '#10b981' : '#ef4444' }}></div>
                                        </div>
                                        <div className="aqueous-metric-card">
                                            <label>TOTAL REVENU</label>
                                            <div className="m-value">{Number(agency?.revenue_est || 0).toLocaleString()} <span className="m-unit">MAD</span></div>
                                        </div>
                                    </div>

                                    <div className="info-instrument-panel">
                                        <div className="instrument-field">
                                            <User size={16} />
                                            <div className="field-content">
                                                <span className="f-label">RESPONSABLE</span>
                                                <span className="f-value">{users.find(u => u.role === 'owner')?.full_name || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="instrument-field">
                                            <Mail size={16} />
                                            <div className="field-content">
                                                <span className="f-label">EMAIL CONTACT</span>
                                                <span className="f-value">{users.find(u => u.role === 'owner')?.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="instrument-field">
                                            <Phone size={16} />
                                            <div className="field-content">
                                                <span className="f-label">TÉLÉPHONE</span>
                                                <span className="f-value">{users.find(u => u.role === 'owner')?.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="instrument-field">
                                            <Calendar size={16} />
                                            <div className="field-content">
                                                <span className="f-label">DATE DÉPLOIEMENT</span>
                                                <span className="f-value">{new Date(agency?.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'team' && (
                                <div className="user-surgical-list animate-scale-up">
                                    {users.length > 0 ? users.map(user => (
                                        <div key={user.id} className="user-module">
                                            <div className="u-avatar">
                                                {user.role === 'owner' ? <Shield size={20} /> : <User size={20} />}
                                            </div>
                                            <div className="u-info">
                                                <span className="u-name">{user.full_name}</span>
                                                <span className="u-email">{user.email}</span>
                                            </div>
                                            <div className={`u-badge ${user.role}`}>{user.role.toUpperCase()}</div>
                                        </div>
                                    )) : (
                                        <div className="drawer-empty">
                                            <User />
                                            <p>Aucun membre d'équipe trouvé.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'fleet' && (
                                <div className="animate-scale-up">
                                    {fleet.length > 0 ? (
                                        <div className="fleet-grid-mini">
                                            {fleet.map(car => (
                                                <div key={car.id} className="car-module-mini">
                                                    <Car size={20} />
                                                    <div className="c-info">
                                                        <span className="c-model">{car.brand} {car.model}</span>
                                                        <span className="c-plate">{car.plate_number}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="drawer-empty">
                                            <Car />
                                            <p>Aucun véhicule déployé dans cette agence.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'audit' && (
                                <div className="audit-instrument-timeline animate-scale-up">
                                    {auditLogs.length > 0 ? auditLogs.map(log => (
                                        <div key={log.id} className="audit-entry">
                                            <div className="entry-point" />
                                            <div className="entry-data">
                                                <div className="entry-header">
                                                    <span className="action-tag">{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                                                    <span className="time-tag">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="admin-tag">Initialisé par {log.profiles?.full_name || 'Système'}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="drawer-empty">
                                            <History />
                                            <p>Aucun historique d'activité enregistré.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <footer className="drawer-footer">
                    <button className="btn-secondary-outline" onClick={onClose}>Fermer</button>
                    <button
                        className="btn-primary-black"
                        onClick={() => {
                            if (onEdit && agency) {
                                onEdit({
                                    id: agencyId,
                                    name: agency.name,
                                    owner_name: users.find(u => u.role === 'owner')?.full_name,
                                    owner_email: users.find(u => u.role === 'owner')?.email,
                                    owner_phone: users.find(u => u.role === 'owner')?.phone
                                });
                                onClose();
                            }
                        }}
                        disabled={loading || !agency}
                    >
                        <Pencil size={16} />
                        <span>Modifier l'Agence</span>
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
};

export default AgencyDetailDrawer;
