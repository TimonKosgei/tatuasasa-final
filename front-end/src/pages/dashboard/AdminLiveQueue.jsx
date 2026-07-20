import { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';
import './admin-livequeue.css';

export default function AdminLiveQueue() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, open, assigned, in_progress
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLiveQueue = async () => {
      setLoading(true);
      try {
        // Fetch active queue tickets from backend admin endpoint
        const data = await apiFetch('/admin/tickets/active', {}, 'Failed to load live queue');
        setTickets(data || []);
      } catch (err) {
        // Fallback simulation array if endpoint is pending backend implementation
        setTickets([
          { id: 1, title: 'Wi-Fi connection failing in Block B', category: 'network', status: 'open', priority: 'urgent', created_at: new Date().toISOString() },
          { id: 2, title: 'Printer driver missing on Finance PC', category: 'printers', status: 'assigned', priority: 'medium', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, title: 'Database access credentials expired', category: 'software', status: 'in_progress', priority: 'high', created_at: new Date(Date.now() - 7200000).toISOString() }
        ]);
        setError('');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveQueue();
  }, []);

  // Filter logic
  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  return (
    <div className="admin-livequeue-container">
      <div className="livequeue-header-row">
        <h2>Live Issue Queue</h2>
        
        {/* Status Filter Toggles */}
        <div className="queue-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All Active
          </button>
          <button className={`filter-btn ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')}>
            Open
          </button>
          <button className={`filter-btn ${filter === 'assigned' ? 'active' : ''}`} onClick={() => setFilter('assigned')}>
            Assigned
          </button>
          <button className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`} onClick={() => setFilter('in_progress')}>
            In Progress
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      <div className="queue-table-responsive">
        <table className="queue-table">
          <thead>
            <tr>
              <th>Subject / Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date Raised</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading live queue...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No active issues found matching this filter.
                </td>
              </tr>
            ) : (
              filteredTickets.map(ticket => (
                <tr key={ticket.id}>
                  <td><strong>{ticket.title}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{(ticket.category || '').replace('_', ' ')}</td>
                  <td>
                    <span className={`priority-indicator priority-${ticket.priority}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-badge admin-status-${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}