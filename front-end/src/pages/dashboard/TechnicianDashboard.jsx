import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../config/api";

/*
  AUTOMATIC SWITCH: this still starts with an empty `jobs` array to simulate a
  brand-new technician. Replace the useState([]) below with a real fetch once
  a backend exists (see comments further down). The "Simulate: assign a job"
  button is demo-only — delete it once real assignment exists.
*/

const demoJob = {
  id: 0,
  title: "Fix printer, ICT office",
  ticket: "Ticket #204 — from Grace A.",
  location: "Telposta Towers, 7th floor, ICT office",
  staffName: "Grace",
  description: "The printer keeps jamming on every third page, tried restarting it twice.",
  fileName: "printer_error.jpg",
  aiAnswer: "Similar tickets were fixed by replacing the fuser unit — bring a spare.",
  initialMessages: [
    { from: "staff", text: "Any update? The printer is down again." },
    { from: "me", text: "On my way now, bringing a spare part." },
  ],
  feedback: '"Fixed in 20 minutes, thank you!"',
};

const avatarOptions = ["headset", "laptop", "wrench"];

const knowledgeBaseArticles = [
  { title: "Clearing a recurring paper jam on tray 2", category: "Technician fixes", time: "4 min read" },
  { title: "Diagnosing a VPN certificate failure", category: "Technician fixes", time: "5 min read" },
  { title: "Fixing intermittent WiFi drops on the 3rd floor", category: "Technician fixes", time: "3 min read" },
  { title: "Resetting a locked employee login without escalation", category: "Account", time: "2 min read" },
  { title: "Replacing a failed fuser unit, step by step", category: "Technician fixes", time: "6 min read" },
  { title: "Understanding your first response time metric", category: "Reports", time: "8 min read" },
];

function buildJobFromTicket(ticket) {
  const locationParts = [ticket.location_building, ticket.location_floor, ticket.location_room].filter(Boolean);

  return {
    id: ticket.id,
    ticketId: ticket.id,
    title: ticket.title || "Support request",
    ticket: `Ticket #${ticket.id}`,
    location: locationParts.length ? locationParts.join(", ") : "Office",
    staffName: "Staff",
    description: ticket.description || "No details provided.",
    fileName: "",
    aiAnswer: "Ask Tatua Sasa AI for guidance.",
    initialMessages: [],
    feedback: "Thanks for the update.",
  };
}

function AvatarIcon({ kind, size = 22 }) {
  const paths = {
    headset: (
      <path d="M4 13a8 8 0 0116 0v4a2 2 0 01-2 2h-1v-6h3M4 13v6h3v-6H4a2 2 0 002-2" />
    ),
    laptop: <path d="M4 6h16v10H4zM2 18h20" />,
    wrench: <path d="M14 7a3 3 0 11-4 4l-6 6 2 2 6-6a3 3 0 114-4z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[kind] || paths.headset}
    </svg>
  );
}

function StatusToggle({ active, onToggle, accent }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 border px-3 py-2 text-[13px] font-semibold"
      style={{ borderColor: accent }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: active ? accent : "var(--color-muted)" }}
      />
      {active ? "Active" : "Away"}
    </button>
  );
}

