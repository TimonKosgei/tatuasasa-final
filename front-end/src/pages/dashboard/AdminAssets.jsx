import { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';

export default function AdminAssets({ accent, onAccent }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // New Asset State
  const [newAsset, setNewAsset] = useState({
    asset_tag: '',
    name: '',
    category: '',
    serial_number: '',
    status: 'active'
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/assets${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setAssets(data || []);
    } catch (err) {
      setError('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        asset_tag: newAsset.asset_tag,
        name: newAsset.name,
        category: newAsset.category,
      };
      if (newAsset.serial_number) payload.serial_number = newAsset.serial_number;

      await apiFetch('/assets', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, 'Failed to register asset');
      
      setIsAdding(false);
      setNewAsset({ asset_tag: '', name: '', category: '', serial_number: '', status: 'active' });
      fetchAssets();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { background: '#eaf3de', color: '#27500a' };
      case 'under_repair':
        return { background: '#fce8e8', color: '#991b1b' };
      case 'retired':
        return { background: '#f3f4f6', color: '#374151' };
      default:
        return { background: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div className="admin-livequeue-container" style={{ padding: '20px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-ink)' }}>Asset Management</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Manage organizational hardware and monitor their health.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: isAdding ? '#f3f4f6' : accent,
            color: isAdding ? 'var(--color-ink)' : onAccent,
            border: isAdding ? '1px solid var(--color-line)' : 'none',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {isAdding ? 'Cancel' : '+ Register Asset'}
        </button>
      </div>

      {isAdding && (
        <div style={{ background: '#f9fafb', border: '1px solid var(--color-line)', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '15px' }}>Register New Asset</h3>
          <form onSubmit={handleAddAsset} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Asset Tag *</label>
              <input 
                required
                value={newAsset.asset_tag}
                onChange={e => setNewAsset({...newAsset, asset_tag: e.target.value})}
                placeholder="e.g. AST-1001"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--color-line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Hardware Name *</label>
              <input 
                required
                value={newAsset.name}
                onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                placeholder="e.g. HP LaserJet Pro M404"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--color-line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Category *</label>
              <input 
                required
                value={newAsset.category}
                onChange={e => setNewAsset({...newAsset, category: e.target.value})}
                placeholder="e.g. Printer, Laptop"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--color-line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Serial Number</label>
              <input 
                value={newAsset.serial_number}
                onChange={e => setNewAsset({...newAsset, serial_number: e.target.value})}
                placeholder="Optional"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--color-line)', fontSize: '13px' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="submit"
                style={{ background: accent, color: onAccent, padding: '8px 24px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
              >
                Save Asset
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <input 
          type="text" 
          placeholder="Search by tag, name, or serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '300px', padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-line)' }}
        />
      </div>

      <div className="queue-table-responsive" style={{ border: '1px solid var(--color-line)', background: 'var(--color-bg)' }}>
        <table className="queue-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Location</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading assets...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-muted)' }}>No assets found.</td></tr>
            ) : (
              assets.map(asset => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: '600' }}>{asset.asset_tag}</td>
                  <td>{asset.name} {asset.serial_number && <span style={{ color: 'var(--color-muted)', fontSize: '11px', display: 'block' }}>SN: {asset.serial_number}</span>}</td>
                  <td>{asset.category}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '600', 
                      textTransform: 'uppercase',
                      ...getStatusStyle(asset.status)
                    }}>
                      {asset.status ? asset.status.replace('_', ' ') : 'active'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {asset.offices ? `${asset.offices.name} (${asset.offices.buildings?.name})` : '-'}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {asset.profiles?.full_name || '-'}
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
