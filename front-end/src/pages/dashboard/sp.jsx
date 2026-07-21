import { useState } from "react";

/* ---------------- MOCK DATA ---------------- */
/* Everything below stands in for real backend data. Each section notes,
   in comments, roughly what a real API call would replace it with. */

const kpis = [
  { label: "Total tickets", value: 428 },
  { label: "Waiting", value: 36 },
  { label: "In progress", value: 54 },
  { label: "Resolved", value: 338 },
  { label: "High priority", value: 12 },
  { label: "SLA breaches", value: 4 },
  { label: "Active technicians", value: 9 },
];

const liveQueue = [
  { id: "T-2041", title: "Server outage, HQ", priority: "High", status: "In progress", technician: "Brian K." },
  { id: "T-2042", title: "VPN certificate failure", priority: "High", status: "Waiting", technician: "Unassigned" },
  { id: "T-2043", title: "Printer jam, ICT office", priority: "Medium", status: "In progress", technician: "Daniel O." },
  { id: "T-2044", title: "New hire laptop setup", priority: "Low", status: "Waiting", technician: "Unassigned" },
];

const allTickets = [
  ...liveQueue,
  { id: "T-2030", title: "Password reset", priority: "Low", status: "Resolved", technician: "Amina R." },
  { id: "T-2031", title: "WiFi drops, 3rd floor", priority: "Medium", status: "Resolved", technician: "Amina R." },
  { id: "T-2032", title: "Software licence renewal", priority: "Low", status: "Resolved", technician: "Brian K." },
];

const escalations = [
  {
    id: "T-2041",
    title: "Server outage, HQ",
    level: "Level 2",
    reason: "No response within SLA window",
    technician: "Brian K.",
    department: "Infrastructure",
    waiting: "22 min",
    sla: "Breached",
  },
  {
    id: "T-2042",
    title: "VPN certificate failure",
    level: "Level 1",
    reason: "Reopened twice",
    technician: "Daniel O.",
    department: "Networking",
    waiting: "8 min",
    sla: "At risk",
  },
];

const technicianActivity = [
  { text: "Brian K. accepted ticket T-2041", time: "2 min ago" },
  { text: "Amina R. published a knowledge base article", time: "18 min ago" },
  { text: "Daniel O. escalated ticket T-2042", time: "34 min ago" },
  { text: "Grace A. submitted feedback for T-2030", time: "1 hr ago" },
];

const systemAlerts = [
  { text: "SLA breach threshold reached for Infrastructure team", severity: "high" },
  { text: "Auto-assignment success rate dropped below 90%", severity: "medium" },
];

const reportStats = [
  { label: "Avg resolution time", value: "34m" },
  { label: "First response time", value: "3m 12s" },
  { label: "SLA compliance", value: "96%" },
  { label: "Auto-assignment success", value: "88%" },
  { label: "CSAT", value: "4.6 / 5" },
  { label: "Repeat incidents", value: "6%" },
];

const ticketsByDept = [
  { label: "IT / Infrastructure", value: 142 },
  { label: "Networking", value: 98 },
  { label: "Facilities", value: 74 },
  { label: "HR systems", value: 41 },
];

const peakHours = [
  { label: "8–10am", value: 62 },
  { label: "10am–12pm", value: 88 },
  { label: "12–2pm", value: 40 },
  { label: "2–4pm", value: 71 },
];

const technicians = [
  { name: "Brian K.", status: "online", workload: 4, leave: "None scheduled", shift: "Day (8am–5pm)", skills: ["Networking", "Hardware"], dept: "Infrastructure", performance: "42 resolved" },
  { name: "Amina R.", status: "busy", workload: 2, leave: "None scheduled", shift: "Day (8am–5pm)", skills: ["Software", "Accounts"], dept: "Networking", performance: "33 resolved" },
  { name: "Daniel O.", status: "online", workload: 3, leave: "Annual leave, 14–16 Jul", shift: "Evening (12–9pm)", skills: ["Networking"], dept: "Networking", performance: "21 resolved" },
  { name: "Grace W.", status: "offline", workload: 0, leave: "None scheduled", shift: "Day (8am–5pm)", skills: ["Hardware"], dept: "Facilities", performance: "18 resolved" },
];

const feedbackSummary = { overall: 4.6, professionalism: 4.7, quality: 4.5, speed: 4.4, recommend: 89 };
const technicianRatings = [
  { name: "Amina R.", rating: 4.9 },
  { name: "Brian K.", rating: 4.6 },
  { name: "Daniel O.", rating: 4.1 },
];

