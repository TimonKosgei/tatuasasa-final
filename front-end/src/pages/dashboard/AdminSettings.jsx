import { useState, useEffect } from 'react';
import './admin-settings.css';

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState('preferences');
  const [theme, setTheme] = useState(localStorage.getItem('admin_theme') || 'system');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [message, setMessage] = useState('');

  // --- Theme Application Logic (System Default Synchronization) ---
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (themeName) => {
      const isDark = themeName === 'dark' || 
                    (themeName === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    applyTheme(theme);
    localStorage.setItem('admin_theme', theme);

    // Live listener for OS/Browser theme updates when set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const tracking = localStorage.getItem('tatua_admin_analytics');
    if (tracking !== null) setAnalyticsEnabled(tracking === 'true');
  }, []);

  const displayMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleClearCache = () => {
    const confirmed = window.confirm("This will clear local temporary storage and reload the panel. Continue?");
    if (confirmed) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const handleToggleAnalytics = () => {
    const newState = !analyticsEnabled;
    setAnalyticsEnabled(newState);
    localStorage.setItem('tatua_admin_analytics', newState);
    displayMessage(`System usage analytics tracking is now ${newState ? 'ENABLED' : 'DISABLED'}.`);
  };

  return (
    <div className="admin-settings-container">
      <div className="admin-settings-header">
        <h2>Admin Settings & Configurations</h2>
      </div>

      {message && <div style={{ padding: '10px 15px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>}

      <div className="admin-settings-layout">
        <aside className="admin-settings-sidebar">
          <button 
            className={`admin-settings-menu-btn ${activeSection === 'preferences' ? 'active' : ''}`} 
            onClick={() => setActiveSection('preferences')}
          >
            Preferences & Theme
          </button>
          <button 
            className={`admin-settings-menu-btn ${activeSection === 'privacy' ? 'active' : ''}`} 
            onClick={() => setActiveSection('privacy')}
          >
            System & Privacy Control
          </button>
        </aside>

        <main className="admin-settings-content">
          {activeSection === 'preferences' && (
            <div>
              <h3>Appearance & Theme Settings</h3>
              <div className="admin-settings-group">
                <label htmlFor="adminTheme">Admin Panel Appearance</label>
                <select 
                  id="adminTheme" 
                  value={theme} 
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="system">System Default (Recommended)</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  System default automatically syncs with your operating system or browser color mode preferences.
                </span>
              </div>
              <button className="primary-btn" onClick={() => displayMessage('Preferences saved successfully.')}>
                Save Preferences
              </button>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div>
              <h3>System & Data Management</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
                Manage local caches, telemetry logs, and tracking parameters for the administrative console.
              </p>
              <div className="admin-action-row">
                <button className="btn-outline" onClick={handleClearCache} style={{ width: '100%', maxWidth: '350px', textAlign: 'left', padding: '12px' }}>
                  🗑️ Clear Local Cache & Reload Console
                </button>
                <button className="btn-outline" onClick={handleToggleAnalytics} style={{ width: '100%', maxWidth: '350px', textAlign: 'left', padding: '12px' }}>
                  📊 {analyticsEnabled ? 'Disable' : 'Enable'} Admin Telemetry Tracking
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}