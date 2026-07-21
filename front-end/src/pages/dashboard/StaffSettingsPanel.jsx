import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/SupabaseClient';
import { apiFetch } from '../../config/api'; // Reusing your authenticated API helper
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './staff-settingspanel.css';

export default function StaffSettingsPanel({ tickets = [] }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('profile');

  // --- State: Account & Profile ---
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('🧑‍💻'); 
  
  // --- State: Security & Preferences ---
  const [newPassword, setNewPassword] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('staff_theme') || 'light');
  const [language, setLanguage] = useState('en-US');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // --- State: ICT Officer Application Sourced From DB ---
  const [supervisors, setSupervisors] = useState([]);
  const [skillsCatalog, setSkillsCatalog] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState([]); // Array of skill_ids (integers)
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Fetch user identity information
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          // Pull preferences from metadata for UI only
          setPhone(user.user_metadata?.phone || '');
          setAvatar(user.user_metadata?.avatar || '🧑‍💻');
          // If no local theme, use the one from DB
          if (!localStorage.getItem('staff_theme') && user.user_metadata?.theme) {
            setTheme(user.user_metadata.theme);
          }
          setLanguage(user.user_metadata?.language || 'en-US');
        }

        // 2. Safely sync application-level profile details from FastAPI (/me)
        const profileData = await apiFetch('/me', {}, 'Failed to load profile');
        setFullName(profileData.full_name || '');

        // 3. Populate catalogs for the technician application workflow
        const supervisorsList = await apiFetch('/admin/public/supervisors', {}, 'Failed to load supervisors'); 
        // Note: If supervisors requires an admin proxy to list targets initially, fallback route can be applied.
        setSupervisors(supervisorsList || []);

        const systemSkills = await apiFetch('/skills', {}, 'Failed to load skills catalog');
        setSkillsCatalog(systemSkills || []);

      } catch (err) {
        console.error("Data loading warning:", err.message);
      } finally {
        // Load Analytics Preference from LocalStorage
        const tracking = localStorage.getItem('tatua_analytics');
        if (tracking !== null) setAnalyticsEnabled(tracking === 'true');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Theme Application
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    }
    localStorage.setItem('staff_theme', theme);
  }, [theme]);

  // Language Application
  useEffect(() => {
    document.documentElement.lang = language.split('-')[0]; 
  }, [language]);

  const displayMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // --- DATA & PRIVACY HANDLERS ---
  const handleDownloadPDF = () => {
    if (tickets.length === 0) {
      displayMessage('error', 'You have no tickets to download.');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFillColor(6, 71, 50); // Deep Brand Green
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Tatua Sasa", 14, 20);
    doc.setFontSize(12);
    doc.text("Official Ticket History Report", 14, 30);
    
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Account: ${fullName || email}`, 14, 56);

    const tableColumn = ["Subject", "Category", "Status", "Priority", "Date"];
    const tableRows = tickets.map(ticket => [
      ticket.title, // Strict schema enforcement from Part C.4
      ticket.category,
      ticket.status,
      ticket.priority,
      new Date(ticket.created_at).toLocaleDateString()
    ]);

    doc.autoTable({
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      headStyles: { fillColor: [6, 71, 50], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [244, 247, 246] },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 5 },
    });

    doc.save(`Tatua_Sasa_Tickets_${new Date().getTime()}.pdf`);
    displayMessage('success', 'Your ticket history PDF has been downloaded.');
  };

  const handleClearCache = () => {
    const confirmed = window.confirm("This will clear your local temporary data and reload the application. Continue?");
    if (confirmed) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload(); 
    }
  };

  const handleToggleAnalytics = () => {
    const newState = !analyticsEnabled;
    setAnalyticsEnabled(newState);
    localStorage.setItem('tatua_analytics', newState);
    displayMessage('success', `Analytics tracking is now ${newState ? 'ENABLED' : 'DISABLED'}.`);
  };

  // --- STRUCTURAL ICT OFFICER APPLICATION HANDLERS ---
  const handleSpecialtyToggle = (skillId) => {
    setSelectedSpecialties(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleApplyICT = async (e) => {
    e.preventDefault();
    if (!selectedSupervisorId) {
      displayMessage('error', 'Please select a valid supervisor for approval routing.');
      return;
    }
    if (selectedSpecialties.length === 0) {
      displayMessage('error', 'Please select at least one field of technical expertise.');
      return;
    }
    
    setSaving(true);
    try {
      // Map frontend indices to strict Part D.5 multi-skill parameters
      const payload = {
        supervisor_id: selectedSupervisorId,
        skills: selectedSpecialties.map(id => ({
          skill_id: parseInt(id, 10),
          level: 2 // Maps to intermediate proficiency automatically
        }))
      };

      await apiFetch('/technicians/apply', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, 'Failed to submit technician application');

      setShowApplyModal(true);
    } catch (err) {
      displayMessage('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setSelectedSupervisorId('');
    setSelectedSpecialties([]);
  };

  // --- SECURED ROUTE PROFILE ALTERATIONS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Direct updates routed through PATCH /me to safeguard public.profiles
      await apiFetch('/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName
        })
      }, 'Failed to update application profile metrics');

      // Update remaining client-side visual metadata markers via auth block
      await supabase.auth.updateUser({
        data: { phone: phone, avatar: avatar, theme: theme, language: language }
      });

      displayMessage('success', 'Profile changes saved securely.');
    } catch (err) {
      displayMessage('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    error ? displayMessage('error', error.message) : displayMessage('success', 'Password updated.');
    setNewPassword('');
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading settings...</div>;

  return (
    <div>
      <h2 style={{ color: 'var(--text-main)', margin: '0 0 10px 0' }}>Settings</h2>
      
      {message.text && (
        <div className={`settings-alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* --- ICT APPLICATION SUCCESS MODAL --- */}
      {showApplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '30px', borderRadius: '12px',
            maxWidth: '450px', textAlign: 'center', border: '1px solid var(--border-color)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤩🥳</div>
            <h2 style={{ color: 'var(--brand-text)', marginBottom: '15px' }}>Application Sent!</h2>
            <p style={{ color: 'var(--text-main)', marginBottom: '25px', lineHeight: '1.5' }}>
              Thanks for your application! The request has been sent to your supervisor. 
              Wait for your supervisor's approval to get a brand new ICT Officer Dashboard.
            </p>
            <button className="btn-save" onClick={closeApplyModal} style={{ width: '100%' }}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <button className={`sidebar-menu-btn ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>
            Account & Profile
          </button>
          <button className={`sidebar-menu-btn ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}>
            Security
          </button>
          <button className={`sidebar-menu-btn ${activeSection === 'preferences' ? 'active' : ''}`} onClick={() => setActiveSection('preferences')}>
            Preferences
          </button>
          <button className={`sidebar-menu-btn ${activeSection === 'privacy' ? 'active' : ''}`} onClick={() => setActiveSection('privacy')}>
            Privacy & Data
          </button>
          <div className="sidebar-divider"></div>
          
          <button className={`sidebar-menu-btn ${activeSection === 'apply' ? 'active' : ''}`} onClick={() => setActiveSection('apply')} style={{ fontWeight: 'bold', color: activeSection === 'apply' ? 'var(--brand-text)' : '#10b981' }}>
            Apply for ICT Officer
          </button>
          
          <div className="sidebar-divider"></div>
          <button className={`sidebar-menu-btn ${activeSection === 'support' ? 'active' : ''}`} onClick={() => setActiveSection('support')}>
            Support & About
          </button>
          <button className={`sidebar-menu-btn ${activeSection === 'danger' ? 'active' : ''}`} style={{ color: activeSection === 'danger' ? '#ef4444' : '' }} onClick={() => setActiveSection('danger')}>
            Action Items
          </button>
        </aside>

        <main className="settings-content-area">
          {activeSection === 'profile' && (
            <div>
              <h3>Account & Profile</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="settings-form-group">
                  <label>Avatar Selection</label>
                  <div className="avatar-selection-container">
                    {['🧑‍💻', '👩‍💻', '🤖'].map((emoji) => (
                      <div key={emoji} className={`avatar-option ${avatar === emoji ? 'selected' : ''}`} onClick={() => setAvatar(emoji)}>
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="settings-form-group">
                  <label htmlFor="email">Email Address (Cannot be changed here)</label>
                  <input type="email" id="email" value={email} disabled />
                </div>
                <div className="settings-form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="settings-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000000" />
                </div>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* --- ICT OFFICER APPLICATION SECTION --- */}
          {activeSection === 'apply' && (
            <div>
              <h3>Apply for ICT Officer</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '15px', lineHeight: '1.5' }}>
                Ready to level up? Apply below to transition your account to an active ICT Officer. You will gain access to the Technician Workspace to manage and resolve organizational tickets.
              </p>
              
              <form onSubmit={handleApplyICT}>
                <div className="settings-form-group">
                  <label htmlFor="applicantName">Your Full Name</label>
                  <input type="text" id="applicantName" value={fullName} disabled />
                  <span className="help-text">Derived directly from your verified profile row structure.</span>
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="supervisorSelect">Select Routing Supervisor (For Approval Routing)</label>
                  <select 
                    id="supervisorSelect" 
                    value={selectedSupervisorId} 
                    onChange={(e) => setSelectedSupervisorId(e.target.value)} 
                    required
                  >
                    <option value="" disabled>Choose your reporting officer...</option>
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="settings-form-group">
                  <label style={{ marginBottom: '15px' }}>Select Your Core Fields of Expertise (Select at least one):</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {skillsCatalog.map(skill => (
                      <label key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedSpecialties.includes(skill.id)}
                          onChange={() => handleSpecialtyToggle(skill.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <strong>{skill.name}</strong> <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({skill.category})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-save" style={{ marginTop: '15px' }} disabled={saving}>
                  {saving ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h3>Security</h3>
              <form onSubmit={handleUpdatePassword}>
                <div className="settings-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter a new secure password" />
                </div>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div>
              <h3>Preferences & Customization</h3>
              <div className="settings-form-group">
                <label htmlFor="theme">Appearance (Theme)</label>
                <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="light">Light Mode (Tatua Sasa Default)</option>
                  <option value="dark">Dark Mode</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              <div className="settings-form-group">
                <label htmlFor="language">Language & Region</label>
                <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en-US">English (US)</option>
                  <option value="en-UK">English (UK)</option>
                </select>
              </div>
              <button onClick={handleUpdateProfile} className="btn-save" disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div>
              <h3>Privacy & Data Control</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
                Manage your personal data, export your ticket history, or adjust your telemetry settings.
              </p>
              <div className="action-row" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                <button className="btn-outline" onClick={handleDownloadPDF} style={{ width: '100%', textAlign: 'left' }}>
                  📄 Download My Ticket History (PDF)
                </button>
                <button className="btn-outline" onClick={handleClearCache} style={{ width: '100%', textAlign: 'left' }}>
                  🗑️ Clear Local Cache & Reload Dashboard
                </button>
                <button className="btn-outline" onClick={handleToggleAnalytics} style={{ width: '100%', textAlign: 'left', borderColor: analyticsEnabled ? 'var(--brand-text)' : 'var(--border-input)' }}>
                  📊 {analyticsEnabled ? 'Disable' : 'Enable'} Usage Analytics Tracking
                </button>
              </div>
            </div>
          )}

          {activeSection === 'support' && (
            <div>
              <h3>Support & About</h3>
              <div className="support-links">
                <a href="#contact">Contact Support / Report a Bug</a>
                <a href="#terms">Terms of Service</a>
                <a href="#privacy">Privacy Policy</a>
              </div>
              <div className="app-info-text">
                Tatua Sasa Version 1.0.4<br />
                Built with React & Supabase
              </div>
            </div>
          )}

          {activeSection === 'danger' && (
            <div>
              <h3 style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Action Items</h3>
              <p style={{ color: 'var(--text-secondary, #555)', marginBottom: '20px' }}>
                Manage your session or permanently remove your account from the system.
              </p>
              <div className="action-row" style={{ flexDirection: 'column', gap: '15px' }}>
                <button className="btn-outline" onClick={handleLogout} style={{ width: '100%' }}>Sign Out of Tatua Sasa</button>
                <button className="btn-danger" onClick={() => window.alert("Account deletion requires admin approval.")}>Permanently Delete Account</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}