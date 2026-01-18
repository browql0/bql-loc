import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../hooks/useNotifications';
import {
    Users,
    Car,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    ChevronRight,
    Command,
    Search,
    HelpCircle,
    Calendar
} from 'lucide-react';
import StaffTab from '../components/owner/staff';
import CarsTab from '../components/owner/cars';
import ClientsTab from '../components/owner/ClientsTab';
import PaymentTab from '../components/owner/Payment';
import BookingsTab from '../components/owner/BookingsTab';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('staff');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [agencyId, setAgencyId] = useState(null);

    // ✅ Notifications réelles (temps réel)
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loading: notifLoading
    } = useNotifications();

    useEffect(() => {
        const fetchAgency = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('agency_id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile) setAgencyId(profile.agency_id);
            }
        };
        fetchAgency();
    }, []);

    const menuItems = [
        { id: 'staff', label: 'Gestion Staff', icon: Users },
        { id: 'cars', label: 'Flotte Automobile', icon: Car },
        { id: 'bookings', label: 'Réservations', icon: Calendar },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'payments', label: 'Historique Paiements', icon: CreditCard },
    ];

    const getPageTitle = () => {
        const item = menuItems.find(item => item.id === activeTab);
        return item ? item.label : 'Dashboard';
    };

    // Helper pour afficher le temps relatif
    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'À l\'instant';
        if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    return (
        <div className={`owner-dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <Command size={22} />
                        </div>
                        <span className="logo-text">BQL</span>
                    </div>
                    <button className="mobile-close" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <p className="section-label">Menu Principal</p>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(item.id)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                                {activeTab === item.id && <ChevronRight size={14} className="active-arrow" />}
                            </button>
                        ))}
                    </div>

                    <div className="nav-section bottom">
                        <button className="nav-item settings">
                            <Settings size={20} />
                            <span>Paramètres</span>
                        </button>
                        <button className="nav-item logout" onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/login');
                        }}>
                            <LogOut size={20} />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="content-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu size={24} />
                        </button>
                        <div className="header-title-container">
                            <h1>{getPageTitle()}</h1>
                            <div className="vertical-divider"></div>
                        </div>
                        <div className="header-search-global">
                            <Search size={18} aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="Recherche globale..."
                                aria-label="Recherche globale"
                            />
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="header-status-pill">
                            <span className="dot pulse"></span>
                            Live System
                        </div>
                        <div className="notification-wrapper">
                            <button
                                className={`notif-trigger-premium ${showNotifications ? 'active' : ''}`}
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && (
                                    <span className="notif-badge-new">{unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="notification-dropdown animate-pop-in">
                                    <div className="notif-header">
                                        <h3>Notifications</h3>
                                        <button
                                            className="mark-read"
                                            onClick={async () => {
                                                await markAllAsRead();
                                            }}
                                            disabled={unreadCount === 0}
                                        >
                                            Tout marquer comme lu
                                        </button>
                                    </div>
                                    <div className="notif-list">
                                        {notifLoading ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                                Chargement...
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                                <Bell size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                                                <p>Aucune notification</p>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 5).map(n => {
                                                const timeAgo = getTimeAgo(n.created_at);
                                                return (
                                                    <div
                                                        key={n.id}
                                                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                                                        onClick={async () => {
                                                            if (!n.read) {
                                                                await markAsRead(n.id);
                                                            }
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="notif-icon">
                                                            <Bell size={14} />
                                                        </div>
                                                        <div className="notif-content">
                                                            <p className="notif-title">{n.title}</p>
                                                            <p className="notif-msg">{n.message}</p>
                                                            <span className="notif-time">{timeAgo}</span>
                                                        </div>
                                                        {!n.read && <div className="unread-dot"></div>}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div className="notif-footer">
                                            <button>Voir toutes ({notifications.length})</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="user-profile-premium">
                            <div className="user-avatar-wrap">
                                <div className="user-avatar">AD</div>
                                <div className="status-indicator online"></div>
                            </div>
                            <div className="user-info">
                                <span className="user-name">Propriétaire</span>
                                <span className="user-role">Premium Agency</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="tab-container">
                    <div className="glass-panel">
                        {activeTab === 'staff' && <StaffTab />}
                        {activeTab === 'cars' && <CarsTab />}
                        {activeTab === 'bookings' && <BookingsTab agencyId={agencyId} />}
                        {activeTab === 'clients' && <ClientsTab />}
                        {activeTab === 'payments' && <PaymentTab />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
