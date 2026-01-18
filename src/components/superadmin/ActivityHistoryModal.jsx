import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Building2, Users, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './ActivityHistoryModal.css';

const ActivityHistoryModal = ({ isOpen, onClose }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    const fetchHistory = async (reset = false) => {
        if (!isOpen) return;

        try {
            setLoading(true);
            const currentPage = reset ? 0 : page;
            const { data, error } = await supabase.rpc('get_activity_history', {
                p_limit: LIMIT,
                p_offset: currentPage * LIMIT
            });

            if (error) throw error;

            if (data.length < LIMIT) setHasMore(false);

            setActivities(prev => reset ? data : [...prev, ...data]);
            setPage(prev => reset ? 1 : prev + 1);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setActivities([]);
            setPage(0);
            setHasMore(true);
            fetchHistory(true);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Historique des Activités</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="history-list">
                        {activities.map((item, index) => (
                            <div key={index} className="history-item">
                                <div className={`history-icon-wrapper ${item.type === 'agency_created' ? 'blue' : 'purple'}`}>
                                    {item.type === 'agency_created' ? <Building2 size={18} /> : <Users size={18} />}
                                </div>
                                <div className="history-content">
                                    <div className="history-header-row">
                                        <h4 className="history-title">
                                            {item.type === 'agency_created' ? 'Nouvelle Agence' : 'Nouvel Utilisateur'}
                                        </h4>
                                        <span className="history-date">
                                            {new Date(item.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="history-desc">
                                        <span className="highlight">
                                            {item.type === 'agency_created' ? item.data.name : item.data.full_name}
                                        </span>
                                        {item.type === 'agency_created' ? ' a rejoint la plateforme.' : ` s'est inscrit en tant que ${item.data.role}.`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {loading && (
                        <div className="loading-more">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    )}

                    {!loading && hasMore && (
                        <button className="load-more-btn" onClick={() => fetchHistory(false)}>
                            Charger plus d'activités
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ActivityHistoryModal;
