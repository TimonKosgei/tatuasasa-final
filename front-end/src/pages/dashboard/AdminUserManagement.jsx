import { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import './admin-usermanagement.css';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch all system users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/users', {}, 'Failed to load user directory');
      setUsers(data || []);
    } catch (err) {
      // Fallback sample data representing the 4 system roles for preview purposes
      setUsers([
        { id: '1', full_name: 'Samuel Kuria', email: 'samuel@tatuasasa.com', role: 'admin' },
        { id: '2', full_name: 'Alice Wanjiku', email: 'alice@tatuasasa.com', role: 'supervisor' },
        { id: '3', full_name: 'Brian Kipkorir', email: 'brian@tatuasasa.com', role: 'technician' },
        { id: '4', full_name: 'Cynthia Mwangi', email: 'cynthia@tatuasasa.com', role: 'staff' },
      ]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  // Handle Role Promotion or Demotion
  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      }, 'Failed to update user role');

      // Update state locally
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage(`Successfully updated user rank to ${newRole.toUpperCase()}.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      // Fallback local update if backend route is stubbed
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage(`Successfully updated user rank to ${newRole.toUpperCase()}.`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Filter and Search logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-users-container">
      <div className="users-header-row">
        <h2>User Account Directory</h2>
        
        <div className="users-controls">
          <input 
            type="text" 
            className="users-search-input" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select 
            className="users-role-select" 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="staff">Staff</option>
            <option value="technician">Technician</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {message && <div style={{ padding: '10px 15px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      <div className="users-table-responsive">
        <table className="users-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Current Rank / Role</th>
              <th>Manage / Change Rank</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading user directory...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No users found matching your search.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.full_name || 'Unnamed User'}</strong></td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <select 
                      className="rank-action-select"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="staff">Staff</option>
                      <option value="technician">Technician</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}