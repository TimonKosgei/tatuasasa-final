import { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';

export default function AdminKnowledgeBase({ accent, onAccent }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await apiFetch('/ai/ingestion-jobs');
      setJobs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/ai/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      alert("File accepted! Processing has started in the background.");
      setFile(null);
      fetchJobs();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-livequeue-container" style={{ padding: '20px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-ink)' }}>Core Knowledge Base</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Upload official SOPs and Manuals for the AI to ingest.</p>
        </div>
      </div>

      <div style={{ background: '#f9fafb', border: '1px solid var(--color-line)', padding: '20px', marginBottom: '20px', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '15px' }}>Upload Official Documentation (PDF)</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ padding: '8px', border: '1px solid var(--color-line)', background: '#fff', fontSize: '13px', flex: 1 }}
          />
          <button 
            type="submit"
            disabled={!file || uploading}
            style={{ 
              background: accent, 
              color: onAccent, 
              padding: '8px 24px', 
              fontSize: '13px', 
              fontWeight: '600', 
              border: 'none', 
              cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
              opacity: (!file || uploading) ? 0.6 : 1,
              borderRadius: '6px'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </form>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Ingestion Jobs Pipeline</h3>
      <div className="queue-table-responsive" style={{ border: '1px solid var(--color-line)', background: 'var(--color-bg)' }}>
        <table className="queue-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Status</th>
              <th>Articles Indexed</th>
              <th>Error Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading jobs...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-muted)' }}>No background jobs found.</td></tr>
            ) : (
              jobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: '600', fontSize: '13px' }}>{job.filename}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '600', 
                      textTransform: 'uppercase',
                      background: job.status === 'completed' ? '#eaf3de' : job.status === 'failed' ? '#fce8e8' : '#e0f2fe',
                      color: job.status === 'completed' ? '#27500a' : job.status === 'failed' ? '#991b1b' : '#0369a1'
                    }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{job.total_articles_indexed || 0}</td>
                  <td style={{ fontSize: '12px', color: '#991b1b' }}>{job.error_message || '-'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                    {new Date(job.created_at).toLocaleString()}
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
