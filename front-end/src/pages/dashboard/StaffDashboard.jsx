import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './staff-dashboard.css';
import { apiFetch } from '../../config/api';
import { supabase } from '../../config/supabaseClient';
import StaffSettingsPanel from './StaffSettingsPanel';
import StaffLive from './StaffLive';
import StaffReports from './StaffReports';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [applicationPopup, setApplicationPopup] = useState(null); // { status: 'approved' | 'rejected', name: '' }

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

  useEffect(() => {
    const theme = localStorage.getItem('staff_theme') || 'light';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    let channel;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('profile-changes-staff')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            const oldStatus = payload.old.application_status;
            const newStatus = payload.new.application_status;
            const name = payload.new.full_name || 'user';
            
            if (oldStatus === 'pending' && newStatus === 'approved') {
              setApplicationPopup({ status: 'approved', name });
            } else if (oldStatus === 'pending' && newStatus === 'rejected') {
              setApplicationPopup({ status: 'rejected', name });
            }
          }
        )
        .subscribe();
    };
    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => ['open', 'assigned', 'in_progress'].includes(t.status)).length;
  const completedTickets = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;

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

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'live_comm': return 'Live Communication';
      case 'reports': return 'Reports';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false); 
  };

  return (
    <div className="dashboard-container">
      
      {/* --- ICT APPLICATION POPUP MODAL --- */}
      {applicationPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '30px', borderRadius: '12px',
            maxWidth: '450px', textAlign: 'center', border: '1px solid var(--border-color)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            {applicationPopup.status === 'approved' ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎉</div>
                <h2 style={{ color: '#10b981', marginBottom: '15px' }}>Application Accepted!</h2>
                <p style={{ color: 'var(--text-main)', marginBottom: '25px', lineHeight: '1.5' }}>
                  Congratulations {applicationPopup.name}, your application for ICT Officer has been accepted.
                  Press continue to get your technician dashboard.
                </p>
                <button 
                  style={{ width: '100%', background: '#10b981', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} 
                  onClick={async () => {
                    await supabase.auth.refreshSession();
                    window.location.href = '/dashboard/technician';
                  }}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>😔</div>
                <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>Application Rejected</h2>
                <p style={{ color: 'var(--text-main)', marginBottom: '25px', lineHeight: '1.5' }}>
                  Unfortunately {applicationPopup.name}, your application for ICT Officer has been rejected by your supervisor.
                </p>
                <button 
                  className="btn-outline"
                  style={{ width: '100%' }} 
                  onClick={() => setApplicationPopup(null)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- RIGHT SLIDE-OUT SIDEBAR --- */}
      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <aside className={`app-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={() => setIsMenuOpen(false)}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavClick('dashboard')}>
            Dashboard
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'live_comm' ? 'active' : ''}`} onClick={() => handleNavClick('live_comm')}>
            Live Communication
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleNavClick('reports')}>
            Reports
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleNavClick('settings')}>
            Settings
          </button>
        </nav>
      </aside>

      <div className="dashboard-card">

        {/* --- THE FIXED HEADER --- */}
        <div className="dashboard-header">
          
          {/* LEFT SIDE: Hamburger Menu + Logo */}
          <div className="header-left">
            <button 
              className="hamburger-btn" 
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            
            <h1 className="brand-logo">Tatua Sasa</h1>
          </div>

          {/* RIGHT SIDE: Just the Tab Name */}
          <div className="header-right">
            <p className="tab-indicator">{getTabTitle()}</p>
          </div>

        </div>

        {error && !showForm && (
          <p className="error-text" style={{ color: '#ef4444', marginBottom: '12px' }}>{error}</p>
        )}

        {/* --- VIEW ROUTING --- */}
        {activeTab === 'dashboard' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button className="primary-btn" onClick={() => { setError(''); setShowForm(!showForm); }}>
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
                  <div className="stat-card completed">
                    <div className="stat-title">Completed</div>
                    <div className="stat-value">{completedTickets}</div>
                  </div>
                </div>

                <h2>My Active Tickets</h2>
                <div className="table-responsive">
                  <table className="ticket-table">
                    <thead>
                      <tr><th>Subject</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading your tickets…</td></tr>
                      ) : tickets.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>You have no active tickets. Click "+ Raise New Ticket" to report an issue.</td></tr>
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
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" required defaultValue="">
                      <option value="" disabled>Select a category...</option>
                      {CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select id="priority" name="priority" required defaultValue="medium">
                      {PRIORITIES.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="building">Building</label>
                    <input type="text" id="building" name="building" value={building} onChange={(e) => setBuilding(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="floor">Floor</label>
                    <input type="text" id="floor" name="floor" value={floor} onChange={(e) => setFloor(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="room">Room</label>
                    <input type="text" id="room" name="room" value={room} onChange={(e) => setRoom(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label htmlFor="description">Detailed Description</label>
                  <textarea id="description" name="description" rows="4" required></textarea>
                </div>
                <button type="submit" className="primary-btn" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- LIVE COMMUNICATION INJECTION --- */}
        {activeTab === 'live_comm' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <StaffLive />
          </div>
        )}

        {/* --- REPORTS TAB --- */}
        {activeTab === 'reports' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <StaffReports tickets={tickets} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <StaffSettingsPanel tickets={tickets} />
          </div>
        )}

      </div>
    </div>
  );
}