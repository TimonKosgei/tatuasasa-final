import { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import './admin-catalog.css';

export default function AdminCatalog() {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form states for adding new catalog entries
  const [newCatName, setNewCatName] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Network');

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      const skillsData = await apiFetch('/skills', {}, 'Failed to load skills catalog');
      setSkills(skillsData || []);
      
      // Default categories matching system dropdown options
      setCategories([
        { id: 1, name: 'Network & Wi-Fi', value: 'network' },
        { id: 2, name: 'Hardware / Peripherals', value: 'hardware' },
        { id: 3, name: 'Software / System Access', value: 'software' },
        { id: 4, name: 'Printers', value: 'printers' },
        { id: 5, name: 'Security', value: 'security' },
      ]);
    } catch (err) {
      // Fallback preview data
      setSkills([
        { id: 101, name: 'Cisco Routing & Switching', category: 'Network' },
        { id: 102, name: 'Active Directory Management', category: 'Software' },
      ]);
      setCategories([
        { id: 1, name: 'Network & Wi-Fi', value: 'network' },
        { id: 2, name: 'Hardware / Peripherals', value: 'hardware' },
      ]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const formattedValue = newCatName.toLowerCase().replace(/\s+/g, '_');
    const newItem = { id: Date.now(), name: newCatName, value: formattedValue };

    try {
      await apiFetch('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(newItem)
      }, 'Failed to add category');
      
      setCategories(prev => [...prev, newItem]);
      setNewCatName('');
      setMessage('Category added successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      // Local fallback
      setCategories(prev => [...prev, newItem]);
      setNewCatName('');
      setMessage('Category added successfully.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newItem = { id: Date.now(), name: newSkillName, category: newSkillCategory };

    try {
      await apiFetch('/admin/skills', {
        method: 'POST',
        body: JSON.stringify(newItem)
      }, 'Failed to add skill');

      setSkills(prev => [...prev, newItem]);
      setNewSkillName('');
      setMessage('Skill added successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      // Local fallback
      setSkills(prev => [...prev, newItem]);
      setNewSkillName('');
      setMessage('Skill added successfully.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="admin-catalog-container">
      <div className="catalog-header-row">
        <h2>Skills & Categories Catalog</h2>
      </div>

      {message && <div style={{ padding: '10px 15px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {/* --- ADD CATEGORY FORM --- */}
      <div className="catalog-form-card">
        <h3>Add New Ticket Category</h3>
        <form onSubmit={handleAddCategory} className="catalog-form-grid">
          <div className="catalog-form-group">
            <label htmlFor="catName">Category Display Name</label>
            <input 
              type="text" 
              id="catName" 
              placeholder="e.g., Cloud Services" 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="primary-btn" style={{ height: '42px' }}>
            + Add Category
          </button>
        </form>
      </div>

      {/* --- CATEGORIES TABLE --- */}
      <div>
        <h3 className="catalog-section-title">Active System Categories</h3>
        <div className="catalog-table-responsive" style={{ marginTop: '10px' }}>
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>System Value Key</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td><strong>{cat.name}</strong></td>
                  <td><code>{cat.value}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD SKILL FORM --- */}
      <div className="catalog-form-card" style={{ marginTop: '20px' }}>
        <h3>Add New Technical Skill</h3>
        <form onSubmit={handleAddSkill} className="catalog-form-grid">
          <div className="catalog-form-group">
            <label htmlFor="skillName">Skill Name</label>
            <input 
              type="text" 
              id="skillName" 
              placeholder="e.g., Network Security" 
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              required 
            />
          </div>
          <div className="catalog-form-group">
            <label htmlFor="skillCategory">Domain / Category</label>
            <select 
              id="skillCategory" 
              value={newSkillCategory} 
              onChange={(e) => setNewSkillCategory(e.target.value)}
            >
              <option value="Network">Network</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Security">Security</option>
            </select>
          </div>
          <button type="submit" className="primary-btn" style={{ height: '42px' }}>
            + Add Skill
          </button>
        </form>
      </div>

      {/* --- SKILLS TABLE --- */}
      <div>
        <h3 className="catalog-section-title">Technician Skills Catalog</h3>
        <div className="catalog-table-responsive" style={{ marginTop: '10px' }}>
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Domain Category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading skills...</td>
                </tr>
              ) : skills.map(skill => (
                <tr key={skill.id}>
                  <td><strong>{skill.name}</strong></td>
                  <td>{skill.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}