import { useState, useEffect } from 'react';
import './staff-dashboard.css';
import { apiFetch } from '../../config/api';
import StaffSettingsPanel from './StaffSettingsPanel';

const CATEGORIES = [
  { value: 'network', label: 'Network & Wi-Fi' },
  { value: 'hardware', label: 'Hardware / Peripherals' },
  { value: 'software', label: 'Software / System Access' },
  { value: 'printers', label: 'Printers' },
  { value: 'security', label: 'Security' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function StaffDashboard() {
  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- Dashboard State ---
  const [showForm, setShowForm] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [office, setOffice] = useState(null); 
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await apiFetch('/tickets/mine', {}, 'Failed to load tickets');
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    try {
      const me = await apiFetch('/me', {}, 'Failed to load profile');
      if (me.office) {
        setOffice(me.office);
        setBuilding(me.office.building ?? '');
        setFloor(me.office.floor ?? '');
        setRoom(me.office.room ?? '');
      }
    } catch {
      // no office on file yet
    }
  }

  useEffect(() => {
    loadTickets();
    loadProfile();
  }, []);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => ['open', 'assigned', 'in_progress'].includes(t.status)).length;
  const resolvedTickets = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;

  async function handleSubmitTicket(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const form = e.target;

    try {
      const newTicket = await apiFetch(
        '/tickets',
        {
          method: 'POST',
          body: JSON.stringify({
            title: form.subject.value,
            description: form.description.value,
            category: form.category.value,
            priority: form.priority.value,
            location_building: building || null,
            location_floor: floor || null,
            location_room: room || null,
          }),
        },
        'Failed to submit ticket'
      );

      setTickets((prev) => [newTicket, ...prev]);
      setShowForm(false);
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">

        {/* --- Navigation Header --- */}
        <div className="dashboard-header">
          <div className="header-top">
            <h1>Tatua Sasa</h1>
            <button 
              className="menu-toggle" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

          <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
            <button 
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }}
            >
              Dashboard
            </button>
            <button 
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}
            >
              Settings
            </button>
          </nav>
        </div>
        {/* ------------------------------- */}

        {error && !showForm && (
          <p className="error-text" style={{ color: '#A13333', marginBottom: '12px' }}>{error}</p>
        )}

        {/* --- VIEW ROUTING --- */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button
                className="primary-btn"
                onClick={() => { setError(''); setShowForm(!showForm); }}
              >
                {showForm ? "Cancel" : "+ Raise New Ticket"}
              </button>
            </div>

            {!showForm ? (
              <div>
                <div className="stats-container">
                  <div className="stat-card">
                    <div className="stat-title">Total</div>
                    <div className="stat-value">{totalTickets}</div>
                  </div>
                  <div className="stat-card pending">
                    <div className="stat-title">Open</div>
                    <div className="stat-value">{openTickets}</div>
                  </div>
                  <div className="stat-card resolved">
                    <div className="stat-title">Resolved</div>
                    <div className="stat-value">{resolvedTickets}</div>
                  </div>
                </div>

                <h2>My Active Tickets</h2>
                <div className="table-responsive">
                  <table className="ticket-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            Loading your tickets…
                          </td>
                        </tr>
                      ) : tickets.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            You have no active tickets. Click "+ Raise New Ticket" to report an issue.
                          </td>
                        </tr>
                      ) : (
                        tickets.map((ticket) => (
                          <tr key={ticket.id}>
                            <td>{ticket.title}</td>
                            <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge status-${ticket.status}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <form className="ticket-form" onSubmit={handleSubmitTicket}>
                <h2>Raise a New Ticket</h2>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label htmlFor="subject">Ticket Subject</label>
                  <input type="text" id="subject" name="subject" placeholder="e.g., Internet is down" required />
                  <span className="help-text">Please keep this to a short, understandable statement.</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" required defaultValue="">
                      <option value="" disabled>Select a category...</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select id="priority" name="priority" required defaultValue="medium">
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="building">Building</label>
                    <input
                      type="text"
                      id="building"
                      name="building"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="e.g. Nairobi Regional Office"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="floor">Floor</label>
                    <input
                      type="text"
                      id="floor"
                      name="floor"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g. 3rd Floor"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="room">Room</label>
                    <input
                      type="text"
                      id="room"
                      name="room"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. KZ-Accounts"
                      required
                    />
                  </div>
                </div>
                {office && (
                  <span className="help-text" style={{ display: 'block', marginTop: '-10px', marginBottom: '15px' }}>
                    Prefilled from your profile — edit if you're reporting this from somewhere else.
                  </span>
                )}

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label htmlFor="description">Detailed Description</label>
                  <textarea id="description" name="description" rows="4" placeholder="Explain what is happening..." required></textarea>
                </div>

                {error && <p className="error-text" style={{ color: '#A13333', marginBottom: '15px' }}>{error}</p>}

                <button type="submit" className="primary-btn" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <StaffSettingsPanel />
          </div>
        )}

      </div>
    </div>
  );
}