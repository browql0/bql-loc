import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Users,
    Car,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    ChevronRight,
    Command,
    Search,
    Calendar,
    TrendingUp
} from 'lucide-react';
import StaffDashboardTab from '../components/staff/dashboard';
import StaffCarsTab from '../components/staff/cars';
import StaffClientsTab from '../components/staff/client';
import './StaffDashboard.css';

const StaffDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [agencyId, setAgencyId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('agency_id, full_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile) {
                    setAgencyId(profile.agency_id);
                    setUserProfile(profile);
                }
            }
        };
        fetchUserData();
    }, []);

    const notifications = [
        { id: 1, title: 'Nouvelle Réservation', message: 'Réservation confirmée pour Mercedes G-Class.', time: 'Il y a 5 min', read: false },
        { id: 2, title: 'Client', message: 'Nouveau client enregistré.', time: 'Il y a 1h', read: true },
    ];

    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'cars', label: 'Véhicules', icon: Car },
    ];

    const getPageTitle = () => {
        const item = menuItems.find(item => item.id === activeTab);
        return item ? item.label : 'Dashboard';
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className={`staff-dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
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
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                                }}
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
                        <button className="nav-item logout" onClick={handleLogout}>
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
                            En ligne
                        </div>
                        <div className="notification-wrapper">
                            <button
                                className={`notif-trigger-premium ${showNotifications ? 'active' : ''}`}
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={22} />
                                <span className="notif-badge-new">{notifications.filter(n => !n.read).length}</span>
                            </button>

                            {showNotifications && (
                                <div className="notification-dropdown animate-pop-in">
                                    <div className="notif-header">
                                        <h3>Notifications</h3>
                                        <button className="mark-read">Tout marquer comme lu</button>
                                    </div>
                                    <div className="notif-list">
                                        {notifications.map(n => (
                                            <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                                                <div className="notif-icon">
                                                    <Bell size={14} />
                                                </div>
                                                <div className="notif-content">
                                                    <p className="notif-title">{n.title}</p>
                                                    <p className="notif-msg">{n.message}</p>
                                                    <span className="notif-time">{n.time}</span>
                                                </div>
                                                {!n.read && <div className="unread-dot"></div>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="notif-footer">
                                        <button>Voir toutes les notifications</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="user-profile-premium">
                            <div className="user-avatar-wrap">
                                <div className="user-avatar">
                                    {userProfile?.full_name ? userProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'}
                                </div>
                                <div className="status-indicator online"></div>
                            </div>
                            <div className="user-info">
                                <span className="user-name">{userProfile?.full_name || 'Staff'}</span>
                                <span className="user-role">Équipe</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="tab-container">
                    <div className="glass-panel">
                        {activeTab === 'dashboard' && <StaffDashboardTab agencyId={agencyId} />}
                        {activeTab === 'clients' && <StaffClientsTab agencyId={agencyId} />}
                        {activeTab === 'cars' && <StaffCarsTab agencyId={agencyId} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;

