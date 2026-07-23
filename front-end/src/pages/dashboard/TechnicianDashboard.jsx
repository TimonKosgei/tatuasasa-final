import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../config/api";
import { supabase } from "../../config/SupabaseClient";
import { playNotificationSound } from "../../utils/sound";
import './admin-livequeue.css';

const formatAiResponse = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <div key={i} className="min-h-[1.2em] mb-1 leading-relaxed">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </div>
    );
  });
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
    feedback: "Thanks for the update.",
    status: ticket.status || "assigned",
    priority: ticket.priority || "medium",
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

function StatusToggle({ active, onToggle, accent, isTogglingAvailability }) {
  return (
    <button
      onClick={onToggle}
      disabled={isTogglingAvailability}
      className="flex items-center gap-2 border px-3 py-2 text-[13px] font-semibold disabled:opacity-50"
      style={{ borderColor: accent }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: active ? accent : "var(--color-muted)" }}
      />
      {isTogglingAvailability ? "Updating..." : (active ? "Active" : "Away")}
    </button>
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

function JobDetail({ job, accent, onAccent, onAccept, onReject, onEscalate, onResolve, onAskAi, assetsList = [] }) {
  const [stage, setStage] = useState("pending");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [aiAsked, setAiAsked] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [assetNumber, setAssetNumber] = useState("");
  const [steps, setSteps] = useState([""]);
  const [duration, setDuration] = useState("");
  const [published, setPublished] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(null); // "accept", "reject", "escalate", "resolve_publish", "resolve_save", "ask_ai"
  const [showEscalatePopup, setShowEscalatePopup] = useState(false);
  const stepRefs = useRef([]);
  const ticketId = job.ticketId ?? job.id;

  // Resolve the technician's own id once, used to tell "my" bubbles apart from staff's
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  // Load chat history the first time the thread is opened
  useEffect(() => {
    if (!chatOpen) return;

    let cancelled = false;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const history = await apiFetch(`/tickets/${ticketId}/messages`, {}, "Failed to load chat history");
        if (!cancelled) setMessages(history || []);
      } catch (err) {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };
    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [chatOpen, ticketId]);

  // Realtime subscription so new staff messages appear without reopening the thread
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`ticket_messages:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            if (payload.new.sender_id !== userId) {
              playNotificationSound();
            }
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, userId]);

  const sendMessage = async () => {
    const body = chatInput.trim();
    if (!body) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      body,
      sender_id: userId,
      sender_role: "technician",
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((m) => [...m, tempMessage]);
    setChatInput("");

    try {
      const sent = await apiFetch(
        `/tickets/${ticketId}/messages`,
        { method: "POST", body: JSON.stringify({ body }) },
        "Failed to send message"
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...sent, status: "delivered" } : m))
      );
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)));
    }
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
    setSubmittingAction("accept");
    try {
      await onAccept?.(ticketId);
      setStage("working");
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleReject = async () => {
    setSubmittingAction("reject");
    try {
      await onReject?.(ticketId);
      setStage("rejected");
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleEscalate = async () => {
    setSubmittingAction("escalate");
    try {
      await onEscalate?.(ticketId);
      setStage("escalated");
      setShowEscalatePopup(true);
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleResolve = async (isPublished) => {
    setSubmittingAction(isPublished ? "resolve_publish" : "resolve_save");
    const cleanedSteps = steps.map((s) => s.trim()).filter(Boolean);

    try {
      await onResolve?.({
        ticketId,
        steps: cleanedSteps.length ? cleanedSteps : ["Issue inspected and resolved."],
        comment: `Time spent: ${duration || "Not specified"}.`,
        assetTag: assetNumber || undefined,
        publishRequested: isPublished
      });
      if (isPublished) {
        setPublished(true);
      } else {
        setSavedOnly(true);
      }
    } catch (err) {
      // Keep the UI state unchanged if the API call fails.
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleAskAi = async () => {
    if (!onAskAi) {
      setAiAsked(true);
      return;
    }

    setSubmittingAction("ask_ai");
    try {
      const response = await onAskAi(aiInput.trim(), assetNumber);
      const answer = typeof response === "string" ? response : response?.answer || response?.message || job.aiAnswer;
      setAiAsked(true);
      if (answer) {
        setAiInput(answer);
      }
    } catch (err) {
      setAiAsked(true);
      setAiInput(err.message || "Unable to load guidance.");
    } finally {
      setSubmittingAction(null);
    }
  };

  const completed = published || savedOnly;

  const statusLabel = {
    pending: "Awaiting response",
    rejected: "Rejected — reassigning",
    working: "In progress",
    resolving: "In progress",
    escalated: "Escalated",
  }[stage] || (completed ? "Completed" : "In progress");

  const statusStyle = {
    pending: { background: "var(--color-line)", color: "var(--color-muted)" },
    rejected: { background: "#fbeaea", color: "#a32d2d" },
    escalated: { background: "#faeeda", color: "#854f0b" },
  }[stage] || (completed
    ? { background: "#eaf3de", color: "#27500a" }
    : { background: "#e6f1fb", color: "#185fa5" });

  return (
    <div className="p-4 sm:p-5">
      {/* Escalate Popup */}
      {showEscalatePopup && (
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
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚨</div>
            <h2 style={{ color: '#854f0b', marginBottom: '15px', fontWeight: 'bold' }}>Issue Escalated</h2>
            <p style={{ color: 'var(--text-main, #333)', marginBottom: '25px', lineHeight: '1.5' }}>
              This ticket has been successfully escalated to the supervisor for further review.
            </p>
            <button 
              style={{ width: '100%', background: '#854f0b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setShowEscalatePopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[16px] font-semibold">{job.title}</p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">{job.ticket}</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
            📍 {job.location}
          </p>
        </div>
        <span className="w-fit px-3 py-1 text-[12px] font-medium" style={statusStyle}>
          {completed ? "Completed" : statusLabel}
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
                {loadingMessages ? (
                  <p className="text-[13px] text-[var(--color-muted)]">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-[13px] text-[var(--color-muted)]">No messages yet.</p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === userId;
                    return (
                      <div
                        key={m.id}
                        className="max-w-[80%] px-2.5 py-2 text-[13px]"
                        style={
                          isMine
                            ? { alignSelf: "flex-end", background: accent, color: onAccent }
                            : { alignSelf: "flex-start", background: "#f1efe8" }
                        }
                      >
                        {m.body}
                      </div>
                    );
                  })
                )}
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

          <div className="border border-[var(--color-line)] p-3 mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
              Linked Asset
            </label>
            <input
              list="assets-list"
              value={assetNumber}
              onChange={(e) => setAssetNumber(e.target.value)}
              placeholder="Search by asset tag or name..."
              className="mt-2 w-full border border-[var(--color-line)] px-2.5 py-2 text-[14px]"
              disabled={completed}
            />
            <datalist id="assets-list">
              {assetsList.map((a) => (
                <option key={a.id} value={a.asset_tag}>
                  {a.name} ({a.category})
                </option>
              ))}
            </datalist>
          </div>

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
                disabled={submittingAction !== null}
                className="border border-[var(--color-ink)] px-3 py-2 text-[13px] font-semibold disabled:opacity-50"
              >
                {submittingAction === "ask_ai" ? "Generating..." : "Ask"}
              </button>
            </div>
            {aiAsked && <div className="mt-3 text-[13px] text-[var(--color-muted)] bg-[#f7f7f7] p-3 border border-dashed border-[#e2e8f0] rounded">{formatAiResponse(aiInput)}</div>}
          </div>

          {!completed && stage !== "resolving" && (
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#e6f1fb" }}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#185fa5" }} />
              <span className="text-[13px]" style={{ color: "#185fa5" }}>
                In progress — {job.staffName} will be notified once this is completed
              </span>
            </div>
          )}

          {!completed && stage !== "resolving" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleEscalate}
                disabled={submittingAction !== null}
                className="flex-1 border py-2.5 text-[14px] font-semibold disabled:opacity-50"
                style={{ background: "#faeeda", color: "#854f0b", borderColor: "#854f0b" }}
              >
                {submittingAction === "escalate" ? "Escalating..." : "Escalate issue"}
              </button>
              <button
                onClick={() => setStage("resolving")}
                disabled={submittingAction !== null}
                className="flex-1 border py-2.5 text-[14px] font-semibold disabled:opacity-50"
                style={{ background: accent, borderColor: accent, color: onAccent }}
              >
                Mark as completed
              </button>
            </div>
          )}

          {stage === "resolving" && !completed && (
            <div className="bg-[#f7f7f7] p-4">
              <p className="text-[15px] font-semibold">Add this to the knowledge base</p>

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
                  disabled={submittingAction !== null}
                  className="flex-1 border py-2.5 text-[14px] font-semibold disabled:opacity-50"
                  style={{ background: accent, borderColor: accent, color: onAccent }}
                >
                  {submittingAction === "resolve_publish" ? "Publishing..." : "Publish article"}
                </button>
                <button
                  onClick={() => handleResolve(false)}
                  disabled={submittingAction !== null}
                  className="flex-1 border border-[var(--color-ink)] py-2.5 text-[14px] font-semibold disabled:opacity-50"
                >
                  {submittingAction === "resolve_save" ? "Saving..." : "Save and mark as done"}
                </button>
              </div>
            </div>
          )}

          {published && (
            <p className="text-[13px] text-[#27500a]">Article added to the knowledge base.</p>
          )}

          {completed && (
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSkill = async () => {
    if (!value.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddSkill(value.trim());
      setValue("");
      setShowInput(false);
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
          />
          <button onClick={addSkill} disabled={isSubmitting} className="border border-[var(--color-ink)] bg-[var(--color-ink)] px-3 text-[13px] font-semibold text-[var(--color-bg)] disabled:opacity-50">
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TechnicianDashboard() {
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [bio, setBio] = useState("Field technician specialising in networking and hardware repair.");
  const [avatar, setAvatar] = useState("headset");
  const [active, setActive] = useState(false);
  const [greenTheme, setGreenTheme] = useState(() => {
    const saved = localStorage.getItem('technician_theme');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('technician_theme', greenTheme);
  }, [greenTheme]);
  const [view, setView] = useState("queue");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [solvedHistory, setSolvedHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kbSearch, setKbSearch] = useState("");
  const [assetsList, setAssetsList] = useState([]);
  
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [escalationSuccessPopup, setEscalationSuccessPopup] = useState(false);

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
        const activeTickets = (assignedTickets || []).filter(
          t => t.status !== "resolved" && t.status !== "closed"
        );
        setJobs(activeTickets.map(buildJobFromTicket));
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

      try {
        const assetsData = await apiFetch("/assets", {}, "Failed to load assets");
        setAssetsList(assetsData || []);
      } catch (err) {
        setAssetsList([]);
      }
    };

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase.channel('technician_tickets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tickets' },
          (payload) => {
            const isNewAssignment = 
              (payload.eventType === 'INSERT' && payload.new.assigned_to === user.id && payload.new.status === 'assigned') ||
              (payload.eventType === 'UPDATE' && payload.new.assigned_to === user.id && payload.new.status === 'assigned' && payload.old?.status !== 'assigned');
            
            if (isNewAssignment) {
              playNotificationSound();
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("New Ticket Assigned!", {
                  body: `Ticket #${payload.new.id}: ${payload.new.title || "Support Request"}`,
                  icon: "/favicon.svg"
                });
              }
              // Refresh the dashboard data to load the new ticket correctly
              // loadDashboardData(); 
              // Better to just push the new ticket into the active queue to avoid heavy network requests
              setJobs(prev => {
                // avoid duplicates
                if (prev.some(j => j.id === payload.new.id)) return prev;
                const newJob = buildJobFromTicket(payload.new);
                return [newJob, ...prev];
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    loadDashboardData();
    const cleanup = setupRealtime();
    
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, []);

  const goTo = (key) => {
    setView(key);
    setDrawerOpen(false);
  };

  const handleAvailabilityToggle = async () => {
    // Web Audio API needs a user gesture to unlock
    playNotificationSound(true); 
    
    if (!active && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const nextState = !active;
    setIsTogglingAvailability(true);
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
    } finally {
      setIsTogglingAvailability(false);
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
    setJobs(jobs => jobs.filter(j => j.id !== ticketId));
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
    setJobs(jobs => jobs.filter(j => j.id !== ticketId));
    setEscalationSuccessPopup(true);
  };

  const handleResolveTicket = async ({ ticketId, steps, comment, assetTag, publishRequested }) => {
    await apiFetch(
      `/tickets/${ticketId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ 
          status: "resolved", 
          steps, 
          comment, 
          asset_tag: assetTag,
          publish_requested: publishRequested
        }),
      },
      "Failed to mark the ticket as completed"
    );
    setJobs(jobs => jobs.filter(j => j.id !== ticketId));
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

    setIsSavingProfile(true);
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
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-3 px-4 py-5 sm:px-6">
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
              Welcome, {name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusToggle active={active} onToggle={handleAvailabilityToggle} accent={accent} isTogglingAvailability={isTogglingAvailability} />
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
            {hasJobs && !selectedJobId && (
              <div className="admin-livequeue-container">
                <div className="livequeue-header-row">
                  <h2 className="text-[18px] font-semibold">Your Assigned Tickets</h2>
                </div>
                <div className="queue-table-responsive">
                  <table className="queue-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ticket Subject</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="font-mono text-xs text-[var(--color-muted)]">T-{job.id}</td>
                        <td className="font-medium">{job.title}</td>
                        <td className="text-sm">{job.location}</td>
                        <td><StatusPill status={job.priority} /></td>
                        <td><StatusPill status={job.status} /></td>
                        <td>
                          <button
                            onClick={() => setSelectedJobId(job.id)}
                            className="rounded border px-3 py-1.5 text-[12px] font-semibold"
                            style={{ borderColor: accent, color: accent }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            )}
            {hasJobs && selectedJobId && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSelectedJobId(null)}
                  className="w-fit text-[13px] font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                >
                  ← Back to Queue
                </button>
                <div className="rounded-2xl border border-[var(--color-ink)] shadow-sm">
                  <JobDetail
                    key={selectedJobId}
                    job={jobs.find(j => j.id === selectedJobId) || jobs[0]}
                    accent={accent}
                    onAccent={onAccent}
                    onAccept={handleAcceptTicket}
                    onReject={handleRejectTicket}
                    onEscalate={handleEscalateTicket}
                    onResolve={handleResolveTicket}
                    onAskAi={handleAskAi}
                    assetsList={assetsList}
                  />
                </div>
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
              disabled={isSavingProfile}
              className="mt-4 rounded-lg border px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50"
              style={{ background: accent, borderColor: accent, color: onAccent }}
            >
              {isSavingProfile ? "Saving..." : "Save profile"}
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

      {/* Navigation drawer - slides in from the left */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-3/4 max-w-[320px] transform rounded-r-2xl bg-[var(--color-bg)] shadow-2xl transition-transform duration-300 ease-in-out md:w-[320px] ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
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

        <div className="absolute bottom-0 w-full border-t border-[var(--color-line)] p-3 bg-[var(--color-bg)]">
          <button
            onClick={() => setGreenTheme((g) => !g)}
            className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-semibold text-[var(--color-muted)]"
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

      {/* GLOBAL ESCALATION SUCCESS POPUP */}
      {escalationSuccessPopup && (
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
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚨</div>
            <h2 style={{ color: '#854f0b', marginBottom: '15px', fontWeight: 'bold' }}>Issue Escalated</h2>
            <p style={{ color: 'var(--text-main, #333)', marginBottom: '25px', lineHeight: '1.5' }}>
              This ticket has been successfully escalated to your supervisor for further review.
            </p>
            <button 
              style={{ width: '100%', background: '#854f0b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setEscalationSuccessPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
