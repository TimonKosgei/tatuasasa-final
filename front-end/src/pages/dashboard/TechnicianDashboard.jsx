import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../config/api";
import { supabase } from "../../config/SupabaseClient";
import { playNotificationSound } from "../../utils/sound";
import "./stafflive.css";
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
    staffName: ticket.staff_name || "Staff",
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
  const getInitialStage = (status) => {
    switch (status) {
      case 'assigned': return 'pending';
      case 'in_progress': return 'working';
      case 'escalated': return 'escalated';
      case 'resolved': return 'working';
      case 'closed': return 'working';
      default: return 'pending';
    }
  };
  const [stage, setStage] = useState(getInitialStage(job.status));
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [aiAsked, setAiAsked] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [assetNumber, setAssetNumber] = useState("");
  const [steps, setSteps] = useState([""]);
  const [duration, setDuration] = useState("");
  const [published, setPublished] = useState(false);
  const [savedOnly, setSavedOnly] = useState(job.status === 'resolved' || job.status === 'closed');
  const [submittingAction, setSubmittingAction] = useState(null); // "accept", "reject", "escalate", "resolve_publish", "resolve_save", "ask_ai"
  const [showEscalatePopup, setShowEscalatePopup] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const stepRefs = useRef([]);
  const ticketId = job.ticketId ?? job.id;

  useEffect(() => {
    setStage(getInitialStage(job.status));
    if (job.status === 'resolved' || job.status === 'closed') {
      setSavedOnly(true);
    }
  }, [job.status]);

  // Resolve the technician's own id once, used to tell "my" bubbles apart from staff's
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        setUserName(data.user.user_metadata?.full_name || data.user.email.split('@')[0]);
      }
    });
  }, []);

  // Load chat history when the thread is opened
  useEffect(() => {
    let cancelled = false;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const history = await apiFetch(`/tickets/${ticketId}/messages`, {}, "Failed to load chat history");
        if (!cancelled) {
          setMessages(history || []);
          if (history && history.length > 0) {
            apiFetch(`/tickets/${ticketId}/messages/read`, { method: 'PUT' }).catch(console.error);
          }
        }
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
  }, [ticketId]);

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
              apiFetch(`/tickets/${ticketId}/messages/read`, { method: 'PUT' }).catch(console.error);
            }
            return [...prev, payload.new];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
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
        prev.map((m) => (m.id === tempId ? { ...sent, status: "sent" } : m))
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
    <div className="flex flex-col h-full bg-slate-50">
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

      {/* Header Info */}
      <div className="bg-white px-6 pt-5 pb-4 border-b border-slate-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">T-{job.id}</span>
              <span className="w-fit px-2.5 py-0.5 rounded-full text-[11px] font-medium" style={statusStyle}>
                {completed ? "Completed" : statusLabel}
              </span>
              <StatusPill status={job.priority} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{job.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">📍 {job.location}</span>
              <span className="flex items-center gap-1">👤 {job.staffName}</span>
            </div>
          </div>
          
          {stage === "pending" && (
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:opacity-90"
                style={{ background: accent, color: onAccent }}
              >
                Accept Ticket
              </button>
              <button
                onClick={handleReject}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                Reject
              </button>
            </div>
          )}

          {stage !== "pending" && stage !== "rejected" && !completed && (
            <div className="flex gap-2 mt-4 sm:mt-0">
               {stage !== "escalated" && (
                 <button
                   onClick={() => setSubmittingAction('escalate')}
                   className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all shadow-sm"
                 >
                   Escalate
                 </button>
               )}
               {submittingAction === 'escalate' && (
                 <div className="absolute top-16 right-6 bg-white p-4 shadow-xl border border-slate-200 rounded-xl z-50 w-72">
                   <p className="text-sm font-semibold mb-2">Escalate to Supervisor</p>
                   <textarea
                     value={aiInput}
                     onChange={(e) => setAiInput(e.target.value)}
                     placeholder="Reason for escalation..."
                     className="w-full border rounded-lg p-2 text-sm mb-3"
                     rows={3}
                   />
                   <div className="flex gap-2">
                     <button onClick={handleEscalate} className="flex-1 bg-amber-600 text-white rounded-lg py-1.5 text-sm font-medium">Confirm</button>
                     <button onClick={() => setSubmittingAction(null)} className="flex-1 border text-slate-600 rounded-lg py-1.5 text-sm font-medium">Cancel</button>
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      {stage !== "pending" && stage !== "rejected" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Inner Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-6">
            {['overview', 'chat', 'ai', 'resolve'].map(tab => {
               if (tab === 'resolve' && completed) return null; // hide resolve tab if done
               return (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                     activeTab === tab ? 'border-[#185fa5] text-[#185fa5]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                   }`}
                 >
                   {tab === 'overview' && 'Overview'}
                   {tab === 'chat' && (
                     <span className="flex items-center gap-2">
                       Live Chat
                       {messages.length > 0 && <span className="bg-[#185fa5] text-white text-[10px] px-1.5 py-0.5 rounded-full">{messages.length}</span>}
                     </span>
                   )}
                   {tab === 'ai' && '✨ AI Assistant'}
                   {tab === 'resolve' && 'Resolution'}
                 </button>
               )
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-6 relative">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-3xl">
                {stage === "escalated" && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
                    <span className="text-amber-600 mt-0.5">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Escalated to a supervisor</p>
                      <p className="mt-1 text-sm text-amber-700">You can keep working on it or use the chat while waiting for a response.</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Issue Description</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">"{job.description}"</p>
                  
                  {job.fileName && (
                    <div className="mt-4 flex w-fit items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-600">📎 {job.fileName}</span>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                   <div className="mb-3">
                     <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Asset</h3>
                     <p className="text-xs text-slate-500 mt-1">If this issue is related to a specific device (e.g., a specific laptop, printer, or router), search and link its asset tag here. This helps track equipment history.</p>
                   </div>
                   <input
                      list="assets-list"
                      value={assetNumber}
                      onChange={(e) => setAssetNumber(e.target.value)}
                      placeholder="Search by asset tag or name..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#185fa5] focus:outline-none transition-shadow"
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
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[500px] max-w-3xl">
                 <div className="flex-1 overflow-y-auto p-4 chat-messages">
                    {loadingMessages ? (
                      <p className="text-sm text-slate-500 text-center py-8">Loading messages…</p>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">💬</div>
                         <p className="text-slate-800 font-medium">No messages yet</p>
                         <p className="text-sm text-slate-500 mt-1">Send a message to start the conversation with {job.staffName}.</p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMine = m.sender_id === userId;
                        const staffName = job.staffName || 'Staff';
                        const techName = userName || 'Me';
                        const avatarChar = isMine ? techName.charAt(0).toUpperCase() : staffName.charAt(0).toUpperCase();

                        return (
                          <div key={m.id} className={`message-row ${isMine ? 'sent' : 'received'}`}>
                            {!isMine && (
                              <div className="chat-avatar" style={{ backgroundColor: '#f59e0b' }} title={staffName}>
                                {avatarChar}
                              </div>
                            )}
                            <div className="message-wrapper">
                              <div className="message-bubble" style={isMine ? { backgroundColor: accent, color: onAccent } : {}}>
                                {m.body}
                              </div>
                              <div className="message-meta">
                                <span>
                                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMine && m.status === 'sent' && (
                                  <span className="delivered-icon" style={{ color: 'rgba(255,255,255,0.7)' }} title="Sent">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  </span>
                                )}
                                {isMine && m.status === 'read' && (
                                  <span className="delivered-icon" style={{ display: 'flex', color: '#60a5fa' }} title="Read">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-8px' }}>
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                 </div>
                 <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                    <textarea
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (chatInput.trim()) sendMessage();
                        }
                      }}
                      placeholder={`Message ${job.staffName}…`}
                      className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185fa5] transition-shadow"
                      rows={1}
                      style={{ maxHeight: '120px' }}
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!chatInput.trim()} 
                      className="w-10 h-10 rounded-full flex items-center justify-center self-end disabled:opacity-50 transition-transform active:scale-95"
                      style={{ backgroundColor: accent, color: onAccent }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-1px) translateY(1px)' }}>
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                 </div>
              </div>
            )}

            {/* AI TAB */}
            {activeTab === 'ai' && (
              <div className="max-w-3xl flex flex-col gap-4">
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5 shadow-sm">
                   <div className="flex items-center gap-2 mb-3">
                     <span className="text-xl">✨</span>
                     <h3 className="font-semibold text-slate-800">Tatua Sasa AI Guidance</h3>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                     <input
                       value={aiInput}
                       onChange={(e) => setAiInput(e.target.value)}
                       placeholder="E.g. What are the common causes for this issue?"
                       className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[#185fa5] focus:outline-none"
                     />
                     <button
                       onClick={handleAskAi}
                       disabled={submittingAction === "ask_ai" || !aiInput.trim()}
                       className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                     >
                       {submittingAction === "ask_ai" ? "Thinking..." : "Ask AI"}
                     </button>
                   </div>
                 </div>

                 {aiAsked && (
                   <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm prose prose-sm max-w-none prose-slate">
                      {formatAiResponse(aiInput)}
                   </div>
                 )}
              </div>
            )}

            {/* RESOLUTION TAB */}
            {activeTab === 'resolve' && !completed && (
              <div className="max-w-3xl space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-800 mb-4">Log Resolution</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Steps taken</label>
                      <div className="space-y-2">
                        {steps.map((step, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="mt-2 text-xs font-mono text-slate-400">{i + 1}.</span>
                            <textarea
                              ref={(el) => (stepRefs.current[i] = el)}
                              value={step}
                              onChange={(e) => updateStep(i, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  appendStep();
                                } else if (e.key === "Backspace" && step === "" && i > 0) {
                                  e.preventDefault();
                                  removeStep(i);
                                }
                              }}
                              className="flex-1 resize-none border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185fa5]"
                              rows={1}
                            />
                            {steps.length > 1 && (
                              <button onClick={() => removeStep(i)} className="mt-2 text-slate-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={appendStep} className="mt-3 text-sm font-medium text-[#185fa5] hover:underline">+ Add step</button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Time spent</label>
                      <input
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g. 45m, 1.5h"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                   <button
                     onClick={() => handleResolve(true)}
                     disabled={submittingAction}
                     className="flex-1 py-3 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                     style={{ background: accent, color: onAccent }}
                   >
                     {submittingAction === "resolve_publish" ? "Resolving..." : "Resolve & Publish to KB"}
                   </button>
                   <button
                     onClick={() => handleResolve(false)}
                     disabled={submittingAction}
                     className="flex-1 py-3 rounded-lg text-sm font-semibold bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                   >
                     {submittingAction === "resolve_save" ? "Resolving..." : "Resolve (Save only)"}
                   </button>
                </div>
              </div>
            )}
          </div>
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
  const [ticketTab, setTicketTab] = useState("pending");
  window.ticketTab = ticketTab;
  window.setTicketTab = setTicketTab;
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
              <div className="rounded-2xl border border-[var(--color-line)] p-8 text-center bg-white shadow-sm">
                <p className="text-[15px] font-semibold">No jobs assigned yet</p>
                <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                  Jobs will show up here automatically once one is assigned to you.
                </p>
              </div>
            )}
            {hasJobs && !selectedJobId && (
              <div className="admin-livequeue-container shadow-sm border-0 bg-transparent">
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold text-slate-800">Your Tickets</h2>
                </div>
                
                {/* Kanban Tabs */}
                <div className="flex border-b border-slate-200 mb-4 bg-white rounded-t-xl px-4 pt-2">
                  {['pending', 'working', 'completed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => window.setTicketTab && window.setTicketTab(tab)}
                      className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                        (window.ticketTab || 'pending') === tab ? 'border-[#185fa5] text-[#185fa5]' : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab === 'pending' && 'New / Pending'}
                      {tab === 'working' && 'In Progress'}
                      {tab === 'completed' && 'Completed'}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200 overflow-hidden">
                  <div className="queue-table-responsive">
                    <table className="queue-table">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff / Creator</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobs.filter(j => {
                        const tab = window.ticketTab || 'pending';
                        if (tab === 'pending') return j.status === 'assigned';
                        if (tab === 'working') return j.status === 'in_progress' || j.status === 'escalated';
                        if (tab === 'completed') return j.status === 'resolved' || j.status === 'closed';
                        return true;
                      }).map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">T-{job.id}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{job.title}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 font-medium">👤 {job.staffName}</td>
                          <td className="py-3 px-4 text-sm text-slate-500">{job.location}</td>
                          <td className="py-3 px-4"><StatusPill status={job.priority} /></td>
                          <td className="py-3 px-4"><StatusPill status={job.status} /></td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedJobId(job.id)}
                              className="rounded-lg border px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-50"
                              style={{ borderColor: accent, color: accent }}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                      {jobs.filter(j => {
                        const tab = window.ticketTab || 'pending';
                        if (tab === 'pending') return j.status === 'assigned';
                        if (tab === 'working') return j.status === 'in_progress' || j.status === 'escalated';
                        if (tab === 'completed') return j.status === 'resolved' || j.status === 'closed';
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-sm text-slate-500">
                            No tickets in this section.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            )}
{hasJobs && selectedJobId && (
              <div className="fixed inset-0 z-[100] bg-slate-100 overflow-hidden flex flex-col">
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedJobId(null)}
                      className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">Working on Ticket T-{selectedJobId}</h2>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                  <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[80vh]">
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