function JobDetail({ job, accent, onAccent, onAccept, onReject, onEscalate, onResolve, onAskAi }) {
  const [stage, setStage] = useState("pending");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState(job.initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [aiAsked, setAiAsked] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [assetNumber, setAssetNumber] = useState("");
  const [steps, setSteps] = useState([""]);
  const [duration, setDuration] = useState("");
  const [published, setPublished] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const stepRefs = useRef([]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((m) => [...m, { from: "me", text: chatInput.trim() }]);
    setChatInput("");
  };

  const updateStep = (i, val) => {
    setSteps((s) => s.map((v, idx) => (idx === i ? val : v)));
  };

  const appendStep = () => {
    const nextSteps = [...steps, ""];
    setSteps(nextSteps);
    requestAnimationFrame(() => {
      stepRefs.current[nextSteps.length - 1]?.focus();
    });
  };

  const handleStepKeyDown = (event, index) => {
    if (event.key === "Enter") {
      event.preventDefault();
      appendStep();
      return;
    }

    if (event.key === "Backspace" && !event.currentTarget.value && index > 0) {
      event.preventDefault();
      const nextSteps = steps.filter((_, idx) => idx !== index);
      setSteps(nextSteps);
      requestAnimationFrame(() => {
        stepRefs.current[Math.max(0, Math.min(index - 1, nextSteps.length - 1))]?.focus();
      });
    }
  };

  const handleAccept = async () => {
    try {
      await onAccept?.(job.ticketId ?? job.id);
      setStage("working");
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    }
  };

  const handleReject = async () => {
    try {
      await onReject?.(job.ticketId ?? job.id);
      setStage("rejected");
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    }
  };

  const handleEscalate = async () => {
    try {
      await onEscalate?.(job.ticketId ?? job.id);
      setStage("escalated");
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    }
  };

  const handleResolve = async (isPublished) => {
    const cleanedSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (!cleanedSteps.length) return;

    try {
      await onResolve?.({
        ticketId: job.ticketId ?? job.id,
        steps: cleanedSteps,
        comment: `Time spent: ${duration || "n/a"}. Notes: ${assetNumber || "n/a"}`,
      });
      if (isPublished) {
        setPublished(true);
      } else {
        setSavedOnly(true);
      }
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    }
  };

  const handleAskAi = async () => {
    if (!onAskAi) {
      setAiAsked(true);
      return;
    }

    try {
      const response = await onAskAi(aiInput.trim());
      const answer = typeof response === "string" ? response : response?.answer || response?.message || job.aiAnswer;
      setAiAsked(true);
      if (answer) {
        setAiInput(answer);
      }
    } catch (err) {
      setAiAsked(true);
      setAiInput(err.message || "Unable to load guidance.");
    }
  };

  const resolved = published || savedOnly;

  const statusLabel = {
    pending: "Awaiting response",
    rejected: "Rejected — reassigning",
    working: "In progress",
    resolving: "In progress",
    escalated: "Escalated",
  }[stage] || (resolved ? "Resolved" : "In progress");

  const statusStyle = {
    pending: { background: "var(--color-line)", color: "var(--color-muted)" },
    rejected: { background: "#fbeaea", color: "#a32d2d" },
    escalated: { background: "#faeeda", color: "#854f0b" },
  }[stage] || (resolved
    ? { background: "#eaf3de", color: "#27500a" }
    : { background: "#e6f1fb", color: "#185fa5" });

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[16px] font-semibold">{job.title}</p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">{job.ticket}</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
            📍 {job.location}
          </p>
        </div>
        <span className="w-fit px-3 py-1 text-[12px] font-medium" style={statusStyle}>
          {resolved ? "Resolved" : statusLabel}
        </span>
      </div>

      {stage === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 border py-2.5 text-[14px] font-semibold"
            style={{ background: accent, borderColor: accent, color: onAccent }}
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            className="flex-1 border border-[var(--color-line)] py-2.5 text-[14px] font-semibold"
          >
            Reject
          </button>
        </div>
      )}

      {stage !== "pending" && stage !== "rejected" && (
        <div className="mt-4 space-y-3">
          {stage === "escalated" && (
            <div className="bg-[#faeeda] p-3">
              <p className="text-[14px] font-semibold text-[#854f0b]">Escalated to a supervisor</p>
              <p className="mt-1 text-[13px] text-[#854f0b]">
                You can keep working on it while you wait for a response.
              </p>
            </div>
          )}

          <div className="bg-[#f7f7f7] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
              What {job.staffName} said
            </p>
            <p className="mt-1.5 text-[14px] text-[var(--color-muted)]">"{job.description}"</p>
            {job.fileName && (
              <div className="mt-2 flex w-fit items-center gap-2 border border-[var(--color-line)] px-2.5 py-1.5">
                <span className="text-[12px] text-[var(--color-muted)]">📎 {job.fileName}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setChatOpen((o) => !o)}
            className="flex w-full items-center gap-2 bg-[#e6f1fb] px-3 py-2.5 text-left"
          >
            <span className="flex-1 text-[13px] text-[#185fa5]">
              {job.staffName} has opened a live chat with you
            </span>
            <span className="text-[13px] text-[#185fa5]">{chatOpen ? "▲" : "▼"}</span>
          </button>

          {chatOpen && (
            <div className="border border-[var(--color-line)] p-3">
              <div className="flex max-h-[150px] flex-col gap-1.5 overflow-y-auto">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className="max-w-[80%] px-2.5 py-2 text-[13px]"
                    style={
                      m.from === "me"
                        ? { alignSelf: "flex-end", background: accent, color: onAccent }
                        : { alignSelf: "flex-start", background: "#f1efe8" }
                    }
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={`Reply to ${job.staffName}…`}
                  className="min-w-0 flex-1 border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
                />
                <button onClick={sendMessage} className="border border-[var(--color-ink)] px-3 text-[13px] font-semibold">
                  Send
                </button>
              </div>
            </div>
          )}

          <div className="border border-dashed border-[var(--color-line)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
              Ask Tatua Sasa AI
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="What usually fixes this?"
                className="min-w-0 flex-1 border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
              />
              <button
                onClick={handleAskAi}
                className="border border-[var(--color-ink)] px-3 py-2 text-[13px] font-semibold"
              >
                Ask
              </button>
            </div>
            {aiAsked && <p className="mt-2 text-[13px] text-[var(--color-muted)]">{aiInput}</p>}
          </div>

          {!resolved && stage !== "resolving" && (
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#e6f1fb" }}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#185fa5" }} />
              <span className="text-[13px]" style={{ color: "#185fa5" }}>
                In progress — {job.staffName} will be notified once this is resolved
              </span>
            </div>
          )}

          {!resolved && stage !== "resolving" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleEscalate}
                className="flex-1 border py-2.5 text-[14px] font-semibold"
                style={{ background: "#faeeda", color: "#854f0b", borderColor: "#854f0b" }}
              >
                Escalate issue
              </button>
              <button
                onClick={() => setStage("resolving")}
                className="flex-1 border py-2.5 text-[14px] font-semibold"
                style={{ background: accent, borderColor: accent, color: onAccent }}
              >
                Mark as resolved
              </button>
            </div>
          )}

          {stage === "resolving" && !resolved && (
            <div className="bg-[#f7f7f7] p-4">
              <p className="text-[15px] font-semibold">Add this to the knowledge base</p>

              <label className="mt-3 block text-[12px] text-[var(--color-muted)]">
                Asset number, for inventory (optional)
              </label>
              <input
                value={assetNumber}
                onChange={(e) => setAssetNumber(e.target.value)}
                placeholder="AST-2291"
                className="mt-1 w-full border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
              />

              <p className="mt-3 text-[12px] text-[var(--color-muted)]">Steps</p>
              <div className="mt-1.5 flex flex-col gap-2">
                {steps.map((s, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      stepRefs.current[i] = el;
                    }}
                    value={s}
                    onChange={(e) => updateStep(i, e.target.value)}
                    onKeyDown={(e) => handleStepKeyDown(e, i)}
                    placeholder={`Step ${i + 1}`}
                    className="w-full border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
                  />
                ))}
              </div>
              <button
                onClick={appendStep}
                className="mt-2 text-[13px] font-semibold underline underline-offset-2"
              >
                + Add another step
              </button>

              <label className="mt-3 block text-[12px] text-[var(--color-muted)]">
                How long did this take?
              </label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="20 minutes"
                className="mt-1 w-full border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
              />

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => handleResolve(true)}
                  className="flex-1 border py-2.5 text-[14px] font-semibold"
                  style={{ background: accent, borderColor: accent, color: onAccent }}
                >
                  Publish article
                </button>
                <button
                  onClick={() => handleResolve(false)}
                  className="flex-1 border border-[var(--color-ink)] py-2.5 text-[14px] font-semibold"
                >
                  Save and mark as done
                </button>
              </div>
            </div>
          )}

          {published && (
            <p className="text-[13px] text-[#27500a]">Article added to the knowledge base.</p>
          )}

          {resolved && (
            <div className="bg-[#eaf3de] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#27500a]">
                Feedback from {job.staffName}
              </p>
              <p className="mt-1.5 text-[14px] text-[#27500a]">{job.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkillsPanel({ skills, onAddSkill }) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState("");

  const addSkill = async () => {
    if (!value.trim()) return;
    await onAddSkill(value.trim());
    setValue("");
    setShowInput(false);
  };

  return (
    <div className="border border-[var(--color-line)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold">Your skills</p>
        <button onClick={() => setShowInput(true)} className="text-[13px] font-semibold underline underline-offset-2">
          + Add skill
        </button>
      </div>
      <div className="mt-2.5">
        {skills.length === 0 ? (
          <p className="text-[13px] text-[var(--color-muted)]">No skills added yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <tbody>
              {skills.map((s, i) => (
                <tr key={i}>
                  <td className="border-t border-[var(--color-line)] py-1.5">{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showInput && (
        <div className="mt-2.5 flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder="Networking"
            className="min-w-0 flex-1 border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
          />
          <button onClick={addSkill} className="border border-[var(--color-ink)] bg-[var(--color-ink)] px-3 text-[13px] font-semibold text-[var(--color-bg)]">
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export default function TechnicianDashboard() {
  const [name, setName] = useState("Esther");
  const [nameInput, setNameInput] = useState("Esther");
  const [bio, setBio] = useState("Field technician specialising in networking and hardware repair.");
  const [avatar, setAvatar] = useState("headset");
  const [active, setActive] = useState(false);
  const [greenTheme, setGreenTheme] = useState(true);
  const [view, setView] = useState("queue");
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [solvedHistory, setSolvedHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kbSearch, setKbSearch] = useState("");

  const accent = greenTheme ? "#0B3D2E" : "#0b0b0b";
  const onAccent = "#ffffff";
  const hasJobs = jobs.length > 0;

  const navItems = [
    { key: "queue", label: "Queue" },
    { key: "skills", label: "Skills" },
    { key: "solved", label: "Problems solved" },
    { key: "knowledgebase", label: "Knowledge base" },
    { key: "leaderboard", label: "Leaderboard" },
    { key: "profile", label: "Settings" },
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const profile = await apiFetch("/me", {}, "Failed to load profile");
        if (profile.full_name) {
          setName(profile.full_name);
          setNameInput(profile.full_name);
        }
        setActive(Boolean(profile.is_online));
      } catch (err) {
        // Keep the existing placeholder values if the profile call fails.
      }

      try {
        const assignedTickets = await apiFetch("/tickets/assigned", {}, "Failed to load assigned tickets");
        setJobs((assignedTickets || []).map(buildJobFromTicket));
      } catch (err) {
        setJobs([]);
      }

      try {
        const dashboardSummary = await apiFetch("/technicians/me/dashboard", {}, "Failed to load dashboard summary");
        setSkills((dashboardSummary.skills || []).map((skill) => skill.name));
        setSolvedHistory((dashboardSummary.solved || []).map((item) => ({ title: item.title, when: item.when })));
        setLeaderboard((dashboardSummary.leaderboard || []).map((item) => ({ name: item.name, count: item.count })));
      } catch (err) {
        try {
          const technicianSkills = await apiFetch("/technicians/skills", {}, "Failed to load skills");
          setSkills((technicianSkills || []).map((skill) => skill.name));
        } catch (skillErr) {
          setSkills([]);
        }
      }
    };

    loadDashboardData();
  }, []);

  const goTo = (key) => {
    setView(key);
    setDrawerOpen(false);
  };

  const handleAvailabilityToggle = async () => {
    const nextState = !active;
    try {
      const response = await apiFetch(
        "/technicians/me/availability",
        {
          method: "PATCH",
          body: JSON.stringify({ is_online: nextState }),
        },
        "Failed to update availability"
      );
      setActive(Boolean(response?.is_online ?? nextState));
    } catch (err) {
      setActive(active);
    }
  };

  const handleAcceptTicket = async (ticketId) => {
    await apiFetch(
      `/tickets/${ticketId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "in_progress" }),
      },
      "Failed to accept the ticket"
    );
  };

  const handleRejectTicket = async (ticketId) => {
    await apiFetch(
      `/tickets/${ticketId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "open", comment: "Manual rejection by technician" }),
      },
      "Failed to reject the ticket"
    );
    setJobs([]);
  };

  const handleEscalateTicket = async (ticketId) => {
    await apiFetch(
      `/tickets/${ticketId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "escalated", comment: "Escalated for supervisor intervention." }),
      },
      "Failed to escalate the ticket"
    );
  };

  const handleResolveTicket = async ({ ticketId, steps, comment }) => {
    await apiFetch(
      `/tickets/${ticketId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "resolved", steps, comment }),
      },
      "Failed to mark the ticket as resolved"
    );
  };

  const handleAskAi = async (question) => {
    return apiFetch(
      "/ai/ask",
      {
        method: "POST",
        body: JSON.stringify({ question }),
      },
      "Failed to load AI guidance"
    );
  };

  const handleAddSkill = async (skillName) => {
    const skillCatalog = await apiFetch("/skills", {}, "Failed to load skill catalog");
    const matchedSkill = skillCatalog.find((skill) => skill.name.toLowerCase() === skillName.toLowerCase());

    if (!matchedSkill) {
      throw new Error("Skill not found in the catalog. Try an existing skill name.");
    }

    await apiFetch(
      "/technicians/skills",
      {
        method: "POST",
        body: JSON.stringify({ skill_id: matchedSkill.id, level: 2 }),
      },
      "Failed to save skill"
    );

    setSkills((currentSkills) => {
      if (currentSkills.includes(matchedSkill.name)) return currentSkills;
      return [...currentSkills, matchedSkill.name];
    });
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) return;

    try {
      await apiFetch(
        "/me",
        {
          method: "PATCH",
          body: JSON.stringify({ full_name: nameInput.trim() }),
        },
        "Failed to update profile"
      );
      setName(nameInput.trim());
      setProfileSaved(true);
    } catch (err) {
      setProfileSaved(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-muted)]">Tatua Sasa</p>
          <h1 className="mt-0.5 text-[20px] font-bold tracking-tight sm:text-[24px]">
            Welcome, {name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusToggle active={active} onToggle={handleAvailabilityToggle} accent={accent} />
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

      {/* Main content - always the current view, Queue by default */}
      <div className="mx-auto max-w-[1000px] px-4 pb-10 sm:px-6">
        {view === "queue" && (
          <>
            {!hasJobs && (
              <div className="rounded-2xl border border-[var(--color-line)] p-8 text-center">
                <p className="text-[15px] font-semibold">No jobs assigned yet</p>
                <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                  Jobs will show up here automatically once one is assigned to you.
                </p>
              </div>
            )}
            {hasJobs && (
              <div className="rounded-2xl border border-[var(--color-ink)] shadow-sm">
                <JobDetail
                  key={jobs[0].id}
                  job={jobs[0]}
                  accent={accent}
                  onAccent={onAccent}
                  onAccept={handleAcceptTicket}
                  onReject={handleRejectTicket}
                  onEscalate={handleEscalateTicket}
                  onResolve={handleResolveTicket}
                  onAskAi={handleAskAi}
                />
              </div>
            )}
          </>
        )}

        {view === "skills" && (
          <div className="rounded-2xl border border-[var(--color-line)] p-1 shadow-sm">
            <SkillsPanel skills={skills} onAddSkill={handleAddSkill} />
          </div>
        )}

        {view === "solved" && (
          <div className="rounded-2xl border border-[var(--color-line)] p-4 shadow-sm">
            <p className="mb-2.5 text-[15px] font-semibold">Problems you've solved</p>
            {solvedHistory.map((s) => (
              <div key={s.title} className="flex justify-between border-t border-[var(--color-line)] py-2 text-[14px]">
                <span>{s.title}</span>
                <span className="text-[var(--color-muted)]">{s.when}</span>
              </div>
            ))}
          </div>
        )}

        {view === "knowledgebase" && (
          <div className="rounded-2xl border border-[var(--color-line)] p-4 shadow-sm">
            <p className="mb-3 text-[15px] font-semibold">Knowledge base</p>
            <input
              value={kbSearch}
              onChange={(e) => setKbSearch(e.target.value)}
              placeholder="Search articles…"
              className="mb-3 w-full rounded-lg border border-[var(--color-line)] px-3 py-2.5 text-[14px]"
            />
            <div className="flex flex-col gap-2">
              {knowledgeBaseArticles
                .filter((a) => a.title.toLowerCase().includes(kbSearch.toLowerCase()))
                .map((a) => (
                  <div
                    key={a.title}
                    className="rounded-xl border border-[var(--color-line)] p-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                      {a.category}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">{a.title}</p>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">{a.time}</p>
                  </div>
                ))}
              {knowledgeBaseArticles.filter((a) =>
                a.title.toLowerCase().includes(kbSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-[13px] text-[var(--color-muted)]">No articles match that search.</p>
              )}
            </div>
          </div>
        )}

        {view === "leaderboard" && (
          <div className="rounded-2xl border border-[var(--color-line)] p-4 shadow-sm">
            <p className="mb-2.5 text-[15px] font-semibold">Leaderboard, this month</p>
            <div className="flex flex-col gap-2">
              {leaderboard.length === 0 ? (
                <p className="text-[13px] text-[var(--color-muted)]">No resolved tickets yet.</p>
              ) : (
                leaderboard.map((l, i) => (
                  <div key={`${l.name}-${i}`} className="flex justify-between rounded-lg bg-[#f7f7f7] px-3 py-2 text-[14px]">
                    <span>{i + 1}. {l.name}</span>
                    <span className="text-[var(--color-muted)]">{l.count} resolved</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === "profile" && (
          <div className="rounded-2xl border border-[var(--color-line)] p-4 shadow-sm">
            <p className="mb-3 text-[15px] font-semibold">Your profile</p>

            <p className="mb-2 text-[12px] text-[var(--color-muted)]">Choose an avatar</p>
            <div className="mb-4 flex gap-2.5">
              {avatarOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAvatar(opt)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2"
                  style={
                    avatar === opt
                      ? { background: accent, color: onAccent, borderColor: accent }
                      : { background: "#f7f7f7", color: "var(--color-muted)", borderColor: "transparent" }
                  }
                >
                  <AvatarIcon kind={opt} />
                </button>
              ))}
            </div>

            <label className="block text-[12px] text-[var(--color-muted)]">Name</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-2.5 py-2 text-[15px]"
            />

            <label className="mt-3 block text-[12px] text-[var(--color-muted)]">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] p-2.5 text-[14px]"
            />

            <button
              onClick={handleSaveProfile}
              className="mt-4 rounded-lg border px-5 py-2.5 text-[14px] font-semibold"
              style={{ background: accent, borderColor: accent, color: onAccent }}
            >
              Save profile
            </button>
            {profileSaved && <p className="mt-2 text-[13px] text-[#27500a]">Profile updated.</p>}
          </div>
        )}
      </div>

      {/* Dimmed overlay - click to close */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ease-in-out ${
          drawerOpen ? "opacity-40" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Navigation drawer - slides in from the right */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-3/4 max-w-[320px] transform rounded-l-2xl bg-[var(--color-bg)] shadow-2xl transition-transform duration-300 ease-in-out md:w-[320px] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: accent, color: onAccent }}
            >
              <AvatarIcon kind={avatar} size={18} />
            </div>
            <div>
              <p className="text-[14px] font-semibold">{name}</p>
              <p className="text-[12px] text-[var(--color-muted)]">Technician</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-[var(--color-muted)]"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => goTo(item.key)}
              className="rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-colors"
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
            className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-semibold text-[var(--color-muted)]"
          >
            {greenTheme ? "Switch to black and white" : "Switch to hunter green"}
          </button>
        </div>
      </div>
    </div>
  );
}