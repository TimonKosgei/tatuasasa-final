import { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import './admin-overview.css';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    activeTechnicians: 0,
    totalAssets: 0,
    assetsUnderRepair: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoading(true);
      try {
        // Fetch real administrative metrics from your backend endpoints
        const data = await apiFetch('/admin/overview', {}, 'Failed to load system metrics');
        setStats({
          totalUsers: data.total_users || 0,
          totalTickets: data.total_tickets || 0,
          openTickets: data.open_tickets || 0,
          resolvedTickets: data.resolved_tickets || 0,
          activeTechnicians: data.active_technicians || 0,
          totalAssets: data.total_assets || 0,
          assetsUnderRepair: data.assets_under_repair || 0
        });
      } catch (err) {
        setError('Failed to load system metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading system metrics...</div>;
  }

  return (
    <div className="admin-overview-container">
      {error && <p style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</p>}

      <div className="admin-welcome-banner">
        <h2>System Performance & Operations</h2>
        <p>Real-time analytics and organizational health overview for Tatua Sasa.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-title">Total Users</div>
          <div className="admin-stat-value">{stats.totalUsers}</div>
          <div className="admin-stat-desc">Across all 4 system roles</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">Total Tickets Logged</div>
          <div className="admin-stat-value">{stats.totalTickets}</div>
          <div className="admin-stat-desc">Historical organizational volume</div>
        </div>

        <div className="admin-stat-card pending">
          <div className="admin-stat-title">Active Open Issues</div>
          <div className="admin-stat-value">{stats.openTickets}</div>
          <div className="admin-stat-desc">Require technician attention</div>
        </div>

        <div className="admin-stat-card resolved">
          <div className="admin-stat-title">Resolved Issues</div>
          <div className="admin-stat-value">{stats.resolvedTickets}</div>
          <div className="admin-stat-desc">Successfully closed tickets</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">Total Assets</div>
          <div className="admin-stat-value">{stats.totalAssets || 0}</div>
          <div className="admin-stat-desc">Registered organizational hardware</div>
        </div>

        <div className="admin-stat-card" style={{ borderColor: 'var(--brand-text)' }}>
          <div className="admin-stat-title" style={{ color: 'var(--brand-text)' }}>Assets Under Repair</div>
          <div className="admin-stat-value">{stats.assetsUnderRepair || 0}</div>
          <div className="admin-stat-desc">Currently out of commission</div>
        </div>
      </div>

      {/* Secondary Quick Metrics Section */}
      <div className="admin-secondary-section">
        <div className="admin-info-box">
          <h3>Active Workforce</h3>
          <p className="admin-info-number">{stats.activeTechnicians} Technicians Online</p>
          <span className="admin-badge active">System Health: Optimal</span>
        </div>

        <div className="admin-info-box">
          <h3>Quick System Actions</h3>
          <div className="admin-quick-links">
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Use the sidebar menu to manage user roles, review live queues, or modify technical categories.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}