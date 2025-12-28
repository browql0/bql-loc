import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Building2,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    ChevronRight,
    Command,
    Search,
    Shield
} from 'lucide-react';
import './SuperAdminDashboard.css';
import AgenciesTab from '../components/superadmin/AgenciesTab';
import OverviewTab from '../components/superadmin/OverviewTab';
import UsersTab from '../components/superadmin/UsersTab';

const SuperAdminDashboard = ({ navigate }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    // Placeholder for data
    const [stats, setStats] = useState({
        totalAgencies: 0,
        totalRevenue: 0,
        activeUsers: 0
    });

    useEffect(() => {
        // Fetch global stats would go here
        // For now, static or Mock
        setStats({
            totalAgencies: 12,
            totalRevenue: 450000,
            activeUsers: 156
        });
    }, []);

    const menuItems = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'agencies', label: 'Agences', icon: Building2 },
        { id: 'users', label: 'Utilisateurs', icon: Users },
        { id: 'settings', label: 'Paramètres', icon: Settings },
    ];

    const getPageTitle = () => {
        const item = menuItems.find(item => item.id === activeTab);
        return item ? item.label : 'Dashboard';
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('login');
    };

    return (
        <div className={`superadmin-dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <Shield size={22} />
                        </div>
                        <span className="logo-text">ADMIN</span>
                    </div>
                    <button className="mobile-close" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <p className="section-label">Super Admin</p>
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
                            <Search size={18} />
                            <input type="text" placeholder="Recherche globale..." />
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="header-status-pill">
                            <span className="dot pulse"></span>
                            System Secure
                        </div>

                        <div className="user-profile-premium">
                            <div className="user-avatar-wrap">
                                <div className="user-avatar">SA</div>
                                <div className="status-indicator online"></div>
                            </div>
                            <div className="user-info">
                                <span className="user-name">Super Admin</span>
                                <span className="user-role">Master Control</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="tab-container">
                    <div className="glass-panel">


                        {activeTab === 'overview' && <OverviewTab />}
                        {activeTab === 'agencies' && <AgenciesTab />}
                        {activeTab === 'users' && <UsersTab />}
                        {activeTab === 'settings' && (
                            <div>
                                <h2>Paramètres Globaux</h2>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
