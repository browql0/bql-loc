import React, { useState } from 'react';
import agencies from 'Agence.jsx'
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('agencies');

  const getPageTitle = () => {
    switch(activeTab) {
      case 'agencies': return 'Agences';
      case 'owners': return 'Revenus';
      case 'pending-payments': return 'Paiements en attente';
      case 'revenue' : return 'Revenue'
      default: return 'Dashboard';
    }
  };

  return (
    <div className="dashboard-page">
      {/* Sidebar & Mobile Navigation */}
      <DashboardNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>{getPageTitle()}</h1>
        </div>

        <div className="dashboard-content">
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'revenue' && <RevenueTab />}
          {activeTab === 'pending-payments' && <PendingPaymentsPanel />}
          {activeTab === 'vouchers' && <VouchersTab />}
          {activeTab === 'manage-users' && <UsersTab />}
          {activeTab === 'devices' && <DevicesTab />}
          {activeTab === 'resources' && <ResourcesTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
