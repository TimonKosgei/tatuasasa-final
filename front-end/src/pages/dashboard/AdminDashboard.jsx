import React, { useState } from 'react';

export default function AdminDashboard() {
  // State for switching primary tabs
  const [activeTab, setActiveTab] = useState('dispatch'); // dispatch | supervisors | departments | facilities
  
  // API State Simulation (Matches your JSON Schemas)
  const [unassignedTechs, setUnassignedTechs] = useState([
    { tech_id: "tech_01", full_name: "Alex Kamau", skills: [{ skill_id: 1, level: 4 }, { skill_id: 3, level: 2 }] },
    { tech_id: "tech_02", full_name: "Mercy Mwangi", skills: [{ skill_id: 2, level: 5 }] }
  ]);

  const [supervisors, setSupervisors] = useState([
    { id: "sup_101", full_name: "Jane Doe", email: "jane.doe@tatuasasa.com", department: "Electrical" },
    { id: "sup_102", full_name: "John Smith", email: "john.smith@tatuasasa.com", department: "Plumbing" }
  ]);

  const [departments, setDepartments] = useState([
    { department_id: 1, name: "Electrical & Power Systems" },
    { department_id: 2, name: "Plumbing & Hydraulics" },
    { department_id: 3, name: "HVAC & Climate Control" }
  ]);

  const [buildings, setBuildings] = useState([
    { building_id: 1, name: "Landmark Plaza", county: "Nairobi" },
    { building_id: 2, name: "Alpha Towers", county: "Mombasa" }
  ]);

  const [offices, setOffices] = useState([
    { office_id: 1, building_id: 1, name: "HQ Operations", floor: "4th", room_code: "RM-402", department_id: 1 }
  ]);

  // Form States for creation modals/sections
  const [newSupervisor, setNewSupervisor] = useState({ email: '', password: '', full_name: '', department: '' });
  const [newDeptName, setNewDeptName] = useState('');
  const [selectedSupervisors, setSelectedSupervisors] = useState({}); // Tracking dropdown changes per tech

  // --- API Handlers Mapped to Endpoints ---

  // PATCH /admin/technicians/{tech_id}/assign-supervisor
  const handleAssignSupervisor = (techId) => {
    const supervisorId = selectedSupervisors[techId];
    if (!supervisorId) return alert("Please select a supervisor first.");
    
    // Optimistic UI update: remove from unassigned list
    setUnassignedTechs(unassignedTechs.filter(tech => tech.tech_id !== techId));
    alert(`API Triggered: PATCH /admin/technicians/${techId}/assign-supervisor with supervisor_id: ${supervisorId}`);
  };

  // POST /admin/supervisors
  const handleCreateSupervisor = (e) => {
    e.preventDefault();
    const generatedId = `sup_${Date.now()}`;
    setSupervisors([...supervisors, { id: generatedId, ...newSupervisor }]);
    setNewSupervisor({ email: '', password: '', full_name: '', department: '' });
    alert(`API Triggered: POST /admin/supervisors`);
  };

  // POST /departments
  const handleCreateDepartment = (e) => {
    e.preventDefault();
    if (!newDeptName) return;
    setDepartments([...departments, { department_id: Date.now(), name: newDeptName }]);
    setNewDeptName('');
    alert(`API Triggered: POST /departments`);
  };

  // DELETE /departments/{department_id}
  const handleDeleteDepartment = (id) => {
    setDepartments(departments.filter(d => d.department_id !== id));
    alert(`API Triggered: DELETE /departments/${id}`);
  };

  // POST /auth/signout
  const handleSignOut = () => {
    alert("API Triggered: POST /auth/signout");
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">TS</div>
            <div>
              <span className="text-lg font-bold tracking-wider block leading-none">Tatua Sasa</span>
              <span className="text-[10px] text-slate-400">Admin Control Panel v0.1.0</span>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dispatch')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition text-left ${activeTab === 'dispatch' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="flex items-center gap-3">🔧 Dispatch Matrix</span>
              {unassignedTechs.length > 0 && (
                <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">{unassignedTechs.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('supervisors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition text-left ${activeTab === 'supervisors' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              👥 Supervisors Panel
            </button>
            <button 
              onClick={() => setActiveTab('departments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition text-left ${activeTab === 'departments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              🏢 Manage Departments
            </button>
            <button 
              onClick={() => setActiveTab('facilities')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition text-left ${activeTab === 'facilities' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              📍 Buildings & Offices
            </button>
          </nav>
        </div>
        
        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-sm">AD</div>
            <div>
              <p className="text-sm font-medium leading-none">Admin Authority</p>
              <span className="text-xs text-slate-500">OAS 3.1 Session</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition" title="Sign Out">
            🚪
          </button>
        </div>
      </aside>

      {/* MAIN SYSTEM VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')} Dashboard</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live Health OK
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: TECHNICIAN DISPATCH MATRIX */}
          {activeTab === 'dispatch' && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <h2 class="text-lg font-bold text-slate-900">Unassigned Technicians Matrix</h2>
                <p class="text-sm text-slate-500">Map new onboarding applications safely into a supervisor's dynamic field group.</p>
              </div>
              
              {unassignedTechs.length === 0 ? (
                <div className="p-12 text-center text-slate-500">All field technicians have been cleanly assigned to operational supervisors.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                      <th className="px-6 py-4">Technician Candidate</th>
                      <th className="px-6 py-4">Skills Matrix Assessment</th>
                      <th className="px-6 py-4 text-right">Assign Direct Supervisor Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {unassignedTechs.map((tech) => (
                      <tr key={tech.tech_id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{tech.full_name}</div>
                          <div className="text-xs text-slate-400">UUID: {tech.tech_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {tech.skills.map(skill => (
                              <span key={skill.skill_id} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-xs">
                                Skill ID {skill.skill_id} (Lvl {skill.level})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2 justify-end items-center">
                            <select 
                              onChange={(e) => setSelectedSupervisors({...selectedSupervisors, [tech.tech_id]: e.target.value})}
                              className="rounded-lg border border-slate-300 text-xs p-2 bg-white focus:ring-2 focus:ring-indigo-500"
                              defaultValue=""
                            >
                              <option value="" disabled>Choose target supervisor...</option>
                              {supervisors.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.full_name} ({sup.department})</option>
                              ))}
                            </select>
                            <button 
                              onClick={() => handleAssignSupervisor(tech.tech_id)}
                              className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-md hover:bg-indigo-700 transition font-medium"
                            >
                              Confirm Assignment
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* TAB 2: SUPERVISORS PANEL */}
          {activeTab === 'supervisors' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Form Side */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-base font-bold text-slate-900 mb-4">Register New Supervisor</h3>
                <form onSubmit={handleCreateSupervisor} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                    <input type="text" required value={newSupervisor.full_name} onChange={e => setNewSupervisor({...newSupervisor, full_name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input type="email" required value={newSupervisor.email} onChange={e => setNewSupervisor({...newSupervisor, email: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="jane@tatuasasa.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Access Password</label>
                    <input type="password" required value={newSupervisor.password} onChange={e => setNewSupervisor({...newSupervisor, password: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Department Scope</label>
                    <select required value={newSupervisor.department} onChange={e => setNewSupervisor({...newSupervisor, department: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                      <option value="" disabled>Select Core Department...</option>
                      {departments.map(d => <option key={d.department_id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg p-2 font-medium hover:bg-indigo-700 transition text-xs mt-2">
                    Provision Account
                  </button>
                </form>
              </div>
              
              {/* Right Table/List Side */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold">Active Station Supervisors</div>
                <div className="divide-y divide-slate-200">
                  {supervisors.map(sup => (
                    <div key={sup.id} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-semibold text-slate-900">{sup.full_name}</div>
                        <div className="text-xs text-slate-400">{sup.email}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-medium">
                        {sup.department}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">System Functional Domains</h3>
                <form onSubmit={handleCreateDepartment} className="mt-4 flex gap-2">
                  <input type="text" required value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className="flex-1 border border-slate-300 rounded-lg p-2 text-sm bg-white" placeholder="Ex: Mechanical Engineering" />
                  <button type="submit" className="bg-indigo-600 text-white text-xs px-4 rounded-lg font-medium hover:bg-indigo-700 transition">
                    + Add Department
                  </button>
                </form>
              </div>
              <div className="divide-y divide-slate-200 text-sm">
                {departments.map(dept => (
                  <div key={dept.department_id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                    <span className="font-medium text-slate-800">{dept.name}</span>
                    <button onClick={() => handleDeleteDepartment(dept.department_id)} className="text-xs text-rose-500 hover:bg-rose-50 px-2 py-1 rounded transition">
                      Delete Unit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BUILDINGS & OFFICES */}
          {activeTab === 'facilities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {buildings.map(b => (
                <div key={b.building_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">🏢 {b.name}</h4>
                      <p className="text-xs text-slate-400">{b.county} Region</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Workspace Offices</p>
                    {offices.filter(o => o.building_id === b.building_id).map(o => (
                      <div key={o.office_id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{o.name} ({o.room_code})</div>
                          <div className="text-slate-400">Floor Level: {o.floor}</div>
                        </div>
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-medium">
                          Dept ID: {o.department_id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}