const kbSubmissions = [
  { title: "Fixing intermittent WiFi drops", author: "Amina R.", category: "Technician fixes", date: "Jul 8", status: "Pending" },
  { title: "Diagnosing a VPN certificate failure", author: "Daniel O.", category: "Networking", date: "Jul 7", status: "Pending" },
  { title: "Replacing a fuser unit, step by step", author: "Brian K.", category: "Technician fixes", date: "Jul 5", status: "Approved" },
];

const orgHierarchy = {
  role: "Supervisor",
  name: "You",
  reports: [
    { role: "Technician", name: "Brian K." },
    { role: "Technician", name: "Amina R." },
    { role: "Technician", name: "Daniel O." },
    { role: "Technician", name: "Grace W." },
  ],
};

const notifications = [
  { text: "Ticket T-2041 breached its SLA", time: "5 min ago" },
  { text: "New knowledge base article awaiting review", time: "20 min ago" },
  { text: "Daniel O. requested annual leave", time: "1 hr ago" },
];

const auditLogs = [
  { text: "Supervisor approved KB article 'Replacing a fuser unit'", time: "Jul 8, 10:22am" },
  { text: "Supervisor reassigned T-2039 from Grace W. to Brian K.", time: "Jul 8, 9:47am" },
  { text: "Supervisor deactivated account for former staff member", time: "Jul 7, 4:03pm" },
];

/* ---------------- SHARED PIECES ---------------- */

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
  const map = {
    online: { bg: "#eaf3de", color: "#27500a" },
    busy: { bg: "#faeeda", color: "#854f0b" },
    offline: { bg: "#f1efe8", color: "#6e6e6e" },
    Waiting: { bg: "#faeeda", color: "#854f0b" },
    "In progress": { bg: "#e6f1fb", color: "#185fa5" },
    Resolved: { bg: "#eaf3de", color: "#27500a" },
    High: { bg: "#fbeaea", color: "#a32d2d" },
    Medium: { bg: "#faeeda", color: "#854f0b" },
    Low: { bg: "#f1efe8", color: "#6e6e6e" },
    Breached: { bg: "#fbeaea", color: "#a32d2d" },
    "At risk": { bg: "#faeeda", color: "#854f0b" },
    Pending: { bg: "#faeeda", color: "#854f0b" },
    Approved: { bg: "#eaf3de", color: "#27500a" },
  };
  const s = map[status] || { bg: "#f1efe8", color: "#6e6e6e" };
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: s.bg, color: s.color }}
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
          style={{ width: `${(value / max) * 100}%`, background: accent }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[12px] text-[var(--color-muted)]">{value}</span>
    </div>
  );
}

/* ---------------- PAGES ---------------- */

