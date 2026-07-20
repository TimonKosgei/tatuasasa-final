import { useState } from 'react';
import './admin-dashboard.css';
import AdminOverview from './AdminOverview';
import AdminLiveQueue from './AdminLiveQueue';
import AdminUserManagement from './AdminUserManagement';
import AdminWorkforce from './AdminWorkforce';
import AdminCatalog from './AdminCatalog';
import AdminSettings from './AdminSettings';
import AdminReports from './AdminReports';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'System Overview';
      case 'live_queue': return 'Live Queue';
      case 'users': return 'User Management';
      case 'workforce': return 'Workforce Management';
      case 'catalog': return 'Skills & Categories';
      case 'reports': return 'Organization Reports';
      case 'settings': return 'Admin Settings';
      default: return 'System Overview';
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <div className="admin-dashboard-container">
      
      {/* --- LEFT SLIDE-OUT SIDEBAR --- */}
      <div className={`admin-sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <aside className={`admin-app-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Admin Control</h2>
          <button className="admin-close-btn" onClick={() => setIsMenuOpen(false)}>&times;</button>
        </div>
        <nav className="admin-sidebar-nav">
          <button className={`admin-sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleNavClick('overview')}>
            Overview
          </button>
          <button className={`admin-sidebar-nav-btn ${activeTab === 'live_queue' ? 'active' : ''}`} onClick={() => handleNavClick('live_queue')}>
            Live Queue
          </button>
          <button className={`admin-sidebar-nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleNavClick('users')}>
            User Management
          </button>
          <button className={`admin-sidebar-nav-btn ${activeTab === 'workforce' ? 'active' : ''}`} onClick={() => handleNavClick('workforce')}>
            Workforce Management
          </button>
          <button className={`admin-sidebar-nav-btn ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => handleNavClick('catalog')}>
            Skills & Categories
          </button>
          <button className={`admin-sidebar-nav-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleNavClick('reports')}>
            Reports
          </button>
          <button className={`admin-sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleNavClick('settings')}>
            Settings
          </button>
        </nav>
      </aside>

      <div className="admin-dashboard-card">

        {/* --- THE FIXED HEADER --- */}
        <div className="admin-header">
          
          {/* LEFT SIDE: Hamburger Menu + Brand Logo */}
          <div className="admin-header-left">
            <button 
              className="admin-hamburger-btn" 
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="admin-brand-logo">Tatua Sasa Admin</h1>
          </div>

          {/* RIGHT SIDE: Tab Indicator */}
          <div className="admin-header-right">
            <p className="admin-tab-indicator">{getTabTitle()}</p>
          </div>

        </div>

        {/* --- VIEW ROUTING CONTAINER --- */}
        <div className="admin-tab-content" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {activeTab === 'overview' && (
            <div className="admin-tab-content">
              <AdminOverview />
            </div>
          )}
          {activeTab === 'live_queue' && (
            <div className="admin-tab-content">
              <AdminLiveQueue />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-tab-content">
              <AdminUserManagement />
            </div>
          )}

          {activeTab === 'workforce' && (
            <div className="admin-tab-content">
              <AdminWorkforce />
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="admin-tab-content">
              <AdminCatalog />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="admin-tab-content">
              <AdminReports />
            </div>
          )}

           {activeTab === 'settings' && (
            <div className="admin-tab-content">
              <AdminSettings />
            </div>
          )}          
          
        </div>

      </div>
    </div>
  );
}