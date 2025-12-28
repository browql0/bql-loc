import React, { useState } from 'react';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import PendingApproval from './pages/PendingApproval';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home navigate={navigate} />;
      case 'register':
        return <Register navigate={navigate} />;
      case 'login':
        return <Login navigate={navigate} />;
      case 'pending-approval':
        return <PendingApproval navigate={navigate} />;
      case 'owner/dashboard':
        return <OwnerDashboard navigate={navigate} />;
      case '/superadmin/dashboard':
        return <SuperAdminDashboard navigate={navigate} />;
      case '/staff/dashboard':
        return <div style={{ color: 'black', padding: '50px' }}>Staff Dashboard (Placeholder)</div>;
      default:
        return <Home navigate={navigate} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;
