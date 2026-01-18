import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import SettingsTab from '../components/superadmin/Settings';
import AuditLogsTab from '../components/superadmin/AuditLogsTab';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    const menuItems = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'agencies', label: 'Agences', icon: Building2 },
        { id: 'users', label: 'Utilisateurs', icon: Users },
        { id: 'audit', label: 'Logs d\'Audit', icon: Shield },
        { id: 'settings', label: 'Paramètres', icon: Settings },
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
                        <div className="header-identity">
                            <span className="mobile-meta">SYSTEM • SECURE • v2.0.4</span>
                            <h1 className="header-title">{getPageTitle()}</h1>
                        </div>
                    </div>

                    <div className="header-right-desktop">
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

                    <div className="header-right-mobile">
                        <div className="mobile-action-system">
                            <div className="mobile-live-shield">
                                <span className="shield-dot pulse"></span>
                                <span>LIVE</span>
                            </div>
                        </div>
                        <div className="mobile-user-avatar">SA</div>
                    </div>
                </header>


                <div className="tab-container">
                    <div className="glass-panel">


                        {activeTab === 'overview' && <OverviewTab />}
                        {activeTab === 'agencies' && <AgenciesTab />}
                        {activeTab === 'users' && <UsersTab />}
                        {activeTab === 'audit' && <AuditLogsTab />}
                        {activeTab === 'settings' && <SettingsTab />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
