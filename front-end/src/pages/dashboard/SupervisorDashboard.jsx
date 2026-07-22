import { useState, useEffect } from "react";
// Import your authentic live API client helper
import { apiFetch } from "../../config/api"; 
import { supabase } from "../../config/supabaseClient";
import './admin-livequeue.css';

/* ---------------- SHARED PIECES (UI structures preserved exactly) ---------------- */

function KpiCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] p-4 shadow-sm">
      <p className="text-[12px] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-[22px] font-bold">{value}</p>
    </div>
  );
}

function SectionCard({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[var(--color-line)] p-4 shadow-sm ${className}`}>
      {title && <p className="mb-3 text-[15px] font-semibold">{title}</p>}
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const s = status?.toLowerCase() || '';
  if (['high', 'medium', 'low', 'urgent'].includes(s)) {
    return <span className={`priority-indicator priority-${s === 'urgent' ? 'high' : s}`}>{status}</span>;
  }
  if (['open', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated', 'pending', 'approved', 'rejected'].includes(s)) {
    return <span className={`admin-status-badge admin-status-${s === 'escalated' ? 'open' : s}`}>{status.replace('_', ' ')}</span>;
  }
  const map = {
    online: { bg: "#eaf3de", color: "#27500a" },
    busy: { bg: "#faeeda", color: "#854f0b" },
    offline: { bg: "#f1efe8", color: "#6e6e6e" },
  };
  const fall = map[s] || { bg: "#f1efe8", color: "#6e6e6e" };
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: fall.bg, color: fall.color }}
    >
      {status}
    </span>
  );
}

function Bar({ label, value, max, accent }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[110px] shrink-0 text-[12px]">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-[#f1efe8]">
        <div
          className="h-full rounded-full"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: accent }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[12px] text-[var(--color-muted)]">{value}</span>
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */

const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "livequeue", label: "Live Queue" },
  { key: "alltickets", label: "All Tickets" },
  { key: "reports", label: "Reports & Analytics" },
  { key: "workforce", label: "Workforce Management" },
  { key: "applications", label: "Pending Applications" },
  { key: "escalated", label: "Escalated Issues" },
  { key: "kb_approvals", label: "KB Approvals" },
  { key: "settings", label: "Settings" },
];

export default function SupervisorDashboard() {
  const [name, setName] = useState("");
  const [greenTheme, setGreenTheme] = useState(() => {
    const saved = localStorage.getItem('supervisor_theme');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('supervisor_theme', greenTheme);
  }, [greenTheme]);
  const [view, setView] = useState("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live database states
  const [tickets, setTickets] = useState([]);
  const [techniciansList, setTechniciansList] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [pendingKb, setPendingKb] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [escalatedPopupData, setEscalatedPopupData] = useState(null);

  const accent = greenTheme ? "#0B3D2E" : "#0b0b0b";
  const onAccent = "#ffffff";

  // Fetch all dashboard data using the authentic apiFetch helper
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Load active profile info from the correct path path (/me)
      const profile = await apiFetch("/me", {}, "Failed to load supervisor profile");
      setName(profile.full_name || "Supervisor");

      // 2. Fetch supervisor tickets scoped to their direct technicians / escalations
      const ticketsData = await apiFetch("/supervisor", {}, "Failed to load tickets");
      setTickets(ticketsData || []);

      // 3. Fetch list of reporting technicians
      const techsData = await apiFetch("/supervisor/technicians", {}, "Failed to load technicians");
      setTechniciansList(techsData || []);

      // 4. Fetch pending onboarding applications
      const appsData = await apiFetch("/supervisor/applications/pending", {}, "Failed to load applications");
      setPendingApps(appsData || []);

      // 5. Fetch KB approvals
      const kbData = await apiFetch("/supervisor/pending-kb", {}, "Failed to load KB approvals");
      setPendingKb(kbData || []);
    } catch (err) {
      setError(err.message || "Failed to sync dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [view]);

  useEffect(() => {
    let channel;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('supervisor-escalations')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `assigned_to=eq.${user.id}` },
          (payload) => {
            // Check if is_escalated transitioned to true
            if (payload.new.is_escalated && !payload.old.is_escalated) {
                setEscalatedPopupData(payload.new);
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

  const goTo = (key) => {
    setView(key);
    setDrawerOpen(false);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const pageTitle = navItems.find((n) => n.key === view)?.label || "Dashboard";

  /* ---------------- DYNAMIC METRIC GENERATION ---------------- */
  const totalCount = tickets.length;
  const waitingCount = tickets.filter((t) => t.status === "open").length;
  const progressCount = tickets.filter((t) => t.status === "in_progress").length;
  const completedCount = tickets.filter((t) => t.status === "resolved").length;
  const highPriorityCount = tickets.filter((t) => t.priority === "high" || t.priority === "urgent").length;
  const escalatedCount = tickets.filter((t) => t.is_escalated).length;
  const activeTechsCount = techniciansList.filter((t) => t.is_online).length;

  const dynamicKpis = [
    { label: "Total tickets", value: totalCount },
    { label: "Waiting", value: waitingCount },
    { label: "In progress", value: progressCount },
    { label: "Completed", value: completedCount },
    { label: "High priority", value: highPriorityCount },
    { label: "Escalated Issues", value: escalatedCount },
    { label: "Active technicians", value: activeTechsCount },
  ];

  /* ---------------- INTERACTIVE HANDLERS ---------------- */
  const [submittingAction, setSubmittingAction] = useState(null);
  const [actionSuccessPopup, setActionSuccessPopup] = useState(null);

  const handleApproveApp = async (userId) => {
    setSubmittingAction({ type: "approve_app", id: userId });
    try {
      await apiFetch(`/supervisor/applications/${userId}/approve`, { method: "POST" });
      await fetchDashboardData();
      setActionSuccessPopup({ title: "Application Approved", message: "The staff member has been successfully approved as an ICT Officer." });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleRejectApp = async (userId) => {
    setSubmittingAction({ type: "reject_app", id: userId });
    try {
      await apiFetch(`/supervisor/applications/${userId}/reject`, { method: "POST" });
      await fetchDashboardData();
      setActionSuccessPopup({ title: "Application Rejected", message: "The staff member's application has been rejected." });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleApproveKb = async (ticketId) => {
    setSubmittingAction({ type: "approve_kb", id: ticketId });
    try {
      await apiFetch(`/ai/publish-ticket/${ticketId}`, { method: "POST" });
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleRejectKb = async (ticketId) => {
    setSubmittingAction({ type: "reject_kb", id: ticketId });
    try {
      await apiFetch(`/ai/reject-ticket/${ticketId}`, { method: "POST" });
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleReassignTicket = async (ticketId, techId) => {
    setSubmittingAction({ type: "reassign_ticket", id: ticketId });
    try {
      await apiFetch(`/tickets/${ticketId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ technician_id: techId }),
      });
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleManualResolve = async (ticketId) => {
    setSubmittingAction({ type: "manual_resolve", id: ticketId });
    try {
      await apiFetch(`/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "resolved", comment: "Marked completed manually by Supervisor." }),
      });
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-[var(--color-line)]"
          >
            <span className="h-[1.5px] w-4 bg-[var(--color-ink)]" />
            <span className="h-[1.5px] w-4 bg-[var(--color-ink)]" />
            <span className="h-[1.5px] w-4 bg-[var(--color-ink)]" />
          </button>
          <div>
            <p className="text-[13px] font-medium text-[var(--color-muted)]">Tatua Sasa</p>
            <h1 className="mt-0.5 text-[20px] font-bold tracking-tight sm:text-[24px]">
              Welcome, {name || "loading..."}
            </h1>
            <p className="mt-1 text-[12px] text-[var(--color-muted)]">{dateStr} — {timeStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-red-500 text-xs hidden sm:inline">{error}</span>}
          <button
            onClick={() => goTo("notifications")}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-line)] text-[16px]"
          >
            🔔
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: accent }}
            >
              {pendingApps.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1200px] px-4 pb-10 sm:px-6">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
          {pageTitle}
        </p>

        {loading && <p className="text-[13px] text-[var(--color-muted)] mb-3">Syncing workspace...</p>}

        {view === "dashboard" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {dynamicKpis.map((k) => (
                <KpiCard key={k.label} {...k} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard title="Live Queue (Working)">
                <div className="flex flex-col gap-2">
                  {tickets
                    .filter((t) => t.status === "in_progress" || t.status === "assigned")
                    .slice(0, 4)
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#f7f7f7] px-3 py-2.5">
                        <div>
                          <p className="text-[13px] font-medium">{t.title}</p>
                          <p className="text-[11px] text-[var(--color-muted)]">
                            T-{t.id} — {techniciansList.find((tech) => tech.id === t.assigned_to)?.full_name || "Assigned"}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <StatusPill status={t.priority} />
                          <StatusPill status={t.status} />
                        </div>
                      </div>
                    ))}
                  {tickets.filter((t) => t.status === "in_progress" || t.status === "assigned").length === 0 && (
                    <p className="text-[13px] text-[var(--color-muted)]">No active jobs in progress.</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Escalations / Urgent Issues">
                <div className="flex flex-col gap-2">
                  {tickets
                    .filter((t) => t.is_escalated)
                    .slice(0, 3)
                    .map((e) => (
                      <div key={e.id} className="rounded-xl bg-[#f7f7f7] px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium">{e.title}</p>
                          <StatusPill status="urgent" />
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                          Category: {e.category} — Needs Immediate Supervisor Action
                        </p>
                      </div>
                    ))}
                  {tickets.filter((t) => t.is_escalated).length === 0 && (
                    <p className="text-[13px] text-[var(--color-muted)]">No escalated items to display.</p>
                  )}
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Quick actions">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => goTo("livequeue")}
                  className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                  style={{ borderColor: accent, color: accent }}
                >
                  Manage Live Queue
                </button>
                <button
                  onClick={() => goTo("applications")}
                  className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                  style={{ borderColor: accent, color: accent }}
                >
                  Review Applications ({pendingApps.length})
                </button>
                <button
                  onClick={() => goTo("escalated")}
                  className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                  style={{ borderColor: accent, color: accent }}
                >
                  View Escalations ({escalatedCount})
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {view === "livequeue" && (
          <SectionCard title="Live queue">
            <div className="queue-table-responsive">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ticket Subject</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets
                    .filter((t) => t.status !== "resolved" && t.status !== "closed")
                    .map((t) => (
                      <tr key={t.id}>
                        <td className="font-mono text-xs text-[var(--color-muted)]">T-{t.id}</td>
                        <td className="font-medium">{t.title}</td>
                        <td>{techniciansList.find((tech) => tech.id === t.assigned_to)?.full_name || "Unassigned"}</td>
                        <td><StatusPill status={t.priority} /></td>
                        <td><StatusPill status={t.status} /></td>
                        <td>
                          <select
                            onChange={(e) => handleReassignTicket(t.id, e.target.value)}
                            className="rounded border border-slate-300 text-xs px-2 py-1 bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>Reassign</option>
                            {techniciansList.map((tech) => (
                              <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  {tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted p-4 text-[13px]">No active tickets in queue.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {view === "alltickets" && (
          <SectionCard title="All tickets">
            <div className="queue-table-responsive">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ticket Subject</th>
                    <th>Handled By</th>
                    <th>Resolution Notes</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-xs text-[var(--color-muted)]">T-{t.id}</td>
                      <td className="font-medium">{t.title}</td>
                      <td>{techniciansList.find((tech) => tech.id === t.assigned_to)?.full_name || "Unassigned"}</td>
                      <td>
                        {t.resolution_notes ? (
                          <div className="text-[11px] bg-white p-1.5 rounded border border-slate-100 font-mono whitespace-pre-wrap max-w-[250px] overflow-hidden text-ellipsis">
                            {t.resolution_notes}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleManualResolve(t.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded border border-[#27500a] text-[#27500a] hover:bg-[#27500a] hover:text-white transition-colors"
                            disabled={submittingAction?.id === t.id}
                          >
                            Mark as completed
                          </button>
                        )}
                      </td>
                      <td><StatusPill status={t.priority} /></td>
                      <td><StatusPill status={t.status} /></td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted p-4 text-[13px]">No tickets found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {view === "reports" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard label="Average Completion Rate" value={`${totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(0) : 0}%`} />
              <KpiCard label="Urgent Tickets Open" value={highPriorityCount} />
              <KpiCard label="SLA Compliance Score" value="98%" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard title="Tickets By Priority">
                <div className="flex flex-col gap-2.5">
                  <Bar label="Urgent / High" value={highPriorityCount} max={totalCount} accent="#a32d2d" />
                  <Bar label="Medium" value={tickets.filter(t => t.priority === "medium").length} max={totalCount} accent="#faeeda" />
                  <Bar label="Low" value={tickets.filter(t => t.priority === "low").length} max={totalCount} accent="#f1efe8" />
                </div>
              </SectionCard>
              <SectionCard title="Live Workforce Load">
                <div className="flex flex-col gap-2.5">
                  {techniciansList.map((t) => (
                    <Bar key={t.id} label={t.full_name} value={t.current_workload || 0} max={10} accent="#185fa5" />
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {view === "workforce" && (
          <div className="flex flex-col gap-3">
            {techniciansList.map((t) => (
              <SectionCard key={t.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold">{t.full_name}</p>
                      <StatusPill status={t.is_online ? "online" : "offline"} />
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                      {t.department || "No Department"} — Contact: {t.email}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                      Current Open Workload: {t.current_workload || 0} active tickets
                    </p>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {view === "applications" && (
          <div className="flex flex-col gap-3">
            {pendingApps.map((a) => (
              <SectionCard key={a.id}>
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold">{a.full_name}</p>
                  <StatusPill status="pending" />
                </div>
                <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                  {a.email} — Applied on: {a.applied_on ? new Date(a.applied_on).toLocaleDateString() : "N/A"}
                </p>
                {a.skills && a.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.skills.map((s) => (
                      <span key={s.id} className="text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded text-slate-600">
                        {s.name} (Lvl {s.level})
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleApproveApp(a.id)}
                    disabled={submittingAction !== null}
                    className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
                    style={{ borderColor: accent, color: accent }}
                  >
                    {submittingAction?.type === "approve_app" && submittingAction?.id === a.id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleRejectApp(a.id)}
                    disabled={submittingAction !== null}
                    className="rounded-lg border border-[#a32d2d] px-3 py-1.5 text-[12px] font-semibold text-[#a32d2d] disabled:opacity-50"
                  >
                    {submittingAction?.type === "reject_app" && submittingAction?.id === a.id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </SectionCard>
            ))}
            {pendingApps.length === 0 && (
              <p className="text-[13px] text-[var(--color-muted)]">No pending applications left in your queue.</p>
            )}
          </div>
        )}

        {view === "escalated" && (
          <div className="space-y-6">
            <SectionCard title="Escalated Tickets">
              <div className="queue-table-responsive">
                <table className="queue-table w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Tech</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.filter(t => t.is_escalated).length === 0 && (
                      <tr><td colSpan="6" className="text-center py-4 text-sm text-[var(--color-muted)]">No active escalations.</td></tr>
                    )}
                    {tickets.filter(t => t.is_escalated).map(t => {
                      const latestReason = t.rejection_reasons ? t.rejection_reasons[t.rejection_reasons.length - 1]?.reason : "Escalated";
                      return (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td className="font-semibold">{t.title}</td>
                          <td><StatusPill status={t.priority} /></td>
                          <td>{t.assigned_to ? "Tech assigned" : "Unassigned"}</td>
                          <td className="text-[12px] text-red-600 max-w-[200px] truncate">{latestReason}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleManualResolve(t.id)}
                                disabled={submittingAction !== null}
                                className="rounded border px-2 py-1 text-[11px] font-semibold bg-[#eaf3de] text-[#27500a] border-[#27500a] hover:bg-[#d8eabf] disabled:opacity-50"
                              >
                                {submittingAction?.type === "manual_resolve" && submittingAction?.id === t.id ? "Resolving..." : "Mark Completed"}
                              </button>
                              <select
                                onChange={(evt) => handleReassignTicket(t.id, evt.target.value)}
                                disabled={submittingAction !== null}
                                className="rounded border border-slate-300 text-xs px-1.5 py-1 bg-white disabled:opacity-50"
                                defaultValue=""
                              >
                                <option value="" disabled>Reassign</option>
                                {techniciansList.map((tech) => (
                                  <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {view === "kb_approvals" && (
          <div className="space-y-6">
            <SectionCard title="Pending AI Knowledge Base Approvals">
              <p className="text-[13px] text-[var(--color-muted)] mb-4">
                Review technician resolution notes. Approved notes are embedded and published to the AI Knowledge Base to assist with future incidents.
              </p>
              <div className="queue-table-responsive">
                <table className="queue-table w-full">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Title</th>
                      <th>Resolution Notes</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingKb.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-4 text-sm text-[var(--color-muted)]">No pending approvals.</td></tr>
                    )}
                    {pendingKb.map(t => (
                      <tr key={t.id}>
                        <td style={{ verticalAlign: 'top' }}>#{t.id}</td>
                        <td className="font-semibold" style={{ verticalAlign: 'top' }}>{t.title}</td>
                        <td className="text-[12px] whitespace-pre-wrap max-w-[400px]">
                          {t.resolution_notes || "No resolution notes provided."}
                        </td>
                        <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                          <button
                            onClick={() => handleApproveKb(t.id)}
                            disabled={submittingAction !== null}
                            className="text-[11px] font-semibold text-white bg-green-700 px-3 py-1 rounded mr-2 disabled:opacity-50"
                          >
                            {submittingAction?.type === "approve_kb" && submittingAction?.id === t.id ? "Publishing..." : "Approve & Publish"}
                          </button>
                          <button
                            onClick={() => handleRejectKb(t.id)}
                            disabled={submittingAction !== null}
                            className="text-[11px] font-semibold text-red-700 bg-red-50 px-3 py-1 rounded border border-red-200 disabled:opacity-50"
                          >
                            {submittingAction?.type === "reject_kb" && submittingAction?.id === t.id ? "Rejecting..." : "Reject"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {view === "settings" && (
          <SectionCard title="Settings">
            <label className="block text-[12px] text-[var(--color-muted)]">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-2.5 py-2 text-[14px] bg-slate-50 cursor-not-allowed"
              disabled
            />
            <p className="text-[11px] text-[var(--color-muted)] mt-1">Contact system admin to update profile details.</p>
          </SectionCard>
        )}
      </div>

      {/* Dimmed overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ease-in-out ${
          drawerOpen ? "opacity-40" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Navigation drawer */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-3/4 max-w-[320px] transform rounded-r-2xl bg-[var(--color-bg)] shadow-2xl transition-transform duration-300 ease-in-out md:w-[320px] ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] p-5">
          <div>
            <p className="text-[14px] font-semibold">{name || "Supervisor"}</p>
            <p className="text-[12px] text-[var(--color-muted)]">Department Supervisor</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-[var(--color-muted)]"
          >
            ✕
          </button>
        </div>

        <div className="flex max-h-[calc(100%-160px)] flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => goTo(item.key)}
              className="rounded-xl px-4 py-3 text-left text-[14px] font-semibold transition-colors"
              style={
                view === item.key
                  ? { background: accent, color: onAccent }
                  : { background: "transparent", color: "var(--color-ink)" }
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-0 w-full border-t border-[var(--color-line)] p-3 bg-white">
          <button
            onClick={() => setGreenTheme((g) => !g)}
            className="w-full rounded-xl px-4 py-3 text-left text-[13px] font-semibold text-[var(--color-muted)]"
          >
            {greenTheme ? "Switch to black and white" : "Switch to hunter green"}
          </button>
          <button 
            onClick={async () => {
              try { await apiFetch('/logout', { method: 'POST' }); } catch (err) {}
              localStorage.removeItem('token');
              window.location.href = '/auth/login';
            }}
            className="w-full rounded-xl px-4 py-3 text-left text-[13px] font-semibold text-[#a32d2d]"
          >
            Log out
          </button>
        </div>
      </div>

      {/* SUPERVISOR ESCALATED POPUP */}
      {escalatedPopupData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card, #fff)', padding: '30px', borderRadius: '12px',
            maxWidth: '450px', textAlign: 'center', border: '1px solid var(--border-color, #e5e7eb)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
            <h2 style={{ color: '#854f0b', marginBottom: '15px', fontWeight: 'bold' }}>New Escalonation</h2>
            <p style={{ color: 'var(--text-main, #333)', marginBottom: '25px', lineHeight: '1.5' }}>
              A new issue titled "{escalatedPopupData.title}" has been escalated by a technician to your queue. Please check it out in the "Escalated Issues" tab.
            </p>
            <button 
              style={{ width: '100%', background: '#854f0b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => {
                setEscalatedPopupData(null);
                goTo("escalated");
              }}
            >
              View Escalated Issue
            </button>
            <button
               style={{ width: '100%', background: 'transparent', color: '#6e6e6e', padding: '10px 20px', border: 'none', cursor: 'pointer', marginTop: '10px' }}
               onClick={() => setEscalatedPopupData(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* SUPERVISOR ACTION SUCCESS POPUP */}
      {actionSuccessPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card, #fff)', padding: '30px', borderRadius: '12px',
            maxWidth: '450px', textAlign: 'center', border: '1px solid var(--border-color, #e5e7eb)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
            <h2 style={{ color: '#27500a', marginBottom: '15px', fontWeight: 'bold' }}>{actionSuccessPopup.title}</h2>
            <p style={{ color: 'var(--text-main, #333)', marginBottom: '25px', lineHeight: '1.5' }}>
              {actionSuccessPopup.message}
            </p>
            <button 
              style={{ width: '100%', background: '#27500a', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setActionSuccessPopup(null)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}