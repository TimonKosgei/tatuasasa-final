import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../config/api';
import { QRCodeSVG } from 'qrcode.react';
import { parse } from 'csv-parse/browser/esm';

export default function AdminAssets({ accent, onAccent }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [viewingQR, setViewingQR] = useState(null);
  const fileInputRef = useRef(null);
  
  // History State
  const [viewingHistory, setViewingHistory] = useState(null);
  const [assetHistory, setAssetHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // New Asset State
  const [newAsset, setNewAsset] = useState({
    asset_tag: '',
    name: '',
    category: '',
    serial_number: '',
    location_building: '',
    location_floor: '',
    location_room: '',
    assigned_department: '',
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
      if (newAsset.location_building) payload.location_building = newAsset.location_building;
      if (newAsset.location_floor) payload.location_floor = newAsset.location_floor;
      if (newAsset.location_room) payload.location_room = newAsset.location_room;
      if (newAsset.assigned_department) payload.assigned_department = newAsset.assigned_department;

      await apiFetch('/assets', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, 'Failed to register asset');
      
      setIsAdding(false);
      setNewAsset({ asset_tag: '', name: '', category: '', serial_number: '', location_building: '', location_floor: '', location_room: '', assigned_department: '', status: 'active' });
      fetchAssets();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewHistory = async (assetTag) => {
    setViewingHistory(assetTag);
    setLoadingHistory(true);
    try {
      const data = await apiFetch(`/assets/${assetTag}/history`);
      setAssetHistory(data);
    } catch (err) {
      alert("Failed to load asset history");
      setViewingHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      parse(text, { columns: true, skip_empty_lines: true }, async (err, records) => {
        if (err) {
          alert("Error parsing CSV: " + err.message);
          setIsImporting(false);
          return;
        }

        try {
          const payload = records.map(row => ({
            asset_tag: row.asset_tag || row.AssetTag || row['Asset Tag'],
            name: row.name || row.Name || row['Hardware Name'] || row.hardware_name,
            category: row.category || row.Category,
            serial_number: row.serial_number || row.SerialNumber || row['Serial Number'] || undefined,
            location_building: row.location_building || row.Building || row.building || undefined,
            location_floor: row.location_floor || row.Floor || row.floor || undefined,
            location_room: row.location_room || row.Room || row.room || undefined,
            assigned_department: row.assigned_department || row.Department || row.department || undefined
          })).filter(r => r.asset_tag && r.name && r.category); // Filter out rows missing required fields

          if (payload.length === 0) {
            alert("No valid records found in CSV. Ensure 'asset_tag', 'name', and 'category' columns exist.");
            setIsImporting(false);
            return;
          }

          await apiFetch('/assets/bulk', {
            method: 'POST',
            body: JSON.stringify({ assets: payload })
          }, 'Failed to bulk import assets');

          alert(`Successfully imported ${payload.length} assets!`);
          fetchAssets();
        } catch (error) {
          alert(error.message);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    };
    reader.readAsText(file);
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            style={{
              background: '#f3f4f6',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-line)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              opacity: isImporting ? 0.7 : 1
            }}
          >
            {isImporting ? 'Importing...' : 'Bulk Import CSV'}
          </button>
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
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Building</label>
              <input 
                value={newAsset.location_building}
                onChange={e => setNewAsset({...newAsset, location_building: e.target.value})}
                placeholder="e.g. Teleposta"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--color-line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Floor</label>
              <input 
                value={newAsset.location_floor}
                onChange={e => setNewAsset({...newAsset, location_floor: e.target.value})}
                placeholder="e.g. 7th"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--color-line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Room</label>
              <input 
                value={newAsset.location_room}
                onChange={e => setNewAsset({...newAsset, location_room: e.target.value})}
                placeholder="e.g. 2020"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--color-line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '5px' }}>Assigned Department</label>
              <input 
                value={newAsset.assigned_department}
                onChange={e => setNewAsset({...newAsset, assigned_department: e.target.value})}
                placeholder="e.g. HR"
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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading assets...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-muted)' }}>No assets found.</td></tr>
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
                    {asset.location_building ? `${asset.location_building} ${asset.location_floor ? `- ${asset.location_floor} Floor` : ''}` : '-'}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {asset.assigned_department || '-'}
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                     <button 
                       onClick={() => setViewingQR(asset.asset_tag)}
                       style={{ background: 'transparent', border: '1px solid var(--color-line)', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px' }}
                     >
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                       QR Label
                     </button>
                     <button 
                       onClick={() => handleViewHistory(asset.asset_tag)}
                       style={{ background: 'transparent', border: '1px solid var(--color-line)', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px' }}
                     >
                       View History
                     </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', width: '300px' }}>
            <h3 style={{ marginBottom: '5px', fontSize: '18px', fontWeight: 'bold' }}>{viewingQR}</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '20px' }}>Scan to report issue</p>
            
            <div style={{ background: 'white', padding: '15px', display: 'inline-block', border: '1px solid #eee', borderRadius: '8px', marginBottom: '20px' }}>
              <QRCodeSVG 
                value={`https://tatuasasa.com/report?asset=${viewingQR}`} 
                size={180} 
                level={"H"}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setViewingQR(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid var(--color-line)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', border: 'none', background: accent, color: onAccent, borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {viewingHistory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--color-bg)', padding: '25px', borderRadius: '12px', width: '500px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>History: {viewingHistory}</h3>
              <button onClick={() => { setViewingHistory(null); setAssetHistory(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>Loading history records...</div>
            ) : assetHistory ? (
              <div style={{ overflowY: 'auto', paddingRight: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--color-line)' }}>
                  <div>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: 'bold' }}>Total Breakdowns</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-ink)' }}>{assetHistory.metrics.ticket_frequency}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: 'bold' }}>Health Signal</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: assetHistory.metrics.health_signal.includes('warning') ? '#991b1b' : '#27500a', marginTop: '4px' }}>
                      {assetHistory.metrics.health_signal}
                    </p>
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-ink)' }}>Repair Log</h4>
                {assetHistory.history.length === 0 ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>No repairs recorded for this asset.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {assetHistory.history.map(record => (
                      <div key={record.ticket_id} style={{ padding: '12px', border: '1px solid var(--color-line)', borderRadius: '8px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{record.title}</span>
                          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{new Date(record.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--color-ink)', marginBottom: '8px', whiteSpace: 'pre-line' }}>{record.resolution_notes || 'No resolution notes provided.'}</p>
                        {record.downtime_hours && (
                          <div style={{ fontSize: '11px', color: '#991b1b', background: '#fce8e8', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }}>
                            Downtime: {record.downtime_hours} hours
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error loading data.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