function DashboardHome({ accent }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Live queue">
          <div className="flex flex-col gap-2">
            {liveQueue.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#f7f7f7] px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-medium">{t.title}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{t.id} — {t.technician}</p>
                </div>
                <div className="flex gap-1.5">
                  <StatusPill status={t.priority} />
                  <StatusPill status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent escalations">
          <div className="flex flex-col gap-2">
            {escalations.map((e) => (
              <div key={e.id} className="rounded-xl bg-[#f7f7f7] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">{e.title}</p>
                  <StatusPill status={e.sla} />
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">{e.level} — {e.reason}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Technician activity">
          <div className="flex flex-col gap-2">
            {technicianActivity.map((a, i) => (
              <div key={i} className="flex justify-between text-[13px]">
                <span>{a.text}</span>
                <span className="shrink-0 pl-2 text-[11px] text-[var(--color-muted)]">{a.time}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="System alerts">
          <div className="flex flex-col gap-2">
            {systemAlerts.map((a, i) => (
              <div
                key={i}
                className="rounded-xl px-3 py-2.5 text-[13px]"
                style={{
                  background: a.severity === "high" ? "#fbeaea" : "#faeeda",
                  color: a.severity === "high" ? "#a32d2d" : "#854f0b",
                }}
              >
                {a.text}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick actions">
        <div className="flex flex-wrap gap-2">
          {["Reassign a ticket", "Approve KB article", "View escalations", "Export report"].map((label) => (
            <button
              key={label}
              className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
              style={{ borderColor: accent, color: accent }}
            >
              {label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function TicketsTable({ rows }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((t) => (
        <div key={t.id} className="flex flex-col gap-1.5 rounded-xl bg-[#f7f7f7] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium">{t.title}</p>
            <p className="text-[11px] text-[var(--color-muted)]">{t.id} — {t.technician}</p>
          </div>
          <div className="flex gap-1.5">
            <StatusPill status={t.priority} />
            <StatusPill status={t.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {reportStats.map((s) => (
          <KpiCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Tickets by department">
          <div className="flex flex-col gap-2.5">
            {ticketsByDept.map((d) => (
              <Bar key={d.label} label={d.label} value={d.value} max={150} accent="#0B3D2E" />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Peak ticket hours">
          <div className="flex flex-col gap-2.5">
            {peakHours.map((p) => (
              <Bar key={p.label} label={p.label} value={p.value} max={100} accent="#185fa5" />
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Export & filters">
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-[13px]" />
          <span className="text-[13px] text-[var(--color-muted)]">to</span>
          <input type="date" className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-[13px]" />
          {["Export PDF", "Export Excel", "Export CSV"].map((label) => (
            <button key={label} className="rounded-lg border border-[var(--color-ink)] px-3 py-2 text-[13px] font-semibold">
              {label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function WorkforcePage() {
  return (
    <div className="flex flex-col gap-3">
      {technicians.map((t) => (
        <SectionCard key={t.name}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold">{t.name}</p>
                <StatusPill status={t.status} />
              </div>
              <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                {t.dept} — {t.shift} — {t.skills.join(", ")}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                Workload: {t.workload} open — {t.leave} — {t.performance}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-semibold">
                Transfer team
              </button>
              <button className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-semibold">
                Deactivate
              </button>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function EscalatedPage({ accent }) {
  return (
    <div className="flex flex-col gap-3">
      {escalations.map((e) => (
        <SectionCard key={e.id}>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold">{e.title}</p>
            <StatusPill status={e.sla} />
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--color-muted)]">
            {e.level} — {e.reason}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
            {e.technician} — {e.department} — waiting {e.waiting}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold" style={{ borderColor: accent, color: accent }}>
              Resolve
            </button>
            <button className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-semibold">
              Reassign
            </button>
            <button className="rounded-lg border border-[#854f0b] px-3 py-1.5 text-[12px] font-semibold text-[#854f0b]">
              Escalate further
            </button>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function FeedbackPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Overall rating" value={`${feedbackSummary.overall} / 5`} />
        <KpiCard label="Professionalism" value={feedbackSummary.professionalism} />
        <KpiCard label="Resolution quality" value={feedbackSummary.quality} />
        <KpiCard label="Response speed" value={feedbackSummary.speed} />
        <KpiCard label="Would recommend" value={`${feedbackSummary.recommend}%`} />
      </div>
      <SectionCard title="Technician ratings">
        <div className="flex flex-col gap-2">
          {technicianRatings.map((t) => (
            <div key={t.name} className="flex items-center justify-between rounded-xl bg-[#f7f7f7] px-3 py-2.5 text-[13px]">
              <span>{t.name}</span>
              <span className="font-semibold">{t.rating} / 5</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function KbReviewPage({ accent }) {
  const [items, setItems] = useState(kbSubmissions);
  const act = (title, status) =>
    setItems((prev) => prev.map((i) => (i.title === title ? { ...i, status } : i)));

  return (
    <div className="flex flex-col gap-3">
      {items.map((a) => (
        <SectionCard key={a.title}>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold">{a.title}</p>
            <StatusPill status={a.status} />
          </div>
          <p className="mt-1 text-[12px] text-[var(--color-muted)]">
            {a.author} — {a.category} — submitted {a.date}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-semibold">Preview</button>
            <button
              onClick={() => act(a.title, "Approved")}
              className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
              style={{ borderColor: accent, color: accent }}
            >
              Approve
            </button>
            <button className="rounded-lg border border-[#854f0b] px-3 py-1.5 text-[12px] font-semibold text-[#854f0b]">
              Request changes
            </button>
            <button className="rounded-lg border border-[#a32d2d] px-3 py-1.5 text-[12px] font-semibold text-[#a32d2d]">
              Reject
            </button>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function OrgHierarchyPage({ accent }) {
  return (
    <SectionCard title="Your reporting structure">
      <p className="mb-3 text-[12px] text-[var(--color-muted)]">
        You can only view your own level and everyone below you.
      </p>
      <div className="rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: accent, color: "#fff" }}>
        {orgHierarchy.role} — {orgHierarchy.name}
      </div>
      <div className="ml-4 mt-2 flex flex-col gap-2 border-l border-[var(--color-line)] pl-4">
        {orgHierarchy.reports.map((r) => (
          <div key={r.name} className="rounded-xl bg-[#f7f7f7] px-3 py-2 text-[13px]">
            {r.role} — {r.name}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function NotificationsPage() {
  return (
    <SectionCard title="Notifications">
      <div className="flex flex-col gap-2">
        {notifications.map((n, i) => (
          <div key={i} className="flex justify-between rounded-xl bg-[#f7f7f7] px-3 py-2.5 text-[13px]">
            <span>{n.text}</span>
            <span className="shrink-0 pl-2 text-[11px] text-[var(--color-muted)]">{n.time}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function AuditLogsPage() {
  return (
    <SectionCard title="Audit logs">
      <div className="flex flex-col gap-2">
        {auditLogs.map((l, i) => (
          <div key={i} className="border-t border-[var(--color-line)] py-2 text-[13px]">
            <p>{l.text}</p>
            <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{l.time}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SettingsPage({ name, setName, accent, onAccent }) {
  const [nameInput, setNameInput] = useState(name);
  const [saved, setSaved] = useState(false);
  return (
    <SectionCard title="Settings">
      <label className="block text-[12px] text-[var(--color-muted)]">Name</label>
      <input
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
      />
      <button
        onClick={() => {
          if (nameInput.trim()) setName(nameInput.trim());
          setSaved(true);
        }}
        className="mt-4 rounded-lg border px-5 py-2.5 text-[14px] font-semibold"
        style={{ background: accent, borderColor: accent, color: onAccent }}
      >
        Save
      </button>
      {saved && <p className="mt-2 text-[13px] text-[#27500a]">Saved.</p>}
    </SectionCard>
  );
}

/* ---------------- MAIN APP ---------------- */

const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "livequeue", label: "Live Queue" },
  { key: "alltickets", label: "All Tickets" },
  { key: "reports", label: "Reports & Analytics" },
  { key: "workforce", label: "Workforce Management" },
  { key: "escalated", label: "Escalated Issues" },
  { key: "feedback", label: "Staff Feedback" },
  { key: "kbreview", label: "Knowledge Base Review" },
  { key: "orghierarchy", label: "Organizational Hierarchy" },
  { key: "notifications", label: "Notifications" },
  { key: "auditlogs", label: "Audit Logs" },
  { key: "settings", label: "Settings" },
];

export default function Supervisor() {
  const [name, setName] = useState("Esther");
  const [greenTheme, setGreenTheme] = useState(true);
  const [view, setView] = useState("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accent = greenTheme ? "#0B3D2E" : "#0b0b0b";
  const onAccent = "#ffffff";

  const goTo = (key) => {
    setView(key);
    setDrawerOpen(false);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const pageTitle = navItems.find((n) => n.key === view)?.label || "Dashboard";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-muted)]">Tatua Sasa</p>
          <h1 className="mt-0.5 text-[20px] font-bold tracking-tight sm:text-[24px]">
            Welcome, {name}
          </h1>
          <p className="mt-1 text-[12px] text-[var(--color-muted)]">{dateStr} — {timeStr}</p>
        </div>
        <div className="flex items-center gap-2">
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
              {notifications.length}
            </span>
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-[var(--color-line)]"
          >
            <span className="h-[1.5px] w-4 bg-[var(--color-ink)]" />
            <span className="h-[1.5px] w-4 bg-[var(--color-ink)]" />
            <span className="h-[1.5px] w-4 bg-[var(--color-ink)]" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1200px] px-4 pb-10 sm:px-6">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
          {pageTitle}
        </p>

        {view === "dashboard" && <DashboardHome accent={accent} />}
        {view === "livequeue" && <SectionCard title="Live queue"><TicketsTable rows={liveQueue} /></SectionCard>}
        {view === "alltickets" && <SectionCard title="All tickets"><TicketsTable rows={allTickets} /></SectionCard>}
        {view === "reports" && <ReportsPage />}
        {view === "workforce" && <WorkforcePage />}
        {view === "escalated" && <EscalatedPage accent={accent} />}
        {view === "feedback" && <FeedbackPage />}
        {view === "kbreview" && <KbReviewPage accent={accent} />}
        {view === "orghierarchy" && <OrgHierarchyPage accent={accent} />}
        {view === "notifications" && <NotificationsPage />}
        {view === "auditlogs" && <AuditLogsPage />}
        {view === "settings" && (
          <SettingsPage name={name} setName={setName} accent={accent} onAccent={onAccent} />
        )}
      </div>

      {/* Dimmed overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ease-in-out ${
          drawerOpen ? "opacity-40" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Navigation drawer - slides in from the LEFT */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-3/4 max-w-[320px] transform rounded-r-2xl bg-[var(--color-bg)] shadow-2xl transition-transform duration-300 ease-in-out md:w-[320px] ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] p-5">
          <div>
            <p className="text-[14px] font-semibold">{name}</p>
            <p className="text-[12px] text-[var(--color-muted)]">Supervisor</p>
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

        <div className="absolute bottom-0 w-full border-t border-[var(--color-line)] p-3">
          <button
            onClick={() => setGreenTheme((g) => !g)}
            className="w-full rounded-xl px-4 py-3 text-left text-[13px] font-semibold text-[var(--color-muted)]"
          >
            {greenTheme ? "Switch to black and white" : "Switch to hunter green"}
          </button>
          <button className="w-full rounded-xl px-4 py-3 text-left text-[13px] font-semibold text-[#a32d2d]">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
